"""Authentication: JWT tokens + X OAuth 2.0 with PKCE."""

import secrets
import hashlib
import base64
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode

import httpx
from jose import jwt

from config import get_settings

settings = get_settings()

# X OAuth 2.0 endpoints
X_AUTH_URL = "https://x.com/i/oauth2/authorize"
X_TOKEN_URL = "https://api.x.com/2/oauth2/token"
X_USER_ME_URL = "https://api.x.com/2/users/me"

SCOPES = ["tweet.read", "users.read"]

# In-memory store for PKCE state (use Redis in production)
_pkce_store: dict[str, dict] = {}


def generate_pkce_pair() -> tuple[str, str]:
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return code_verifier, code_challenge


def get_authorization_url() -> tuple[str, str]:
    """Build X OAuth 2.0 authorization URL with PKCE."""
    state = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce_pair()

    _pkce_store[state] = {
        "code_verifier": code_verifier,
        "created_at": datetime.now(timezone.utc),
    }

    # Clean up expired entries
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    expired = [k for k, v in _pkce_store.items() if v["created_at"] < cutoff]
    for k in expired:
        _pkce_store.pop(k, None)

    params = {
        "response_type": "code",
        "client_id": settings.x_client_id,
        "redirect_uri": settings.x_callback_url,
        "scope": " ".join(SCOPES),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{X_AUTH_URL}?{urlencode(params)}", state


async def exchange_code_for_token(code: str, state: str) -> dict | None:
    """Exchange authorization code for access token."""
    pkce_data = _pkce_store.pop(state, None)
    if not pkce_data:
        return None

    async with httpx.AsyncClient() as client:
        response = await client.post(
            X_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.x_callback_url,
                "client_id": settings.x_client_id,
                "code_verifier": pkce_data["code_verifier"],
            },
            auth=(settings.x_client_id, settings.x_client_secret),
        )
        if response.status_code == 200:
            return response.json()
        return None


async def get_x_user_profile(access_token: str) -> dict | None:
    """Get user profile from X using their OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            X_USER_ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"user.fields": "id,name,username,profile_image_url"},
        )
        if response.status_code == 200:
            return response.json().get("data")
        return None


def create_app_token(user_id: int, identifier: str) -> str:
    """Create a JWT token for session management."""
    payload = {
        "sub": str(user_id),
        "identifier": identifier,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.app_secret_key, algorithm="HS256")


def verify_app_token(token: str) -> dict | None:
    """Verify and decode a JWT token."""
    try:
        return jwt.decode(token, settings.app_secret_key, algorithms=["HS256"])
    except jwt.JWTError:
        return None
