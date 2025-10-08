export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, width = 480, height = 270 } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL format
    let targetUrl;
    try {
      targetUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Use a screenshot service API (like htmlcsstoimage.com or similar)
    // For now, we'll return a placeholder or use a free service
    
    // Option 1: Use htmlcsstoimage.com (requires API key)
    // Option 2: Use a free service like screenshotapi.net
    // Option 3: Return a placeholder image for now
    
    // For immediate fix, let's use screenshotapi.net (free tier)
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=DEMO_TOKEN&url=${encodeURIComponent(targetUrl.href)}&width=${width}&height=${height}&file_type=png&wait_for_event=load`;
    
    // Fetch the screenshot
    const response = await fetch(screenshotUrl);
    
    if (!response.ok) {
      // If screenshot service fails, return a placeholder
      return generatePlaceholder(res, targetUrl.hostname, width, height);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Screenshot API error:', error);
    
    // Return placeholder on error
    const { url, width = 480, height = 270 } = req.query;
    const hostname = url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'website';
    return generatePlaceholder(res, hostname, width, height);
  }
}

function generatePlaceholder(res, hostname, width, height) {
  // Generate SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D946EF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="8"/>
      <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${hostname}
      </text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="12">
        Live Preview
      </text>
      <circle cx="30" cy="30" r="4" fill="#10B981"/>
      <text x="45" y="35" fill="white" font-family="Arial, sans-serif" font-size="10">LIVE</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  return res.send(svg);
}