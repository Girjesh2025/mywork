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
    return {
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    };
  }
};

// Simple in-memory database for Vercel
let db = {
  projects: [
    {
      "id": "1",
      "name": "handwriting converter",
      "site": "handwriting-converter-delta.vercel.app",
      "status": "Live",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "03 Sept 2025"
    },
    {
      "id": "2",
      "name": "Daily quotes",
      "site": "daily-quotes.vercel.app",
      "status": "Live",
      "progress": 100,
      "tags": ["New"],
      "updatedAt": "03 Sept 2025"
    },
    {
      "id": "3",
      "name": "Digitalshop",
      "site": "digitalshop.ly",
      "status": "Live",
      "progress": 0,
      "tags": ["New"],
      "updatedAt": "02 Sept 2025"
    }
  ],
  tasks: [
    {
      "id": "1",
      "title": "Complete project documentation",
      "status": "pending",
      "priority": "high",
      "dueDate": "2024-01-15"
    }
  ]
};

const app = express();

app.use(cors());
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

// API Routes
app.get('/api/projects', async (req, res) => {
  try {
    res.json(db.projects || []);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, site, status = 'Live', progress = 0, tags = ['New'] } = req.body;
    
    if (!name || !site) {
      return res.status(400).json({ error: 'Name and site are required' });
    }

    const newProject = {
      id: String(Date.now()),
      name,
      site,
      status,
      progress,
      tags,
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    db.projects.push(newProject);
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const projectIndex = db.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.projects[projectIndex] = { ...db.projects[projectIndex], ...updates };
    res.json(db.projects[projectIndex]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const projectIndex = db.projects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.projects.splice(projectIndex, 1);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    res.json(db.tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Screenshot endpoint with serverless optimization
app.get('/api/screenshot', async (req, res) => {
  const { url, width = 480, height = 270, format = 'webp' } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

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
        </svg>`;
    
    res.set({
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    
    res.send(placeholderSvg);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;