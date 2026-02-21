/**
 * Retro IP Camera Web Admin Server
 *
 * Single Node.js server that:
 * - Serves the Vue.js SPA frontend
 * - Proxies camera API requests to bypass CORS
 * - Handles HTTP Digest authentication
 */

import express from 'express';
import fetch from 'node-fetch';
import DigestClient from 'digest-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 80;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JSON bodies
app.use(express.json());

// Serve static files from dist (Vue SPA build output)
app.use(express.static(join(__dirname, 'dist')));

// Proxy endpoint: /proxy/:host/:port + any path
// IMPORTANT: This must come BEFORE the SPA fallback
app.use('/proxy', async (req, res) => {
  // Split URL into path and query string
  const [pathOnly, queryString] = req.url.split('?');
  const urlParts = pathOnly.split('/').filter(p => p);

  if (urlParts.length < 2) {
    return res.status(400).json({ error: 'Invalid proxy URL format. Expected: /proxy/HOST/PORT/path' });
  }

  const host = urlParts[0];
  const port = urlParts[1];
  const path = '/' + urlParts.slice(2).join('/');
  const targetUrl = `http://${host}:${port}${path}${queryString ? '?' + queryString : ''}`;

  console.log(`[PROXY] ${req.method} ${targetUrl}`);

  // Get auth from headers
  const authHeader = req.headers['x-camera-auth'];
  let username = 'admin';
  let password = '';

  if (authHeader) {
    const [user, pass] = Buffer.from(authHeader.split(' ')[1] || '', 'base64').toString().split(':');
    username = user || username;
    password = pass || password;
  }

  try {
    // Use digest-fetch for authenticated requests
    const client = new DigestClient(username, password);

    const response = await client.fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RetroIPCam/1.2)'
      }
    });

    // Copy status and headers
    res.status(response.status);

    // Set content type
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Handle binary data (images, video)
    if (contentType && (contentType.includes('image') || contentType.includes('octet-stream'))) {
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } else {
      // Handle text data
      const text = await response.text();
      res.send(text);
    }

  } catch (error) {
    console.error(`[PROXY ERROR]`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// SPA fallback - serve index.html for all other routes
// This allows Vue Router to handle client-side routing
// Note: Using middleware instead of app.get('*') for Express 5 compatibility
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Retro IP Camera Admin running at http://localhost:${PORT}`);
  console.log(`   Frontend: Serving Vue.js SPA from /dist`);
  console.log(`   Proxy: Handling camera requests at /proxy/*`);
});
