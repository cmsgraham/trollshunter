"""Admin routes for managing troll reports."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload, subqueryload
from sqlalchemy import func

from database import get_db
from models import Troll, TrollReport, User
from schemas import TrollOut, TrollListOut, ReportOut
from routers.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def troll_to_out(troll: Troll) -> TrollOut:
    obj = troll.__dict__.copy()
    obj["reports"] = [
        ReportOut(
            id=r.id,
            reporter_username=r.reporter.x_username or r.reporter.username if r.reporter else None,
            reporter_display_name=r.reporter.x_display_name or r.reporter.display_name if r.reporter else None,
            reporter_profile_image_url=r.reporter.x_profile_image_url if r.reporter else None,
            reason=r.reason,
            evidence_url=r.evidence_url,
            created_at=r.created_at,
        )
        for r in (troll.reports if troll.reports else [])
    ]
    data = TrollOut.model_validate(obj)
    data.profile_url = f"https://x.com/{troll.x_username}"
    data.block_url = f"https://x.com/intent/user?screen_name={troll.x_username}"
    return data


@router.get("/pending", response_model=TrollListOut)
async def list_pending(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List trolls pending approval."""
    query = db.query(Troll).options(subqueryload(Troll.reports).joinedload(TrollReport.reporter)).filter(Troll.is_approved == False)
    total = query.count()
    trolls = query.order_by(Troll.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return TrollListOut(
        trolls=[troll_to_out(t) for t in trolls],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/{troll_id}/approve")
async def approve_troll(
    troll_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Approve a troll report to make it publicly visible."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")
    troll.is_approved = True
    db.commit()
    return {"success": True, "message": f"@{troll.x_username} approved"}


@router.post("/{troll_id}/reject")
async def reject_troll(
    troll_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Reject and delete a troll report."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")
    db.delete(troll)
    db.commit()
    return {"success": True, "message": f"@{troll.x_username} rejected and removed"}


@router.get("/disputed", response_model=TrollListOut)
async def list_disputed(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List approved trolls that have received disputes (downvotes > 0)."""
    query = db.query(Troll).options(subqueryload(Troll.reports).joinedload(TrollReport.reporter)).filter(Troll.is_approved == True, Troll.downvotes > 0)
    total = query.count()
    trolls = query.order_by(Troll.downvotes.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return TrollListOut(
        trolls=[troll_to_out(t) for t in trolls],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/{troll_id}/dismiss")
async def dismiss_disputes(
    troll_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Dismiss disputes on a troll (reset downvotes to 0, keep it approved)."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")
    troll.downvotes = 0
    db.commit()
    return {"success": True, "message": f"Disputes dismissed for @{troll.x_username}"}


@router.post("/{troll_id}/remove")
async def remove_troll(
    troll_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Remove an approved troll from the list (disputes upheld)."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")
    db.delete(troll)
    db.commit()
    return {"success": True, "message": f"@{troll.x_username} removed"}


@router.post("/make-admin/{user_id}")
async def make_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Promote a user to admin."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"success": True, "message": f"User {user.display_name or user.username} is now admin"}
