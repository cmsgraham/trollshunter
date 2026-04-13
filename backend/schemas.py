from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re
import json


# --- User Schemas ---

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: Optional[str] = Field(default=None, max_length=255)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]{3,50}$", v):
            raise ValueError("Username must be alphanumeric (3-50 chars)")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: Optional[str] = None
    x_username: Optional[str] = None
    x_profile_image_url: Optional[str] = None
    display_name: Optional[str] = None
    is_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# --- Troll Schemas ---

VALID_CATEGORIES = ("troll", "bot", "spam", "hate", "politics", "sports", "entertainment", "news", "scam", "other")


class TrollCreate(BaseModel):
    x_username: str = Field(..., min_length=1, max_length=255)
    category: str = Field(default="troll")
    country: Optional[str] = Field(default=None, min_length=2, max_length=2)
    reason: Optional[str] = Field(default=None, max_length=1000)
    evidence_url: Optional[str] = Field(default=None, max_length=512)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        return v

    @field_validator("x_username")
    @classmethod
    def clean_username(cls, v: str) -> str:
        v = v.strip().lstrip("@")
        if not re.match(r"^[a-zA-Z0-9_]{1,15}$", v):
            raise ValueError("Invalid X username format")
        return v

    @field_validator("evidence_url")
    @classmethod
    def validate_evidence_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith(("https://x.com/", "https://twitter.com/")):
            raise ValueError("Evidence URL must be a link to x.com or twitter.com")
        return v


class TrollOut(BaseModel):
    id: int
    x_username: str
    x_display_name: Optional[str] = None
    x_profile_image_url: Optional[str] = None
    x_banner_url: Optional[str] = None
    bio: Optional[str] = None
    category: str
    country: Optional[str] = None
    followers_count: Optional[int] = None
    total_reports: int
    upvotes: int
    downvotes: int
    is_verified_troll: bool
    is_approved: bool = False
    created_at: datetime
    profile_url: str = ""
    block_url: str = ""

    class Config:
        from_attributes = True


class TrollAdminOut(TrollOut):
    reports: list['ReportOut'] = []


class TrollListOut(BaseModel):
    trolls: list[TrollOut]
    total: int
    page: int
    per_page: int


class TrollAdminListOut(BaseModel):
    trolls: list[TrollAdminOut]
    total: int
    page: int
    per_page: int


# --- Report Schemas ---

class ReportOut(BaseModel):
    id: int
    reporter_username: Optional[str] = None
    reporter_display_name: Optional[str] = None
    reporter_profile_image_url: Optional[str] = None
    reason: Optional[str] = None
    evidence_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReportDetailOut(ReportOut):
    troll_id: int
    troll_username: str
    troll_display_name: Optional[str] = None
    troll_profile_image_url: Optional[str] = None
    troll_category: str = "troll"
    troll_is_approved: bool = False


class ReportDetailListOut(BaseModel):
    reports: list[ReportDetailOut]
    total: int
    page: int
    per_page: int


# --- Vote Schemas ---

class VoteCreate(BaseModel):
    vote_type: str = Field(..., pattern=r"^(up|down)$")


class VoteOut(BaseModel):
    id: int
    troll_id: int
    vote_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Auth Schemas ---

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
