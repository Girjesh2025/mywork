import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express.json());

// Import API handlers
const projectsHandler = await import('./projects.js');
const screenshotHandler = await import('./screenshot.js');
const helloHandler = await import('./hello.js');

// Helper function to handle serverless functions in Express
const handleServerlessFunction = (handler) => {
  return async (req, res) => {
    try {
      // Create a mock serverless request/response object
      const mockReq = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
      };

      const mockRes = {
        status: (code) => {
          res.status(code);
          return mockRes;
        },
        json: (data) => {
          res.json(data);
          return mockRes;
        },
        send: (data) => {
          res.send(data);
          return mockRes;
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
          return mockRes;
        }
      };

      await handler.default(mockReq, mockRes);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// API Routes
app.all('/api/projects', handleServerlessFunction(projectsHandler));
app.all('/api/screenshot', handleServerlessFunction(screenshotHandler));
app.all('/api/hello', handleServerlessFunction(helloHandler));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyWork API Server running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET/POST /api/projects`);
  console.log(`   GET     /api/screenshot`);
  console.log(`   GET     /api/hello`);
  console.log(`   GET     /health`);
});