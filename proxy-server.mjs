/**
 * CORS Proxy Server for Camera Access
 *
 * Forwards requests from the browser to cameras, handling:
 * - CORS headers
 * - Digest authentication
 * - Binary data (images, video)
 */

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import DigestClient from 'digest-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Proxy endpoint: /proxy/:host/:port + any path
// Using middleware approach to avoid Express 5 path-to-regexp wildcard issues
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
        'User-Agent': 'Mozilla/5.0 (compatible; RetroIPCam/1.0)'
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

app.listen(PORT, () => {
  console.log(`🔄 CORS Proxy running at http://localhost:${PORT}`);
  console.log(`   Forward requests to: http://localhost:${PORT}/proxy/HOST/PORT/path`);
  console.log(`   Example: http://localhost:${PORT}/proxy/192.168.1.10/80/cgi-bin/magicBox.cgi?action=getDeviceType`);
});
