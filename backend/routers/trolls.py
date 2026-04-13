"""Troll list management routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import httpx

from database import get_db
from models import Troll, TrollReport, User
from schemas import TrollCreate, TrollOut, TrollListOut, VALID_CATEGORIES
from routers.deps import get_current_user
from profile_scraper import fetch_x_profile

router = APIRouter(prefix="/trolls", tags=["trolls"])


def troll_to_out(troll: Troll) -> TrollOut:
    """Convert a Troll model to TrollOut with profile/block URLs."""
    obj = troll.__dict__.copy()
    data = TrollOut.model_validate(obj)
    data.profile_url = f"https://x.com/{troll.x_username}"
    data.block_url = f"https://x.com/intent/user?screen_name={troll.x_username}"
    return data


@router.get("", response_model=TrollListOut)
async def list_trolls(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
    country: str | None = Query(default=None, min_length=2, max_length=2),
    search: str | None = Query(default=None, max_length=100),
    sort_by: str = Query(default="upvotes", pattern=r"^(upvotes|total_reports|created_at)$"),
    db: Session = Depends(get_db),
):
    """List approved trolls/bots with pagination, filtering, and sorting."""
    query = db.query(Troll).filter(Troll.is_approved == True)

    if category and category in VALID_CATEGORIES:
        query = query.filter(Troll.category == category)

    if country:
        query = query.filter(Troll.country == country.upper())

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Troll.x_username.ilike(search_term)) | (Troll.x_display_name.ilike(search_term))
        )

    total = query.count()

    sort_column = getattr(Troll, sort_by)
    query = query.order_by(sort_column.desc())

    trolls = query.offset((page - 1) * per_page).limit(per_page).all()

    return TrollListOut(
        trolls=[troll_to_out(t) for t in trolls],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/stats/summary")
async def get_stats(db: Session = Depends(get_db)):
    """Get summary statistics for the troll database."""
    total_trolls = db.query(func.count(Troll.id)).filter(Troll.is_approved == True).scalar()
    verified_trolls = db.query(func.count(Troll.id)).filter(Troll.is_approved == True, Troll.is_verified_troll.is_(True)).scalar()
    total_reports = db.query(func.count(TrollReport.id)).scalar()
    pending = db.query(func.count(Troll.id)).filter(Troll.is_approved == False).scalar()

    by_category = (
        db.query(Troll.category, func.count(Troll.id))
        .filter(Troll.is_approved == True)
        .group_by(Troll.category)
        .all()
    )

    return {
        "total_trolls": total_trolls,
        "verified_trolls": verified_trolls,
        "total_reports": total_reports,
        "pending_approval": pending,
        "by_category": {cat: count for cat, count in by_category},
    }


@router.get("/{troll_id}", response_model=TrollOut)
async def get_troll(troll_id: int, db: Session = Depends(get_db)):
    """Get a specific troll's details."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")
    return troll_to_out(troll)


@router.post("", response_model=TrollOut, status_code=201)
async def report_troll(
    data: TrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Report a user as a troll/bot. If already reported, adds a new report.
    """
    # Check if already in our database
    troll = db.query(Troll).filter(
        func.lower(Troll.x_username) == data.x_username.lower()
    ).first()

    if troll:
        # Check if this user already reported this troll
        existing_report = db.query(TrollReport).filter(
            TrollReport.troll_id == troll.id,
            TrollReport.reporter_id == current_user.id,
        ).first()

        if existing_report:
            raise HTTPException(status_code=409, detail="You have already reported this user")

        troll.total_reports += 1

        # Auto-verify if enough reports
        if troll.total_reports >= 5:
            troll.is_verified_troll = True
    else:
        # Fetch profile info from X's public page
        profile = await fetch_x_profile(data.x_username)
        troll = Troll(
            x_username=data.x_username,
            x_display_name=profile.get("display_name"),
            x_profile_image_url=profile.get("profile_image_url"),
            x_banner_url=profile.get("banner_url"),
            bio=profile.get("bio"),
            followers_count=profile.get("followers_count"),
            category=data.category,
            country=data.country.upper() if data.country else None,
            is_approved=False,
        )
        db.add(troll)
        db.flush()

    # Create the report
    report = TrollReport(
        troll_id=troll.id,
        reporter_id=current_user.id,
        reason=data.reason,
        evidence_url=data.evidence_url,
    )
    db.add(report)
    db.commit()
    db.refresh(troll)

    return troll_to_out(troll)


@router.post("/{troll_id}/block")
async def block_troll(
    troll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Block a troll on X using the authenticated user's OAuth token."""
    if not current_user.x_access_token or not current_user.x_user_id:
        raise HTTPException(
            status_code=400,
            detail="You must be logged in with X to block users",
        )

    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")

    # Look up the troll's X user ID
    async with httpx.AsyncClient() as client:
        # First get the target user's ID by username
        lookup_res = await client.get(
            f"https://api.x.com/2/users/by/username/{troll.x_username}",
            headers={"Authorization": f"Bearer {current_user.x_access_token}"},
        )
        print(f"[BLOCK] Lookup {troll.x_username}: {lookup_res.status_code} {lookup_res.text}")
        if lookup_res.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Failed to look up user on X: {lookup_res.text}")

        target_id = lookup_res.json().get("data", {}).get("id")
        if not target_id:
            raise HTTPException(status_code=404, detail="X user not found")

        # Block the user
        block_res = await client.post(
            f"https://api.x.com/2/users/{current_user.x_user_id}/blocking",
            headers={
                "Authorization": f"Bearer {current_user.x_access_token}",
                "Content-Type": "application/json",
            },
            json={"target_user_id": target_id},
        )
        print(f"[BLOCK] Block response: {block_res.status_code} {block_res.text}")

        if block_res.status_code == 200:
            return {"success": True, "message": f"@{troll.x_username} blocked on X"}
        elif block_res.status_code == 401:
            raise HTTPException(status_code=401, detail="X session expired. Please log in again.")
        else:
            raise HTTPException(status_code=502, detail=f"Failed to block user on X: {block_res.text}")
