const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
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

// --- Database Setup for Vercel ---
// Vercel has a read-only filesystem, except for the /tmp directory.
// We copy the database file to /tmp to make it writable.
const sourceDbPath = join(__dirname, 'db.json');
const writableDbPath = join('/tmp', 'db.json');

// Copy db.json to /tmp if it doesn't exist there yet
if (!fs.existsSync(writableDbPath)) {
  fs.copyFileSync(sourceDbPath, writableDbPath);
}

const adapter = new JSONFile(writableDbPath);
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
const db = new Low(adapter, defaultData);
const app = express();
let dbInitialized = false;

const initializeDb = async () => {
  if (dbInitialized) return;
  try {
    await db.read();
    if (db.data === null) {
      db.data = defaultData;
      await db.write();
    }
    dbInitialized = true;
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    throw new Error('Database initialization failed');
  }
};

app.use(cors());
app.use(express.json());

// All API routes will first ensure the DB is initialized
app.use(async (req, res, next) => {
  try {
    await initializeDb();
    next();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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

// Get all projects
app.get('/api/projects', (req, res) => {
  res.json(db.data.projects);
});

// Add a project
app.post('/api/projects', async (req, res) => {
  const newProject = req.body;
  db.data.projects.push(newProject);
  await db.write();
  res.status(201).json(newProject);
});

// Update a project
app.put('/api/projects/:id', async (req, res) => {
  const projectId = Number(req.params.id);
  const updatedData = req.body;
  db.data.projects = db.data.projects.map(p => p.id === projectId ? { ...p, ...updatedData } : p);
  await db.write();
  res.json(db.data.projects.find(p => p.id === projectId));
});

// Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  const projectId = Number(req.params.id);
  db.data.projects = db.data.projects.filter(p => p.id !== projectId);
  await db.write();
  res.status(204).send();
});

// Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(db.data.tasks);
});

// Add a task
app.post('/api/tasks', async (req, res) => {
  const newTask = req.body;
  db.data.tasks.push(newTask);
  await db.write();
  res.status(201).json(newTask);
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  const updatedData = req.body;
  db.data.tasks = db.data.tasks.map(t => t.id === taskId ? { ...t, ...updatedData } : t);
  await db.write();
  res.json(db.data.tasks.find(t => t.id === taskId));
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  db.data.tasks = db.data.tasks.filter(t => t.id !== taskId);
  await db.write();
  res.status(204).send();
});

// Screenshot a URL with Puppeteer or fallback
app.get('/api/screenshot', async (req, res) => {
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

      fs.writeFileSync(filePath, screenshot);
      console.log(`[Cache] Screenshot cached: ${filePath}`);
      
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
            fs.writeFileSync(filePath, imageBuffer);
            console.log(`Image cached from ${imageUrl}: ${filePath}`);
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
  
  // Save placeholder to cache
  try {
    fs.writeFileSync(filePath, svgContent);
    console.log(`Status placeholder cached: ${filePath}`);
  } catch (diskError) {
    console.log(`Serving placeholder from memory: ${url}`);
  }
  
  res.set({
    'Content-Type': 'image/svg+xml',
    'Content-Length': svgContent.length,
    'Cache-Control': 'public, max-age=3600'
  });
  res.send(svgContent);
});

  // Start the server for local development
  if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
};

// Export the app for Vercel
module.exports = app;
