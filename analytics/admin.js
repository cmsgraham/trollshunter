const express = require('express');
const path = require('path');
const fs = require('fs');
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const ADMIN_PORT = 4001;

// S3 client for fetching logs from Linode Object Storage
const s3Client = new S3Client({
  region: 'us-mia-1',
  endpoint: 'https://us-mia-1.linodeobjects.com',
  credentials: {
    accessKeyId: process.env.LINODE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_SECRET_KEY,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.LINODE_BUCKET || 'qrengagement';
const PREFIX = 'trollshunter-visitors';

// Helper to stream S3 body to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// --- In-memory cache ---
let cachedVisitors = [];
let lastFetch = null;

async function refreshCache() {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: `${PREFIX}/visitors.json`,
    }));
    const body = await streamToString(response.Body);
    cachedVisitors = JSON.parse(body);
    lastFetch = new Date();
    console.log(`Cache refreshed: ${cachedVisitors.length} records at ${lastFetch.toLocaleTimeString()}`);
  } catch (err) {
    console.error('Cache refresh error:', err.message);
  }
}

// Refresh cache every 15 seconds
refreshCache();
setInterval(refreshCache, 15000);

// API: Get visitor data
app.get('/api/visitors', (req, res) => {
  res.json(cachedVisitors);
});

// API: Force refresh from S3
app.post('/api/refresh', async (req, res) => {
  await refreshCache();
  res.json({ ok: true, count: cachedVisitors.length, lastFetch });
});

// API: Get backup list
app.get('/api/backups', async (req, res) => {
  try {
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `${PREFIX}/backups/`,
    }));
    const backups = (response.Contents || []).map(obj => ({
      key: obj.Key,
      lastModified: obj.LastModified,
      size: obj.Size,
    }));
    res.json(backups);
  } catch (err) {
    res.json([]);
  }
});

// Serve admin dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

app.listen(ADMIN_PORT, '127.0.0.1', () => {
  console.log(`TrollShunter Analytics at http://127.0.0.1:${ADMIN_PORT}`);
  console.log('Local only — data sourced from Linode Object Storage');
});
