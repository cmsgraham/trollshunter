#!/bin/bash
# Start the TrollShunter visitor analytics admin panel (local only)
cd "$(dirname "$0")/analytics"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check .env
if [ ! -f ".env" ]; then
  echo "ERROR: analytics/.env not found."
  echo "Create it with your Linode Object Storage credentials:"
  echo ""
  echo "  LINODE_ACCESS_KEY=your_key"
  echo "  LINODE_SECRET_KEY=your_secret"
  echo "  LINODE_BUCKET=your_bucket"
  exit 1
fi

echo "Starting TrollShunter Analytics..."
echo "Dashboard: http://127.0.0.1:4001"
echo "Press Ctrl+C to stop"
echo ""
node admin.js
