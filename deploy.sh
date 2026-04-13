#!/bin/bash
set -e

# TrollHunter deployment script
# Usage: ./deploy.sh

SERVER="root@172.238.221.32"
APP_DIR="/opt/trollhunter"

echo "=== TrollHunter Deployment ==="

# 1. Install Docker on server if needed
echo "[1/6] Setting up server..."
ssh $SERVER 'bash -s' << 'REMOTE_SETUP'
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "Docker installed!"
else
    echo "Docker already installed."
fi
REMOTE_SETUP

# 2. Create app directory on server
echo "[2/6] Creating app directory..."
ssh $SERVER "mkdir -p $APP_DIR"

# 3. Copy project files
echo "[3/6] Copying files to server..."
rsync -avz --exclude 'node_modules' \
            --exclude 'venv' \
            --exclude '__pycache__' \
            --exclude '.vite' \
            --exclude 'dist' \
            --exclude 'trollhunter.db' \
            --exclude '.env' \
            ./ $SERVER:$APP_DIR/

# 4. Initial SSL setup (HTTP only first, then get cert)
echo "[4/6] Setting up initial nginx (HTTP only for cert)..."
ssh $SERVER "bash -s" << REMOTE_CERT
cd $APP_DIR

# Create temporary HTTP-only nginx config for cert
cat > /tmp/nginx-init.conf << 'NGINXINIT'
server {
    listen 80;
    server_name trollshunter.com www.trollshunter.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
NGINXINIT

# Copy temp config
cp /tmp/nginx-init.conf nginx/nginx.conf

# Start just nginx for cert
docker compose up -d nginx

# Get SSL certificate
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d trollshunter.com \
    -d www.trollshunter.com \
    --email admin@trollshunter.com \
    --agree-tos \
    --no-eff-email

# Stop nginx
docker compose down
REMOTE_CERT

# 5. Restore full nginx config and deploy
echo "[5/6] Deploying full application..."
rsync -avz ./nginx/nginx.conf $SERVER:$APP_DIR/nginx/nginx.conf

ssh $SERVER "bash -s" << REMOTE_DEPLOY
cd $APP_DIR
docker compose build --no-cache
docker compose up -d
echo "Containers running:"
docker compose ps
REMOTE_DEPLOY

# 6. Add certbot renewal cron
echo "[6/6] Setting up SSL renewal cron..."
ssh $SERVER 'bash -s' << REMOTE_CRON
(crontab -l 2>/dev/null; echo "0 3 * * * cd /opt/trollhunter && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload") | sort -u | crontab -
echo "Cron job added for SSL renewal."
REMOTE_CRON

echo ""
echo "=== Deployment Complete ==="
echo "Site: https://trollshunter.com"
echo ""
echo "IMPORTANT next steps:"
echo "1. Update X Developer Portal callback URL to: https://trollshunter.com/api/auth/callback"
echo "2. Make your user admin: ssh $SERVER 'cd $APP_DIR && docker compose exec backend python make_admin.py <your_username>'"
