"""Block management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Troll, BlockRecord, User
from schemas import BlockRequest, BlockResponse, BlockResult
from x_api import block_user
from routers.deps import get_current_user

router = APIRouter(prefix="/blocks", tags=["blocks"])


@router.post("", response_model=BlockResponse)
async def block_trolls(
    data: BlockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Block one or more trolls on X. Uses the authenticated user's OAuth token.
    Max 100 at a time to respect rate limits.
    """
    if not current_user.access_token:
        raise HTTPException(
            status_code=401,
            detail="No X access token. Please re-authenticate.",
        )

    trolls = db.query(Troll).filter(Troll.id.in_(data.troll_ids)).all()
    if not trolls:
        raise HTTPException(status_code=404, detail="No trolls found with the given IDs")

    results: list[BlockResult] = []
    total_blocked = 0
    total_failed = 0

    for troll in trolls:
        # Check if already blocked
        existing_block = db.query(BlockRecord).filter(
            BlockRecord.troll_id == troll.id,
            BlockRecord.user_id == current_user.id,
        ).first()

        if existing_block and existing_block.success:
            results.append(BlockResult(
                troll_id=troll.id,
                x_username=troll.x_username,
                success=True,
                error="Already blocked",
            ))
            continue

        # Execute block via X API
        result = await block_user(
            source_user_id=current_user.x_user_id,
            target_user_id=troll.x_user_id,
            user_access_token=current_user.access_token,
        )

        success = result.get("blocked", False)

        # Record the block attempt
        if existing_block:
            existing_block.success = success
        else:
            block_record = BlockRecord(
                troll_id=troll.id,
                user_id=current_user.id,
                success=success,
            )
            db.add(block_record)

        if success:
            troll.total_blocks += 1
            total_blocked += 1
        else:
            total_failed += 1

        results.append(BlockResult(
            troll_id=troll.id,
            x_username=troll.x_username,
            success=success,
            error=result.get("error"),
        ))

    db.commit()

    return BlockResponse(
        results=results,
        total_blocked=total_blocked,
        total_failed=total_failed,
    )


@router.get("/my-blocks")
async def get_my_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of trolls the current user has blocked through our app."""
    blocks = (
        db.query(BlockRecord)
        .filter(BlockRecord.user_id == current_user.id, BlockRecord.success.is_(True))
        .all()
    )

    troll_ids = [b.troll_id for b in blocks]
    trolls = db.query(Troll).filter(Troll.id.in_(troll_ids)).all() if troll_ids else []

    return {
        "total": len(trolls),
        "blocked_trolls": [
            {
                "id": t.id,
                "x_username": t.x_username,
                "x_display_name": t.x_display_name,
                "category": t.category,
            }
            for t in trolls
        ],
    }
