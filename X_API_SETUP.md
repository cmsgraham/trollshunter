# Setting Up X (Twitter) API Access

Follow these steps to get the API credentials needed for TrollHunter.

---

## Step 1: Create an X Developer Account

1. Go to [https://developer.x.com/en/portal/petition/essential/basic-info](https://developer.x.com/en/portal/petition/essential/basic-info)
2. Sign in with your X account
3. Fill in the required info about your use case:
   - **Use case**: "Building a community blocklist tool to help users manage unwanted interactions"
4. Accept the developer agreement
5. You'll get access to the **Free** tier (sufficient for this app)

## Step 2: Create a Project & App

1. In the [Developer Portal](https://developer.x.com/en/portal/dashboard), click **"+ Add Project"**
2. Name it: `TrollHunter`
3. Select use case: **"Making a bot"** or **"Building tools for X users"**
4. Name the App: `TrollHunter App`

## Step 3: Get Your Bearer Token

1. In your app settings, go to **"Keys and Tokens"**
2. Under **"Bearer Token"**, click **"Generate"**
3. Copy the token — this is your `X_BEARER_TOKEN`

## Step 4: Set Up OAuth 2.0

This is needed so users can log in and authorize blocking.

1. In your app settings, go to **"User authentication settings"** → **"Set up"**
2. Configure:
   - **App permissions**: `Read and write`
   - **Type of App**: `Web App, Automated App or Bot`
   - **Callback URI**: `http://localhost:8000/auth/callback`
   - **Website URL**: `http://localhost:5173`
3. Save and note your:
   - **Client ID** → `X_CLIENT_ID`
   - **Client Secret** → `X_CLIENT_SECRET`

## Step 5: Configure Your .env File

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your values:

```
X_CLIENT_ID=your_actual_client_id
X_CLIENT_SECRET=your_actual_client_secret
X_BEARER_TOKEN=your_actual_bearer_token
APP_SECRET_KEY=generate-a-random-string-here
```

Generate a random secret key:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## API Rate Limits (Free Tier)

| Endpoint | Rate Limit |
|----------|-----------|
| User lookup | 100 requests / 24 hours |
| Block user | 50 requests / 15 minutes |
| User me | 25 requests / 24 hours |

The free tier is limited. For production, consider the **Basic** tier ($100/month) which gives significantly higher limits.

---

## Important Notes

- **OAuth 2.0 with PKCE** is used (most secure flow for web apps)
- User tokens expire after **2 hours** — the app handles refreshing automatically
- The `block.write` scope is required for blocking functionality
- The `offline.access` scope is needed for refresh tokens

## Upgrading for Production

When deploying:
1. Update the callback URI to your production domain
2. Update `FRONTEND_URL` and `BACKEND_URL` in `.env`
3. Consider upgrading to the Basic or Pro tier for higher rate limits
4. Use a proper secret management system instead of `.env` files
