# MyWork Dashboard

A modern dashboard application for tracking and managing work projects with visual previews.

## Repository

🔗 **GitHub Repository**: [https://github.com/Girjesh2025/mywork](https://github.com/Girjesh2025/mywork)

## Features

- **Project Management**: Track and organize your work projects in one place
- **Visual Previews**: Automatically generated website screenshots for each project
- **Status Tracking**: Monitor project status (Live, Planned, On Hold, Active)
- **Progress Visualization**: Visual indicators of project completion percentage
- **Task Management**: Create and track tasks for each project
- **Responsive Design**: Works on desktop and mobile devices

## Technical Features

### Frontend
- React with Vite for fast development and optimized builds
- Tailwind CSS for responsive styling
- Component-based architecture for maintainability

### Backend
- Express.js API server
- Puppeteer for website screenshots
- SVG placeholder generation for production environments
- CORS configuration for cross-origin requests

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Start the API server
cd api && PORT=3002 node index.js
```

## Production

The application is configured for deployment on Vercel with the following features:

- Serverless functions for API endpoints
- SVG placeholders for website previews in production
- Optimized CORS configuration for cross-origin requests
- Environment-specific configuration via .env files

```bash
# Build for production
npm run build
```

## Recent Updates

- Fixed web preview in production environment
- Enhanced SVG placeholder generation
- Improved CORS configuration for API endpoints
- Updated environment variables for production
- Improved error handling in screenshot endpoint# Force deployment Tue Oct  7 13:38:13 IST 2025
