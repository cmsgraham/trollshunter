from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # X OAuth fields
    x_user_id = Column(String(64), unique=True, nullable=True, index=True)
    x_username = Column(String(255), nullable=True)
    x_display_name = Column(String(255), nullable=True)
    x_profile_image_url = Column(String(512), nullable=True)
    x_access_token = Column(String(512), nullable=True)
    # Local auth fields
    username = Column(String(255), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    # Common
    display_name = Column(String(255), nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    reported_trolls = relationship("TrollReport", back_populates="reporter")
    votes = relationship("Vote", back_populates="user")


class Troll(Base):
    __tablename__ = "trolls"

    id = Column(Integer, primary_key=True, autoincrement=True)
    x_username = Column(String(255), unique=True, nullable=False, index=True)
    x_display_name = Column(String(255), nullable=True)
    x_profile_image_url = Column(String(512), nullable=True)
    x_banner_url = Column(String(512), nullable=True)
    bio = Column(Text, nullable=True)
    recent_posts = Column(Text, nullable=True)  # JSON array of last 5 tweet texts
    category = Column(String(50), nullable=False, default="troll")
    country = Column(String(2), nullable=True, index=True)  # ISO 3166-1 alpha-2
    total_reports = Column(Integer, default=1)
    upvotes = Column(Integer, default=0)
    downvotes = Column(Integer, default=0)
    is_verified_troll = Column(Boolean, default=False)  # Community verified
    is_approved = Column(Boolean, default=False)  # Admin approved
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    reports = relationship("TrollReport", back_populates="troll")
    votes = relationship("Vote", back_populates="troll")

    __table_args__ = (
        Index("ix_trolls_category", "category"),
        Index("ix_trolls_upvotes", "upvotes"),
    )


class TrollReport(Base):
    __tablename__ = "troll_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    troll_id = Column(Integer, ForeignKey("trolls.id"), nullable=False)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)
    evidence_url = Column(String(512), nullable=True)  # Link to tweet etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    troll = relationship("Troll", back_populates="reports")
    reporter = relationship("User", back_populates="reported_trolls")

    __table_args__ = (
        UniqueConstraint("troll_id", "reporter_id", name="uq_troll_reporter"),
    )


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    troll_id = Column(Integer, ForeignKey("trolls.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(String(10), nullable=False)  # "up" or "down"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    troll = relationship("Troll", back_populates="votes")
    user = relationship("User", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("troll_id", "user_id", name="uq_troll_user_vote"),
    )



