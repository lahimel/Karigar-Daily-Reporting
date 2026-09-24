// api/kobo.js
// Vercel serverless function - proxies requests to KoboToolbox, attaching the
// API token server-side so it's never exposed in client-side JS.
//
// Usage from the dashboard:
//   /api/kobo?path=/api/v2/assets/UID/?format=json
//   /api/kobo?path=/api/v2/assets/UID/data/?format=json&limit=100
//
// Set KOBO_TOKEN as an Environment Variable in the Vercel project settings
// (Project → Settings → Environment Variables). Never hardcode it here.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: 'Missing "path" query parameter' });
    return;
  }

  const token = process.env.KOBO_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server misconfigured: KOBO_TOKEN not set' });
    return;
  }

  const target = `https://eu.kobotoolbox.org${path}`;

  try {
    const koboRes = await fetch(target, {
      headers: {
        'Authorization': `Token ${token}`,
        'x-requested-with': 'XMLHttpRequest',
      },
    });

    const body = await koboRes.text();
    res.status(koboRes.status);
    res.setHeader('Content-Type', koboRes.headers.get('content-type') || 'application/json');
    res.send(body);
  } catch (e) {
    res.status(502).json({ error: 'Upstream fetch failed', detail: String(e) });
  }
}
