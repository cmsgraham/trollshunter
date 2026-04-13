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

### Blocks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/blocks` | Block trolls on X (bulk) |
| GET | `/blocks/my-blocks` | Get your blocked list |

## How It Works

1. **Users log in** with their X account via OAuth 2.0
2. **Report accounts** by submitting a username, category, and optional evidence
3. **Community votes** validate reports — accounts with 5+ reports or 10+ upvotes become "verified"
4. **Block accounts** individually or in bulk — the app calls the X API on your behalf
5. **Everyone benefits** — as the list grows, new users can block known trolls instantly

## Deployment

For production deployment:

1. Use PostgreSQL instead of SQLite
2. Set up proper HTTPS with a reverse proxy (nginx)
3. Use environment variables or a secrets manager
4. Upgrade to X API Basic tier ($100/month) for better rate limits
5. Add rate limiting to your own API endpoints
6. Consider adding email notifications and moderation tools
