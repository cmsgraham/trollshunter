"""Voting routes for community validation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Troll, Vote, User
from schemas import VoteCreate, VoteOut
from routers.deps import get_current_user

router = APIRouter(prefix="/trolls/{troll_id}/votes", tags=["votes"])


@router.post("", response_model=VoteOut, status_code=201)
async def cast_vote(
    troll_id: int,
    data: VoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upvote or downvote a troll report. One vote per user per troll."""
    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if not troll:
        raise HTTPException(status_code=404, detail="Troll not found")

    # Check for existing vote
    existing_vote = db.query(Vote).filter(
        Vote.troll_id == troll_id,
        Vote.user_id == current_user.id,
    ).first()

    if existing_vote:
        if existing_vote.vote_type == data.vote_type:
            raise HTTPException(status_code=409, detail="You already cast this vote")

        # Change vote direction
        if existing_vote.vote_type == "up":
            troll.upvotes -= 1
        else:
            troll.downvotes -= 1

        existing_vote.vote_type = data.vote_type

        if data.vote_type == "up":
            troll.upvotes += 1
        else:
            troll.downvotes += 1

        db.commit()
        db.refresh(existing_vote)
        return existing_vote

    # New vote
    vote = Vote(
        troll_id=troll_id,
        user_id=current_user.id,
        vote_type=data.vote_type,
    )

    if data.vote_type == "up":
        troll.upvotes += 1
    else:
        troll.downvotes += 1

    # Auto-verify with enough upvotes
    if troll.upvotes >= 10:
        troll.is_verified_troll = True

    db.add(vote)
    db.commit()
    db.refresh(vote)

    return vote


@router.delete("")
async def remove_vote(
    troll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove your vote from a troll report."""
    vote = db.query(Vote).filter(
        Vote.troll_id == troll_id,
        Vote.user_id == current_user.id,
    ).first()

    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    troll = db.query(Troll).filter(Troll.id == troll_id).first()
    if troll:
        if vote.vote_type == "up":
            troll.upvotes = max(0, troll.upvotes - 1)
        else:
            troll.downvotes = max(0, troll.downvotes - 1)

    db.delete(vote)
    db.commit()

    return {"detail": "Vote removed"}
