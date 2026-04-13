"""TrollHunter API - Community-driven troll/bot blocklist for X."""

import asyncio
from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr
import httpx

from config import get_settings
from database import init_db
from routers import auth_router, trolls, votes, admin
from visitor_tracker import router as tracking_router, _sync_loop

settings = get_settings()

import os

_is_production = os.getenv("FRONTEND_URL", "").startswith("https://")

app = FastAPI(
    title="TrollHunter API",
    description="Community-driven troll and bot blocklist for X (Twitter)",
    version="1.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(trolls.router)
app.include_router(votes.router)
app.include_router(admin.router)
app.include_router(tracking_router)


@app.on_event("startup")
async def on_startup():
    init_db()
    # Start background S3 sync for visitor logs
    asyncio.create_task(_sync_loop())


@app.get("/")
async def root():
    return {
        "app": "TrollHunter",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/geo")
async def detect_country(request: Request):
    """Detect country from client IP using ip-api.com."""
    client_ip = request.headers.get("x-forwarded-for", request.client.host)
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
    # Localhost / private IPs can't be geolocated
    if client_ip in ("127.0.0.1", "::1", "localhost") or client_ip.startswith(("10.", "192.168.", "172.")):
        return {"country_code": "US", "country_name": "United States"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"http://ip-api.com/json/{client_ip}?fields=countryCode,country")
            if resp.status_code == 200:
                data = resp.json()
                return {"country_code": data.get("countryCode", "US"), "country_name": data.get("country", "United States")}
    except Exception:
        pass
    return {"country_code": "US", "country_name": "United States"}


@app.get("/proxy/image")
async def proxy_image(url: str = Query(...)):
    allowed = ("https://pbs.twimg.com/", "https://abs.twimg.com/")
    if not url.startswith(allowed):
        return Response(status_code=400, content=b"URL not allowed")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
    if resp.status_code != 200:
        return Response(status_code=resp.status_code)
    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/jpeg"),
        headers={"Cache-Control": "public, max-age=86400"},
    )


class UnsubscribeRequest(BaseModel):
    email: EmailStr


@app.post("/unsubscribe")
async def unsubscribe_email(data: UnsubscribeRequest):
    """Add email to unsubscribe list."""
    from database import get_db
    from models import Unsubscribe as UnsubModel
    db = next(get_db())
    try:
        existing = db.query(UnsubModel).filter(UnsubModel.email == data.email.lower()).first()
        if not existing:
            db.add(UnsubModel(email=data.email.lower()))
            db.commit()
        return {"success": True, "message": "Unsubscribed"}
    finally:
        db.close()
