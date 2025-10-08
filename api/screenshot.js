export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

// Function to check if website is actually live
async function checkWebsiteLive(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Only get headers, not full content
      timeout: 8000, // 8 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Consider website live if status is 2xx or 3xx (redirects)
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.log(`Website check failed for ${url}:`, error.message);
    return false; // Website is down or unreachable
  }
}

// Generate placeholder for down websites
function generateDownPlaceholder(res, hostname, width, height) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="downGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#downGrad)"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="8"/>
      <text x="50%" y="35%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${hostname}
      </text>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="14">
        Website Down
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">
        Not Reachable
      </text>
      <circle cx="30" cy="30" r="4" fill="#DC2626"/>
      <text x="45" y="35" fill="white" font-family="Arial, sans-serif" font-size="10">DOWN</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes only
  return res.send(svg);
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

    // First, check if the website is actually live
    const isLive = await checkWebsiteLive(targetUrl.href);
    
    if (!isLive) {
      // Website is down, return a "down" placeholder
      return generateDownPlaceholder(res, targetUrl.hostname, width, height);
    }

    // Try multiple screenshot services for better reliability
    const screenshotServices = [
      // Service 1: screenshotapi.net (free tier)
      `https://shot.screenshotapi.net/screenshot?token=DEMO_TOKEN&url=${encodeURIComponent(targetUrl.href)}&width=${width}&height=${height}&file_type=png&wait_for_event=load`,
      
      // Service 2: htmlcsstoimage.com (backup)
      `https://htmlcsstoimage.com/demo_run?url=${encodeURIComponent(targetUrl.href)}&width=${width}&height=${height}`,
      
      // Service 3: screenshotlayer.com (backup)
      `http://api.screenshotlayer.com/api/capture?access_key=DEMO_KEY&url=${encodeURIComponent(targetUrl.href)}&width=${width}&height=${height}&format=PNG`
    ];

    // Try each service until one works
    for (const screenshotUrl of screenshotServices) {
      try {
        const response = await fetch(screenshotUrl, {
          timeout: 10000, // 10 second timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          
          // Set appropriate headers
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
          
          return res.send(Buffer.from(imageBuffer));
        }
      } catch (serviceError) {
        console.log(`Screenshot service failed: ${screenshotUrl}`, serviceError.message);
        continue; // Try next service
      }
    }
    
    // If all services fail but website is live, return live placeholder
    return generatePlaceholder(res, targetUrl.hostname, width, height);

  } catch (error) {
    console.error('Screenshot API error:', error);
    
    // Return placeholder on error
    const { url, width = 480, height = 270 } = req.query;
    const hostname = url ? new URL(url.startsWith('http') ? url : `https://${url}`).hostname : 'website';
    return generatePlaceholder(res, hostname, width, height);
  }
}

function generatePlaceholder(res, hostname, width, height) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="8"/>
      <text x="50%" y="35%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${hostname}
      </text>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, sans-serif" font-size="14">
        Website Live
      </text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="10">
        Screenshot Unavailable
      </text>
      <circle cx="30" cy="30" r="4" fill="#10B981"/>
      <text x="45" y="35" fill="white" font-family="Arial, sans-serif" font-size="10">LIVE</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=600'); // Cache for 10 minutes
  return res.send(svg);
}