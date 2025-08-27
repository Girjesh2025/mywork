const express = require('express');
const cors = require('cors');
const { join } = require('path');
const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');

const screenshotsDir = join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// --- Database Initialization using Dynamic Import for ESM ---
let db;

const initializeDb = async () => {
  if (db) return db;

  const { Low } = await import('lowdb');
  const { JSONFile } = await import('lowdb/node');

  const dbPath = join(__dirname, 'db.json');
  console.log(`[DB Init] Database path resolved to: ${dbPath}`);
  
  const adapter = new JSONFile(dbPath);
  const defaultData = {
    projects: [
      { id: 1, name: "Youtube", site: "https://www.youtube.com", status: "Active", progress: 70, tags: ["Landing", "Marketing"], updatedAt: "2025-08-10" },
      { id: 2, name: "Google", site: "https://www.google.com", status: "Planned", progress: 35, tags: ["Shop", "UI"], updatedAt: "2025-07-02" },
      { id: 3, name: "EasyPDFIndia", site: "https://www.easypdfindia.com/", status: "Live", progress: 10, tags: ["Portfolio", "Design"], updatedAt: "2026-07-23" },
      { id: 4, name: "SmartCalculator", site: "https://www.online-calculator.com/", status: "On Hold", progress: 50, tags: ["E‑commerce", "Design"], updatedAt: "2025-06-20" },
    ],
    tasks: [
      { id: 1, text: "Set up auth", due: "2025-08-22", done: false },
      { id: 2, text: "Write documentation", due: "2025-08-20", done: true },
      { id: 3, text: "Add email notifications", due: "2025-08-18", done: true },
    ]
  };

  const newDb = new Low(adapter, defaultData);
  console.log('[DB Init] Reading database...');
  await newDb.read();
  console.log('[DB Init] Database read complete.');
  db = newDb;
  return db;
};
const app = express();

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();

// --- Helper Functions for Image Fetching ---

const fetchHtml = async (url) => {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    return data;
  } catch (error) {
    console.log(`Error fetching HTML from ${url}:`, error.message);
    return null;
  }
};

const getOgImage = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    return new URL(ogImage, baseUrl).href;
  }
  return null;
};

const getFavicon = (html, baseUrl) => {
  const $ = cheerio.load(html);
  let favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
  if (favicon) {
    return new URL(favicon, baseUrl).href;
  }
  // Fallback for default favicon location
  return new URL('/favicon.ico', baseUrl).href;
};

const normalizeUrl = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// --- API Endpoints ---

// GET /api/projects - Get all projects
apiRouter.get('/projects', async (req, res) => {
  console.log('--- Handling GET /api/projects ---');
  try {
    const db = await initializeDb();
    if (db.data && db.data.projects) {
      console.log(`[Projects Route] Success! Found ${db.data.projects.length} projects.`);
      res.json(db.data.projects);
    } else {
      console.error('[Projects Route] db.data is null or does not contain projects.');
      res.status(500).json({ error: 'Failed to read project data.' });
    }
  } catch (error) {
    console.error('[Projects Route] An error occurred during DB initialization or read:', error);
    res.status(500).send(`A server error occurred: ${error.message}`);
  }
});

// Add a project (disabled for diagnostics)
apiRouter.post('/projects', async (req, res) => {
  res.status(503).send('Service temporarily unavailable for writing.');
});

// Update a project (disabled for diagnostics)
apiRouter.put('/projects/:id', async (req, res) => {
  res.status(503).send('Service temporarily unavailable for writing.');
});
// GET /api/tasks - Get all tasks
apiRouter.get('/tasks', async (req, res) => {
  console.log('--- Handling GET /api/tasks ---');
  try {
    const db = await initializeDb();
    if (db.data && db.data.tasks) {
      console.log(`[Tasks Route] Success! Found ${db.data.tasks.length} tasks.`);
      res.json(db.data.tasks);
    } else {
      console.error('[Tasks Route] db.data is null or does not contain tasks.');
      res.status(500).json({ error: 'Failed to read task data.' });
    }
  } catch (error) {
    console.error('[Tasks Route] An error occurred during DB initialization or read:', error);
    res.status(500).send(`A server error occurred: ${error.message}`);
  }
});



// GET /api/screenshot - Get a screenshot of a website
apiRouter.get('/screenshot', async (req, res) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const { url: rawUrl, width = 480, height = 270, refresh = false, status = 'Live' } = req.query;
    const url = normalizeUrl(rawUrl);

  if (!url) {
    return res.status(400).send('URL is required');
  }

  const safeFilename = crypto.createHash('md5').update(url).digest('hex') + `-${width}x${height}.png`;
  const filePath = join(screenshotsDir, safeFilename);

  // If not refreshing, try to serve from cache
  if (!refresh && fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const ageInHours = (new Date().getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);
    if (ageInHours < 24) {
      return res.sendFile(filePath);
    }
  }

  // For Live projects, attempt fetching in order: Puppeteer, OG Image, Favicon
  if (status === 'Live' && url.includes('.')) {
    // 1. Try Puppeteer
    let browser;
    try {
      console.log(`[Puppeteer] Launching browser for: ${url}`);
      browser = await puppeteer.launch({
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless,
      });

      const page = await browser.newPage();
      console.log('[Puppeteer] New page created.');

      await page.setViewport({ width: 1920, height: 1080 });
      console.log('[Puppeteer] Viewport set to 1920x1080.');

      console.log(`[Puppeteer] Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      console.log('[Puppeteer] Page navigation successful.');

      console.log('[Puppeteer] Waiting for body to be rendered...');
      await page.waitForSelector('body');
      console.log('[Puppeteer] Body rendered.');

      console.log('[Puppeteer] Taking full page screenshot...');
      const screenshot = await page.screenshot({ type: 'png', fullPage: true });
      console.log('[Puppeteer] Screenshot taken successfully.');

      console.log(`[Cache] Screenshot write skipped for diagnostics.`);
      
      res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      return res.send(screenshot);

    } catch (puppeteerError) {
      console.error(`[Puppeteer] An error occurred for ${url}:`, puppeteerError);
    } finally {
      if (browser) {
        console.log('[Puppeteer] Closing browser.');
        await browser.close();
        console.log('[Puppeteer] Browser closed.');
      }
    }

    // 2. Try OG Image or Favicon
    console.log('Attempting to fetch HTML for OG image/favicon...');
    const html = await fetchHtml(url);
    if (html) {
      const ogImage = getOgImage(html, url);
      const favicon = getFavicon(html, url);
      console.log(`OG Image found: ${ogImage}`);
      console.log(`Favicon found: ${favicon}`);
      const imageUrl = ogImage || favicon;

      if (imageUrl) {
        try {
          console.log(`Attempting to fetch image: ${imageUrl}`);
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 5000 });
          const imageBuffer = Buffer.from(imageResponse.data, 'binary');
          const contentType = imageResponse.headers['content-type'];

          if (contentType && contentType.startsWith('image/')) {
            console.log(`[Cache] Image write skipped for diagnostics: ${imageUrl}`);
            res.set({ 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
            return res.send(imageBuffer);
          }
        } catch (fetchError) {
          console.log(`Failed to fetch image from ${imageUrl}. Moving to final fallback. Error:`, fetchError.message);
        }
      }
    }
  }

  // Fallback: Create status-based placeholder
  console.log(`All preview methods failed for ${url}. Generating SVG placeholder.`);
  const cleanUrl = url.replace('https://', '').replace('http://', '').replace('www.', '');
  const now = new Date().toLocaleString();
  
  // Different colors based on status
  let gradientColors, statusText, statusIcon;
  switch (status) {
    case 'Live':
      gradientColors = ['#10b981', '#059669', '#047857']; // Green
      statusText = '🟢 Live Website';
      statusIcon = '🌐';
      break;
    case 'Planned':
      gradientColors = ['#f59e0b', '#d97706', '#b45309']; // Orange
      statusText = '🟡 In Planning';
      statusIcon = '📋';
      break;
    case 'Active':
      gradientColors = ['#3b82f6', '#2563eb', '#1d4ed8']; // Blue
      statusText = '🔵 In Development';
      statusIcon = '⚡';
      break;
    case 'On Hold':
      gradientColors = ['#ef4444', '#dc2626', '#b91c1c']; // Red
      statusText = '🔴 On Hold';
      statusIcon = '⏸️';
      break;
    default:
      gradientColors = ['#6b7280', '#4b5563', '#374151']; // Gray
      statusText = '⚪ Unknown Status';
      statusIcon = '❓';
  }
  
  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientColors[0]};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${gradientColors[1]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradientColors[2]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="12"/>
      <text x="50%" y="35%" text-anchor="middle" fill="white" font-family="Arial" font-size="24">${statusIcon}</text>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">${cleanUrl}</text>
      <text x="50%" y="65%" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="12">${statusText}</text>
      <text x="50%" y="85%" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial" font-size="10">Updated: ${now}</text>
    </svg>
  `;
  
  // Placeholder is generated but not saved to disk for diagnostics
console.log(`Serving placeholder from memory: ${url}`);
  
  res.set({
    'Content-Type': 'image/svg+xml',
    'Content-Length': svgContent.length,
    'Cache-Control': 'public, max-age=3600'
  });
  res.send(svgContent);
});

// Use the router for all /api routes
app.use('/api', apiRouter);

// Start the server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
