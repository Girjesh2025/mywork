// Load environment variables from parent directory
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { join } = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const cheerio = require('cheerio');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cross-Origin-Embedder-Policy': 'unsafe-none'
  });
};

// Import appropriate puppeteer version based on environment
let puppeteer;
let chromium;

if (isDevelopment || !isServerless) {
  puppeteer = require('puppeteer');
} else {
  puppeteer = require('puppeteer-core');
  try {
    chromium = require('@sparticuz/chromium');
  } catch (error) {
    console.error('Failed to load @sparticuz/chromium:', error);
  }
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
  } else if (isServerless) {
    // Serverless environment (Vercel/AWS Lambda) - use @sparticuz/chromium
    console.log('Using @sparticuz/chromium for serverless environment');
    if (!chromium) {
      throw new Error('@sparticuz/chromium not available in serverless environment');
    }
    
    return {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
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
};

// Initialize Supabase client
let supabase = null;

const initializeSupabase = () => {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing environment variables:');
    console.error(`SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
    console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✓' : '✗'}`);
    return null;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('[Supabase] Client initialized successfully');
    return supabase;
  } catch (error) {
    console.error('[Supabase] Initialization failed:', error.message);
    return null;
  }
};

// Initialize Supabase on startup
initializeSupabase();

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
app.get('/api/projects', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('[Projects Route] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    res.json(projects);
  } catch (error) {
    console.error('[Projects Route] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { name, site, status = 'Live', progress = 0, tags = ['New'] } = req.body;
    
    if (!name || !site) {
      return res.status(400).json({ error: 'Name and site are required' });
    }

    // Prepare project data for Supabase
    const projectData = {
      name,
      site,
      status,
      progress,
      tags,
      updated_at: new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD
    };

    const { data: insertedProject, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('[Add Project] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to add project' });
    }

    console.log(`[Add Project] Successfully added project to Supabase: ${insertedProject.name}`);
    res.status(201).json(insertedProject);
  } catch (error) {
    console.error('[Add Project] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const updates = req.body;
    
    // Prepare update data for Supabase
    const updateData = { ...updates };
    
    // Remove frontend-specific fields that don't exist in Supabase
    delete updateData.updatedAt;
    
    // Set the correct updated_at field for Supabase
    updateData.updated_at = new Date().toISOString().split('T')[0];

    const { data: updatedProjectData, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('[Update Project] Supabase error:', error);
      return res.status(404).json({ error: 'Project not found or update failed' });
    }

    console.log(`[Update Project] Successfully updated project in Supabase: ${updatedProjectData.name}`);
    res.json(updatedProjectData);
  } catch (error) {
    console.error('[Update Project] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { id } = req.params;
    const projectId = parseInt(id);

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('[Delete Project] Supabase error:', error);
      return res.status(404).json({ error: 'Project not found or delete failed' });
    }

    console.log(`[Delete Project] Successfully deleted project from Supabase: ${projectId}`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('[Delete Project] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { data, error } = await supabase.from('tasks').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
});

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
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
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
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;