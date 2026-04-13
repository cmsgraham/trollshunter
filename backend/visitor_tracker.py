"""Visitor tracking — /track endpoint + S3 sync."""

import json
import os
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from ua_parser import user_agent_parser
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("visitor_tracker")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(name)s - %(message)s"))
    logger.addHandler(handler)

DATA_DIR = Path("/app/data")
LOG_FILE = DATA_DIR / "visitors.json"

# S3 config from env
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "https://us-mia-1.linodeobjects.com")
S3_REGION = os.getenv("S3_REGION", "us-mia-1")
S3_ACCESS_KEY = os.getenv("LINODE_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("LINODE_SECRET_KEY", "")
S3_BUCKET = os.getenv("LINODE_BUCKET", "qrengagement")
S3_PREFIX = "trollshunter-visitors"

SYNC_INTERVAL = 5 * 60  # 5 minutes

router = APIRouter(tags=["tracking"])


def _ensure_log_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not LOG_FILE.exists():
        LOG_FILE.write_text("[]")


def _get_s3_client():
    if not S3_ACCESS_KEY or not S3_SECRET_KEY:
        return None
    return boto3.client(
        "s3",
        region_name=S3_REGION,
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
    )


def sync_to_s3():
    """Upload visitors.json to Linode Object Storage."""
    client = _get_s3_client()
    if not client:
        logger.warning("S3 credentials not configured, skipping sync")
        return

    if not LOG_FILE.exists():
        return

    body = LOG_FILE.read_bytes()

    # Current snapshot
    client.put_object(
        Bucket=S3_BUCKET,
        Key=f"{S3_PREFIX}/visitors.json",
        Body=body,
        ContentType="application/json",
    )

    # Timestamped backup
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    client.put_object(
        Bucket=S3_BUCKET,
        Key=f"{S3_PREFIX}/backups/visitors-{ts}.json",
        Body=body,
        ContentType="application/json",
    )
    logger.info("Visitor log synced to S3 (%d bytes)", len(body))


async def _sync_loop():
    """Background loop that syncs to S3 every SYNC_INTERVAL seconds."""
    await asyncio.sleep(10)  # Initial delay
    while True:
        try:
            sync_to_s3()
        except Exception as e:
            logger.error("S3 sync error: %s", e)
        await asyncio.sleep(SYNC_INTERVAL)


def _parse_ua(ua_string: str) -> dict:
    parsed = user_agent_parser.Parse(ua_string)
    browser = parsed.get("user_agent", {})
    os_info = parsed.get("os", {})
    device = parsed.get("device", {})
    return {
        "browser": {
            "name": browser.get("family"),
            "version": ".".join(
                filter(None, [browser.get("major"), browser.get("minor"), browser.get("patch")])
            ) or None,
        },
        "os": {
            "name": os_info.get("family"),
            "version": ".".join(
                filter(None, [os_info.get("major"), os_info.get("minor"), os_info.get("patch")])
            ) or None,
        },
        "device": {
            "type": "mobile" if device.get("family") not in (None, "Other", "Spider")
                    and device.get("brand") else None,
            "vendor": device.get("brand"),
            "model": device.get("model"),
        },
    }


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip", "")
    if real_ip:
        return real_ip
    return request.client.host if request.client else ""


@router.post("/track")
async def track_visit(request: Request):
    """Record a page visit. Called by the frontend on page load."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    ua_string = request.headers.get("user-agent", "")
    ua = _parse_ua(ua_string)
    ip = _get_client_ip(request)

    visitor = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip": ip,
        "method": "GET",
        "path": body.get("path", "/"),
        "userAgent": ua_string,
        "browser": ua["browser"],
        "os": ua["os"],
        "device": ua["device"],
        "referer": body.get("referer", request.headers.get("referer", "")),
        "acceptLanguage": request.headers.get("accept-language", ""),
        "acceptEncoding": request.headers.get("accept-encoding", ""),
        "connection": request.headers.get("connection", ""),
        "host": request.headers.get("host", ""),
        "dnt": request.headers.get("dnt", ""),
        "xForwardedFor": request.headers.get("x-forwarded-for", ""),
        "xRealIp": request.headers.get("x-real-ip", ""),
        "protocol": request.url.scheme,
        "secure": request.url.scheme == "https",
    }

    _ensure_log_file()
    try:
        data = json.loads(LOG_FILE.read_text())
    except (json.JSONDecodeError, FileNotFoundError):
        data = []
    data.append(visitor)
    LOG_FILE.write_text(json.dumps(data, indent=2))
    logger.info(
        "[%s] %s - %s - %s on %s",
        visitor["timestamp"], ip, visitor["path"],
        ua["browser"].get("name", "Unknown"), ua["os"].get("name", "Unknown"),
    )

    return JSONResponse({"ok": True}, status_code=200)
