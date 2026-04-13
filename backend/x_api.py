"""X (Twitter) API v2 client for user lookup and blocking."""

import httpx
from typing import Optional

from config import get_settings

settings = get_settings()

X_API_BASE = "https://api.x.com/2"


async def lookup_user_by_username(username: str, bearer_token: str) -> Optional[dict]:
    """Look up an X user by their username using app-level bearer token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{X_API_BASE}/users/by/username/{username}",
            headers={"Authorization": f"Bearer {bearer_token}"},
            params={"user.fields": "id,name,username,profile_image_url,description"},
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("data")
        return None


async def lookup_user_by_id(user_id: str, bearer_token: str) -> Optional[dict]:
    """Look up an X user by their ID."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{X_API_BASE}/users/{user_id}",
            headers={"Authorization": f"Bearer {bearer_token}"},
            params={"user.fields": "id,name,username,profile_image_url,description"},
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("data")
        return None


async def block_user(
    source_user_id: str,
    target_user_id: str,
    user_access_token: str,
) -> dict:
    """
    Block a user on X. Requires the authenticated user's OAuth 2.0 access token.
    Returns {"blocked": True} on success.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{X_API_BASE}/users/{source_user_id}/blocking",
            headers={
                "Authorization": f"Bearer {user_access_token}",
                "Content-Type": "application/json",
            },
            json={"target_user_id": target_user_id},
        )
        if response.status_code == 200:
            return {"blocked": True, "error": None}
        else:
            error_detail = response.json() if response.content else {"detail": "Unknown error"}
            return {"blocked": False, "error": str(error_detail)}


async def unblock_user(
    source_user_id: str,
    target_user_id: str,
    user_access_token: str,
) -> dict:
    """Unblock a user on X."""
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{X_API_BASE}/users/{source_user_id}/blocking/{target_user_id}",
            headers={
                "Authorization": f"Bearer {user_access_token}",
            },
        )
        if response.status_code == 200:
            return {"unblocked": True, "error": None}
        else:
            error_detail = response.json() if response.content else {"detail": "Unknown error"}
            return {"unblocked": False, "error": str(error_detail)}


async def get_authenticated_user(user_access_token: str) -> Optional[dict]:
    """Get the authenticated user's profile using their OAuth token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{X_API_BASE}/users/me",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={"user.fields": "id,name,username,profile_image_url"},
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("data")
        return None
