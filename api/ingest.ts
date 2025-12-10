import type { VercelRequest, VercelResponse } from '@vercel/node';

const POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_ASSETS_HOST = 'https://us-assets.i.posthog.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the path after /api/ingest from the URL
  const url = req.url || '';
  const ingestIndex = url.indexOf('/api/ingest');
  let subPath = '';

  if (ingestIndex !== -1) {
    const afterIngest = url.substring(ingestIndex + '/api/ingest'.length);
    // Remove leading slash and split off query string
    subPath = afterIngest.replace(/^\//, '').split('?')[0];
  }

  // Determine target host based on path
  const isStaticAsset = subPath.startsWith('static/');
  const targetHost = isStaticAsset ? POSTHOG_ASSETS_HOST : POSTHOG_HOST;
  const targetPath = isStaticAsset ? subPath.replace('static/', '') : subPath;

  // Build target URL with query string
  const targetUrl = new URL(targetPath, targetHost);

  // Forward query parameters
  const queryString = url.split('?')[1];
  if (queryString) {
    targetUrl.search = queryString;
  }

  try {
    // Forward the request to PostHog
    const headers: Record<string, string> = {};

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }
    if (req.headers['user-agent']) {
      headers['User-Agent'] = req.headers['user-agent'] as string;
    }

    const fetchOptions: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    // Forward body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      fetchOptions.body = typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);

    // Forward response headers
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Return response
    const data = await response.text();
    return res.status(response.status).send(data);
  } catch (error) {
    console.error('PostHog proxy error:', error);
    return res.status(500).json({ error: 'Proxy request failed' });
  }
}
