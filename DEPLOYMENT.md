# Deployment Guide for MyWork Dashboard

## Vercel Production Deployment

This guide will help you deploy the MyWork Dashboard to Vercel and fix common production issues.

### Common Issues and Solutions

#### 1. API Base URL Configuration

**Problem**: In local environment, API calls use relative paths (`/api/projects`) which work through Vite's proxy, but fail in production.

**Solution**:
- `.env` file: Empty `VITE_API_BASE_URL` for local development
- `.env.production` file: Set `VITE_API_BASE_URL=https://mywork-green-vercel.app` for production

#### 2. API Utility Functions
- `src/utils/api.js` contains centralized API functions
- Uses environment-based URL configuration: `import.meta.env.VITE_API_BASE_URL || ''`

#### 3. CORS Configuration
- Added `setCorsHeaders` helper function in `api/index.js`
- Updated CORS middleware options with `preflightContinue: false` and `optionsSuccessStatus: 204`
- Added explicit OPTIONS request handler for CORS preflight requests

#### 4. Component Updates
- `Project.jsx` - Updated with comments explaining API URL construction
- All components now properly handle cross-origin requests

### Deployment Steps

1. **Update Environment Variables**:
   - Ensure `.env.production` has the correct `VITE_API_BASE_URL` set to your Vercel deployment URL

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Verify deployment**:
   - Frontend should load properly
   - API endpoints should work through Vercel's serverless functions
   - Project previews should display correctly
   - CORS headers should be properly set

### Key Configuration Files

- `.env.production` - Production environment variables with absolute URL
- `vite.config.js` - Development proxy configuration
- `api/index.js` - API server with CORS configuration

### API Endpoints

सभी API endpoints `/api/` prefix के साथ काम करते हैं:
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Add new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/screenshot` - Generate screenshot
- `GET /api/health` - Health check

### Troubleshooting

1. **API calls failing**: Check browser console for CORS errors
2. **Screenshots not loading**: Verify Puppeteer configuration in `api/index.js`
3. **Build errors**: Ensure all dependencies are installed

### Environment Variables

```bash
# .env.production
VITE_API_BASE_URL=
```

Empty `VITE_API_BASE_URL` का मतलब है कि relative URLs use होंगे, जो Vercel के साथ perfectly काम करता है।