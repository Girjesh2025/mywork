const express = require('express');
const cors = require('cors');
const { join } = require('path');
// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Import appropriate puppeteer version based on environment
let puppeteer;
let chrome;

if (isDevelopment) {
  puppeteer = require('puppeteer');
} else {
  puppeteer = require('puppeteer-core');
  chrome = require('chrome-aws-lambda');
}

// Function to get browser configuration
const getBrowserConfig = async () => {
  if (isDevelopment) {
    // For local development, use bundled Chromium from puppeteer
    console.log('Using bundled Chromium for local development');
    return {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };
  } else {
    // Production: use chrome-aws-lambda
    return {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    };
  }
};
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');

// Background processing queue
class ScreenshotQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 2;
    this.activeJobs = new Map();
  }

  add(jobData) {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const job = {
      ...jobData,
      id: jobData.key, // Use cache key as job ID
      promise,
      resolve,
      reject,
      onProgress: (status, progress, message) => {
        // Optional: Implement progress tracking if needed later
        // console.log(`[Progress] ${jobData.key}: ${status} (${progress}%) - ${message}`);
      },
    };

    this.queue.push(job);
    console.log(`[Queue] Added job ${job.id}. Queue size: ${this.queue.length}`);
    this.process();
    return job;
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift();
    console.log(`[Queue] Processing job ${job.id}`);

    try {
      const result = await this.executeJob(job);
      job.resolve(result);
      console.log(`[Queue] Job ${job.id} completed successfully.`);
    } catch (error) {
      console.error(`[Queue] Job ${job.id} failed:`, error.message);
      job.reject(error);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  async executeJob(job) {
    const { url, width, height, key, format, status } = job;
    console.log(`[SQ] Starting job for ${url}`);
    let browser;
    try {
      console.log('[SQ] Launching browser...');
      const browserConfig = await getBrowserConfig();
      browser = await puppeteer.launch(browserConfig);
      console.log('[SQ] Browser launched.');
      const page = await browser.newPage();
      console.log('[SQ] New page created.');
      
      console.log(`[SQ] Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('[SQ] Navigation complete.');
      
      console.log('[SQ] Taking screenshot.');
      const screenshot = await page.screenshot({ type: 'png', fullPage: true });
      console.log('[SQ] Screenshot taken.');
      
      console.log('[SQ] Processing image with Sharp.');
      const resizedImage = await sharp(screenshot)
        .resize(parseInt(width), parseInt(height), { fit: 'cover', position: 'top' })
        .png({ quality: 90 })
        .toBuffer();

      const webpImage = await sharp(resizedImage)
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
      console.log('[SQ] Image processing complete.');
      
      // Save the image to cache
      const webpPath = join(screenshotsDir, `${key}.webp`);
      fs.writeFileSync(webpPath, webpImage);
      cacheManager.set(key, webpPath, 'webp');
      
      return { success: true, filePath: webpPath, format: 'webp' };
    } catch (error) {
      console.error(`[SQ] Error in executeJob for ${url}:`, error);
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        console.log('[SQ] Closing browser.');
        await browser.close();
        console.log('[SQ] Browser closed.');
      }
    }
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      processing: this.processing
    };
  }
}

const screenshotQueue = new ScreenshotQueue();

// Enhanced caching system
class CacheManager {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this.defaultTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.metadata = new Map(); // In-memory metadata cache
    this.loadMetadata();
  }

  loadMetadata() {
    const metadataFile = join(this.cacheDir, '.cache-metadata.json');
    if (fs.existsSync(metadataFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        this.metadata = new Map(Object.entries(data));
      } catch (error) {
        console.error('[Cache] Failed to load metadata:', error);
      }
    }
  }

  saveMetadata() {
    const metadataFile = join(this.cacheDir, '.cache-metadata.json');
    try {
      const data = Object.fromEntries(this.metadata);
      fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[Cache] Failed to save metadata:', error);
    }
  }

  isValid(filePath, customTTL = null) {
    if (!fs.existsSync(filePath)) return false;
    
    const stats = fs.statSync(filePath);
    const ttl = customTTL || this.defaultTTL;
    const age = Date.now() - stats.mtime.getTime();
    
    return age < ttl;
  }

  get(key, customTTL = null) {
    const metadata = this.metadata.get(key);
    if (!metadata) return null;
    
    const { filePath, createdAt, format } = metadata;
    
    if (!this.isValid(filePath, customTTL)) {
      this.invalidate(key);
      return null;
    }
    
    return { filePath, format, createdAt };
  }

  set(key, filePath, format = 'webp') {
    this.metadata.set(key, {
      filePath,
      format,
      createdAt: Date.now()
    });
    this.saveMetadata();
  }

  invalidate(key) {
    const metadata = this.metadata.get(key);
    if (metadata && fs.existsSync(metadata.filePath)) {
      try {
        fs.unlinkSync(metadata.filePath);
      } catch (error) {
        console.error('[Cache] Failed to delete file:', error);
      }
    }
    this.metadata.delete(key);
    this.saveMetadata();
  }

  cleanup() {
    let cleaned = 0;
    for (const [key, metadata] of this.metadata.entries()) {
      if (!this.isValid(metadata.filePath)) {
        this.invalidate(key);
        cleaned++;
      }
    }
    console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    return cleaned;
  }

  getStats() {
    const totalEntries = this.metadata.size;
    let totalSize = 0;
    let validEntries = 0;
    
    for (const [key, metadata] of this.metadata.entries()) {
      if (fs.existsSync(metadata.filePath)) {
        const stats = fs.statSync(metadata.filePath);
        totalSize += stats.size;
        if (this.isValid(metadata.filePath)) {
          validEntries++;
        }
      }
    }
    
    return {
      totalEntries,
      validEntries,
      expiredEntries: totalEntries - validEntries,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
    };
  }
}

const screenshotsDir = join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const cacheManager = new CacheManager(screenshotsDir);

// Cleanup expired cache entries every hour
setInterval(() => {
  cacheManager.cleanup();
}, 60 * 60 * 1000);

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

// Add a project
apiRouter.post('/projects', async (req, res) => {
  console.log('--- Handling POST /api/projects ---');
  try {
    const db = await initializeDb();
    const newProject = req.body;
    
    // Validate required fields
    if (!newProject.name || !newProject.site) {
      return res.status(400).json({ error: 'Name and site are required' });
    }
    
    // Add the project to the database
    db.data.projects.push(newProject);
    await db.write();
    
    console.log(`[Add Project] Successfully added project: ${newProject.name}`);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('[Add Project] Error:', error);
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// Update a project
apiRouter.put('/projects/:id', async (req, res) => {
  console.log(`--- Handling PUT /api/projects/${req.params.id} ---`);
  try {
    const db = await initializeDb();
    const projectId = parseInt(req.params.id);
    const updatedProject = req.body;
    
    // Find and update the project
    const projectIndex = db.data.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update the project
    db.data.projects[projectIndex] = { ...db.data.projects[projectIndex], ...updatedProject };
    await db.write();
    
    console.log(`[Update Project] Successfully updated project: ${updatedProject.name}`);
    res.json(db.data.projects[projectIndex]);
  } catch (error) {
    console.error('[Update Project] Error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
apiRouter.delete('/projects/:id', async (req, res) => {
  console.log(`--- Handling DELETE /api/projects/${req.params.id} ---`);
  try {
    const db = await initializeDb();
    const projectId = parseInt(req.params.id);
    
    // Find and remove the project
    const projectIndex = db.data.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const deletedProject = db.data.projects.splice(projectIndex, 1)[0];
    await db.write();
    
    console.log(`[Delete Project] Successfully deleted project: ${deletedProject.name}`);
    res.json({ message: 'Project deleted successfully', project: deletedProject });
  } catch (error) {
    console.error('[Delete Project] Error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
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



// GET /api/screenshot/stream - Stream screenshot generation progress
apiRouter.get('/screenshot/stream', async (req, res) => {
  const { url: rawUrl, width = 480, height = 270, status = 'Live' } = req.query;
  const url = normalizeUrl(rawUrl);

  if (!url) {
    return res.status(400).send('URL is required');
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendProgress = (stage, progress, message) => {
    res.write(`data: ${JSON.stringify({ stage, progress, message })}\n\n`);
  };

  try {
    sendProgress('initializing', 10, 'Starting screenshot capture...');
    
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const webpPath = join(screenshotsDir, `${hash}-${width}x${height}.webp`);
    
    // Check cache first
    if (fs.existsSync(webpPath)) {
      const stats = fs.statSync(webpPath);
      const ageInHours = (new Date().getTime() - stats.mtime.getTime()) / (1000 * 60 * 60);
      if (ageInHours < 24) {
        sendProgress('cached', 100, 'Using cached screenshot');
        res.write(`data: ${JSON.stringify({ stage: 'complete', imageUrl: `/api/screenshot?url=${encodeURIComponent(rawUrl)}&width=${width}&height=${height}&format=webp` })}\n\n`);
        return res.end();
      }
    }

    // Add job to background queue
     const key = `${crypto.createHash('md5').update(url).digest('hex')}-${width}x${height}`;
     
     const queueStatus = screenshotQueue.getQueueStatus();
     if (queueStatus.queueLength > 0) {
       sendProgress('queued', 15, `Queued (${queueStatus.queueLength + 1} in queue)`);
     }
     
     try {
       const job = await screenshotQueue.add({ url, width, height, key, format: 'webp', status });
       const result = await job.promise;
       
       if (result.success) {
         sendProgress('complete', 100, 'Screenshot ready!');
         res.write(`data: ${JSON.stringify({ stage: 'complete', imageUrl: `/api/screenshot?url=${encodeURIComponent(rawUrl)}&width=${width}&height=${height}&format=webp` })}

`);
         res.end();
       } else {
         throw new Error(result.error);
       }
     } catch (error) {
       console.error('[Queue] Job failed:', error);
       res.write(`data: ${JSON.stringify({ stage: 'error', message: error.message })}

`);
       res.end();
     }
    
  } catch (error) {
    console.error('[Stream] Screenshot generation failed:', error);
    res.write(`data: ${JSON.stringify({ stage: 'error', message: error.message })}\n\n`);
    res.end();
  }
});

// GET /api/queue/status - Get queue status
apiRouter.get('/queue/status', (req, res) => {
  const status = screenshotQueue.getQueueStatus();
  res.json({
    ...status,
    timestamp: new Date().toISOString()
  });
});

// GET /api/cache/stats - Get cache statistics
apiRouter.get('/cache/stats', (req, res) => {
  const stats = cacheManager.getStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

// POST /api/cache/cleanup - Manual cache cleanup
apiRouter.post('/cache/cleanup', (req, res) => {
  const cleaned = cacheManager.cleanup();
  res.json({
    message: `Cleaned up ${cleaned} expired cache entries`,
    cleanedEntries: cleaned,
    timestamp: new Date().toISOString()
  });
});

// DELETE /api/cache/invalidate - Invalidate specific cache entry
apiRouter.delete('/cache/invalidate', (req, res) => {
  const { url, width = 480, height = 270 } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  const hash = crypto.createHash('md5').update(normalizeUrl(url)).digest('hex');
  const cacheKey = `${hash}-${width}x${height}`;
  
  cacheManager.invalidate(cacheKey);
  
  res.json({
    message: 'Cache entry invalidated',
    url: normalizeUrl(url),
    cacheKey,
    timestamp: new Date().toISOString()
  });
});

// POST /api/screenshot - Get a screenshot of a website
apiRouter.post('/screenshot', async (req, res) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const { url: rawUrl, width = 480, height = 270, refresh = false, status = 'Live', format = 'webp' } = req.body;
  const url = normalizeUrl(rawUrl);

  console.log(`[API] Screenshot POST request received: ${rawUrl}, ${width}x${height}, ${status}, ${format}`);

  if (!url) {
    return res.status(400).send('URL is required');
  }

  const key = `${crypto.createHash('md5').update(url).digest('hex')}-${width}x${height}`;
  const cacheTTL = refresh ? 0 : (status === 'Live' ? 3600 : null);

  if (!refresh) {
    const cached = cacheManager.get(key, cacheTTL);
    if (cached) {
      console.log(`[Cache] HIT: ${key}`);
      const { filePath, format: cachedFormat } = cached;
      res.setHeader('Content-Type', `image/${cachedFormat}`);
      res.sendFile(filePath);
      return;
    }
  }

  console.log(`[Cache] MISS: ${key}`);

  try {
    const job = await screenshotQueue.add({ url, width, height, key, format, status });
    const result = await job.promise;

    if (result.success) {
      res.setHeader('Content-Type', `image/${result.format}`);
      res.sendFile(result.filePath);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    console.error('Full error object:', error);
    console.error('Stack trace:', error.stack);

    try {
      const html = await fetchHtml(url);
      const ogImage = getOgImage(html, url);

      if (ogImage) {
        try {
          const response = await axios.get(ogImage, { responseType: 'arraybuffer' });
          const optimizedImage = await sharp(response.data)
            .resize({ width: 400, height: 300, fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

          const fallbackPath = join(screenshotsDir, `${key}-fallback.webp`);
          fs.writeFileSync(fallbackPath, optimizedImage);
          cacheManager.set(key, fallbackPath, 'webp');

          res.setHeader('Content-Type', 'image/webp');
          res.send(optimizedImage);
          return;
        } catch (axiosError) {
          console.error('Error fetching or processing OG image:', axiosError.message);
        }
      }

      const favicon = getFavicon(html, url);
      if (favicon) {
        try {
          const response = await axios.get(favicon, { responseType: 'arraybuffer' });
          res.setHeader('Content-Type', response.headers['content-type']);
          res.send(response.data);
          return;
        } catch (axiosError) {
          console.error('Error fetching favicon:', axiosError.message);
        }
      }

      const placeholderSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#999">
            Preview not available
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(placeholderSvg);

    } catch (fetchError) {
      console.error('Error fetching HTML for fallback:', fetchError.message);
      const placeholderSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#999">
            Preview not available
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(placeholderSvg);
    }
  }
});

// GET /api/screenshot - Get a screenshot of a website
apiRouter.get('/screenshot', async (req, res) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const { url: rawUrl, width = 480, height = 270, refresh = false, status = 'Live', format = 'webp' } = req.query;
  const url = normalizeUrl(rawUrl);

  console.log(`[API] Screenshot request received: ${rawUrl}, ${width}x${height}, ${status}, ${format}`);

  if (!url) {
    return res.status(400).send('URL is required');
  }

  const key = `${crypto.createHash('md5').update(url).digest('hex')}-${width}x${height}`;
  const cacheTTL = refresh ? 0 : (status === 'Live' ? 3600 : null);

  if (!refresh) {
    const cached = cacheManager.get(key, cacheTTL);
    if (cached) {
      console.log(`[Cache] HIT: ${key}`);
      const { filePath, format: cachedFormat } = cached;
      res.setHeader('Content-Type', `image/${cachedFormat}`);
      res.sendFile(filePath);
      return;
    }
  }

  console.log(`[Cache] MISS: ${key}`);

  try {
    const job = await screenshotQueue.add({ url, width, height, key, format, status });
    const result = await job.promise;

    if (result.success) {
      res.setHeader('Content-Type', `image/${result.format}`);
      res.sendFile(result.filePath);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    console.error('Full error object:', error);
    console.error('Stack trace:', error.stack);

    try {
      const html = await fetchHtml(url);
      const ogImage = getOgImage(html, url);

      if (ogImage) {
        try {
          const response = await axios.get(ogImage, { responseType: 'arraybuffer' });
          const optimizedImage = await sharp(response.data)
            .resize({ width: 400, height: 300, fit: 'cover' })
            .webp({ quality: 80 })
            .toBuffer();

          const fallbackPath = join(screenshotsDir, `${key}-fallback.webp`);
          fs.writeFileSync(fallbackPath, optimizedImage);
          cacheManager.set(key, fallbackPath, 'webp');

          res.setHeader('Content-Type', 'image/webp');
          res.send(optimizedImage);
          return;
        } catch (axiosError) {
          console.error('Error fetching or processing OG image:', axiosError.message);
        }
      }

      const favicon = getFavicon(html, url);
      if (favicon) {
        try {
          const response = await axios.get(favicon, { responseType: 'arraybuffer' });
          res.setHeader('Content-Type', response.headers['content-type']);
          res.send(response.data);
          return;
        } catch (axiosError) {
          console.error('Error fetching favicon:', axiosError.message);
        }
      }

      const placeholderSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)" />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#999">
            Preview not available
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(200).send(placeholderSvg);

    } catch (fetchError) {
      console.error('Error fetching HTML for fallback:', fetchError.message);
      const errorSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8d7da" />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#721c24">
            Error: Could not fetch URL
          </text>
        </svg>
      `;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.status(500).send(errorSvg);
    }
  }
});

// Use the router for all /api routes
app.use('/api', apiRouter);

// Start the server for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Initialize database
    try {
      await initializeDb();
      console.log('[Server] Database initialized successfully');
    } catch (error) {
      console.error('[Server] Database initialization failed:', error);
    }
  });
}

// Export the app for Vercel
module.exports = app;
