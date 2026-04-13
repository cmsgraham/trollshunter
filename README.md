# TrollHunter 🛡️

A community-driven blocklist platform for X (Twitter). Report trolls, bots, and spam accounts — then block them individually or in bulk.

## Features

- **Login with X** — OAuth 2.0 authentication
- **Report trolls** — Submit accounts with category (troll, bot, spam, hate) and evidence
- **Community voting** — Upvote/downvote reports to verify legitimacy
- **One-click blocking** — Block individual accounts directly from the list
- **Bulk blocking** — Select multiple accounts and block them all at once
- **Statistics** — Track community impact

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Frontend │────▶│  FastAPI Backend  │────▶│   X API v2  │
│   (Vite)        │     │  (Python)        │     │  (Twitter)  │
│   Port 5173     │     │  Port 8000       │     └─────────────┘
└─────────────────┘     │  SQLite DB       │
                        │  Visitor Tracker ─┼──▶ Linode Object Storage (S3)
                        └──────────────────┘           │
                                                       ▼
                        ┌──────────────────┐    ┌─────────────┐
                        │ Analytics Panel  │◀───│ qrengagement│
                        │ (local Node.js)  │    │   bucket    │
                        │ Port 4001        │    └─────────────┘
                        └──────────────────┘
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- X Developer Account ([setup guide](X_API_SETUP.md))

## Quick Start

### 1. Set up X API credentials

Follow the [X API Setup Guide](X_API_SETUP.md) to get your API keys.

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your X API credentials

# Run the server
uvicorn main:app --reload --port 8000
```

The API docs will be available at http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/login` | Get X OAuth authorization URL |
| GET | `/auth/callback` | OAuth callback handler |
| GET | `/auth/me` | Get current user profile |

### Trolls
| Method | Path | Description |
|--------|------|-------------|
| GET | `/trolls` | List reported trolls (paginated, filterable) |
| GET | `/trolls/{id}` | Get troll details |
| POST | `/trolls` | Report a new troll |
| GET | `/trolls/stats/summary` | Get community statistics |

### Votes
| Method | Path | Description |
|--------|------|-------------|
| POST | `/trolls/{id}/votes` | Vote on a troll report |
| DELETE | `/trolls/{id}/votes` | Remove your vote |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/pending` | List trolls pending approval |
| GET | `/admin/disputed` | List disputed trolls |
| GET | `/admin/reports` | List all reports with reporter + troll details |
| POST | `/admin/{id}/approve` | Approve a troll report |
| POST | `/admin/{id}/reject` | Reject and delete a report |
| POST | `/admin/{id}/dismiss` | Dismiss disputes on a troll |
| POST | `/admin/{id}/remove` | Remove a troll (disputes upheld) |

### Tracking
| Method | Path | Description |
|--------|------|-------------|
| POST | `/track` | Record a page visit (called by frontend on navigation) |

## Visitor Analytics

TrollShunter includes built-in visitor tracking that logs page visits on the production site and syncs the data to Linode Object Storage (S3-compatible). A local admin panel lets you view all analytics without exposing any data publicly.

### How It Works

1. **Frontend beacon** — On every route change, the React app sends a `POST /api/track` request with the current path and referer
2. **Backend logging** — `visitor_tracker.py` parses the user-agent (browser, OS, device), captures the client IP from proxy headers, and appends the visit to `/app/data/visitors.json`
3. **S3 sync** — A background async task uploads the visitor log to Linode Object Storage every 5 minutes, with timestamped backups
4. **Local admin panel** — A Node.js Express app reads from S3 and serves a dashboard at `http://127.0.0.1:4001` (local only)

### Data Collected Per Visit

| Field | Example |
|-------|---------|
| Timestamp | `2026-04-13T16:54:12.243Z` |
| IP Address | `143.255.29.93` |
| Path | `/`, `/report`, `/admin` |
| Browser | Chrome 124.0 |
| OS | macOS 14.4 |
| Device type | mobile / desktop / tablet |
| Referer | `https://x.com/...` |
| Language | `en-US` |
| DNT header | `1` |

### S3 Storage Layout

```
qrengagement/
  trollshunter-visitors/
    visitors.json              ← current snapshot (overwritten each sync)
    backups/
      visitors-2026-04-13T16-54-12.json   ← timestamped backups
      visitors-2026-04-13T17-00-00.json
      ...
```

### Running the Analytics Dashboard

```bash
# From the project root:
./analytics.sh

# Or manually:
cd analytics
npm install   # first time only
node admin.js
```

Opens at **http://127.0.0.1:4001** (local only, never exposed to the internet).

**Dashboard features:**
- Total visits, unique IPs, mobile/desktop breakdown, today's count
- Sortable table with all visit details
- Search/filter by IP, browser, OS, country, referer
- Click any IP to see full geolocation (country, city, ISP, map)
- CSV export
- Auto-refreshes from S3 every 15 seconds

### Analytics Configuration

The analytics panel needs Linode Object Storage credentials in `analytics/.env`:

```
LINODE_ACCESS_KEY=your_access_key
LINODE_SECRET_KEY=your_secret_key
LINODE_BUCKET=qrengagement
```

The backend needs the same credentials in its `.env.production` (already configured on the server):

```
LINODE_ACCESS_KEY=your_access_key
LINODE_SECRET_KEY=your_secret_key
LINODE_BUCKET=qrengagement
```

## How It Works

1. **Users log in** with their X account via OAuth 2.0
2. **Report accounts** by submitting a username, category, and optional evidence
3. **Community votes** validate reports — accounts with 5+ reports or 10+ upvotes become "verified"
4. **Block accounts** individually or in bulk — the app calls the X API on your behalf
5. **Everyone benefits** — as the list grows, new users can block known trolls instantly

## Deployment

For production deployment see [DEPLOY_GUIDE.txt](DEPLOY_GUIDE.txt).

The site runs on Docker Compose with 4 containers:
- **backend** — FastAPI + visitor tracker + S3 sync
- **frontend** — React (nginx-served static build)
- **nginx** — Reverse proxy with Let's Encrypt SSL
- **certbot** — Auto-renewing TLS certificates

### Deploy workflow

```bash
# 1. Commit and push
git add -A && git commit -m "your message" && git push origin main

# 2. SSH to server and rebuild
ssh trollshunter "cd /opt/trollhunter && sudo git pull origin main && sudo docker compose build --no-cache && sudo docker compose up -d"
```
