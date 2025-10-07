const express = require('express');
const cors = require('cors');
const { join } = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Check if we're in a serverless environment (like Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProduction = process.env.NODE_ENV === 'production';

// Set CORS headers for all responses
const setCorsHeaders = (res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
};

// Import appropriate puppeteer version based on environment
let puppeteer;
let chrome;

if (isDevelopment || !isServerless) {
  puppeteer = require('puppeteer');
} else {
  puppeteer = require('puppeteer-core');
  chrome = require('chrome-aws-lambda');
}

// Function to get browser configuration
const getBrowserConfig = async () => {
  if (isDevelopment) {
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
    // Check if we're in a serverless environment (Vercel/AWS Lambda)
    if (isServerless && chrome) {
      return {
        args: chrome.args,
        executablePath: await chrome.executablePath,
        headless: chrome.headless
      };
    } else {
      // Local production mode - use bundled Chromium
      console.log('Using bundled Chromium for local production');
      return {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      };
    }
  }
};

// In-memory database
const db = {
  projects: [
    {
      "id": 1,
      "name": "TradeJinni",
      "site": "tradejinni.com/",
      "status": "Live",
      "progress": 100,
      "tags": ["E‑commerce", "Design"],
      "updatedAt": "2025-08-22"
    },
    {
      "id": 2,
      "name": "Girjesh Gupta",
      "site": "girjeshgupta.com/",
      "status": "Live",
      "progress": 100,
      "tags": ["Portfolio", "Design"],
      "updatedAt": "2025-08-22"
    },
    {
      "id": 3,
      "name": "EasyPDFIndia",
      "site": "www.easypdfindia.com/",
      "status": "Live",
      "progress": 100,
      "tags": ["Portfolio", "Design"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 4,
      "name": "SmartCalculator ",
      "site": "yourcalculator.in/",
      "status": "Live",
      "progress": 100,
      "tags": ["E‑commerce", "Design"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 7,
      "name": "kids mathes ",
      "site": "kidsmathe.netlify.app/",
      "status": "Live",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 8,
      "name": "oneclickpdf",
      "site": "www.oneclickpdf.info/",
      "status": "Planned",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 9,
      "name": "lovelyinvoice",
      "site": "receipt-revelry.vercel.app/",
      "status": "Planned",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 10,
      "name": "Digitalshop",
      "site": "digitalshop.in/",
      "status": "Live",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "2025-09-02"
    },
    {
      "id": 11,
      "name": "Daily quotes",
      "site": "daily-quotes.vercel.app/",
      "status": "Live",
      "progress": 100,
      "tags": ["New"],
      "updatedAt": "2025-09-03"
    },
    {
      "id": 12,
      "name": "handwriting convertor ",
      "site": "handwriting-converter-delta.vercel.app/",
      "status": "Live",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "2025-09-03"
    }
  ],
  tasks: [
    {
      "id": 1,
      "text": "Set up auth",
      "due": "2025-08-22",
      "done": false
    },
    {
      "id": 2,
      "text": "Write documentation",
      "due": "2025-08-20",
      "done": false
    },
    {
      "id": 3,
      "text": "Add email notifications",
      "due": "2025-08-18",
      "done": false
    },
    {
      "id": 4,
      "text": "Trade jinni 2025",
      "due": "2025-08-26",
      "done": true
    }
  ]
};

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle OPTIONS requests explicitly
app.options('*', (req, res) => {
  setCorsHeaders(res);
  res.status(204).end();
});

app.use(express.json());

// Utility functions
const fetchHtml = async (url) => {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch HTML: ${error.message}`);
  }
};

const normalizeUrl = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const generatePlaceholderSvg = (url, width, height) => {
  // Return empty/transparent SVG instead of placeholder
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    </svg>
  `;
};



// API Routes
app.get('/api/projects', (req, res) => {
  res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
  const { name, site, status = 'Live', progress = 0, tags = ['New'] } = req.body;
  
  if (!name || !site) {
    return res.status(400).json({ error: 'Name and site are required' });
  }

  // Get the highest ID and increment
  const maxId = Math.max(...db.projects.map(p => p.id), 0);
  const nextId = maxId + 1;

  const newProject = {
    id: nextId,
    name,
    site,
    status,
    progress,
    tags,
    updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  };

  db.projects.push(newProject);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const projectIndex = db.projects.findIndex(p => p.id === parseInt(id));
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.projects[projectIndex] = { ...db.projects[projectIndex], ...updates };
  res.json(db.projects[projectIndex]);
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  const projectIndex = db.projects.findIndex(p => p.id === parseInt(id));
  
  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  db.projects.splice(projectIndex, 1);
  res.json({ message: 'Project deleted successfully' });
});

app.get('/api/tasks', (req, res) => {
  res.json(db.tasks);
});

// Screenshot endpoint with serverless optimization
app.get('/api/screenshot', async (req, res) => {
  const { url, width = 480, height = 270, format = 'webp' } = req.query;
  
  // Set CORS headers for all responses
  setCorsHeaders(res);
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // Always use SVG placeholders in production/Vercel environment
  const isProduction = process.env.NODE_ENV === 'production';
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  try {
    const normalizedUrl = normalizeUrl(url);
    console.log('Attempting to screenshot:', normalizedUrl);
    
    const config = await getBrowserConfig();
    console.log('Browser config:', JSON.stringify(config, null, 2));
    
    const browser = await puppeteer.launch(config);
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('New page created');
    
    await page.setViewport({ 
      width: parseInt(width), 
      height: parseInt(height),
      deviceScaleFactor: 1
    });
    console.log('Viewport set');
    
    await page.goto(normalizedUrl, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('Page loaded successfully');
    
    const screenshot = await page.screenshot({ 
      type: format === 'png' ? 'png' : 'webp',
      quality: format === 'webp' ? 80 : undefined
    });
    console.log('Screenshot captured successfully');
    
    await browser.close();
    
    res.set({
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=86400'
    });
    
    res.send(screenshot);
  } catch (error) {
    console.error('Screenshot error:', error);
    
    // Return a placeholder SVG on error
    const displayUrl = normalizeUrl(url).replace(/^https?:\/\//, '').replace(/\/$/, '');
    const placeholderSvg = generatePlaceholderSvg(displayUrl, width, height);
    
    // CORS headers already set by setCorsHeaders function
    res.set({
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    res.send(placeholderSvg);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server if not in Vercel environment
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;