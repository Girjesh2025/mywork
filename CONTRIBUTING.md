# Contributing to MyWork Dashboard

Thank you for considering contributing to MyWork Dashboard! This document provides guidelines and instructions for development.

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mywork_dashboard.git
   cd mywork_dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Start the API server (in a separate terminal):
   ```bash
   cd api
   PORT=3002 node index.js
   ```

## Project Structure

- `/src` - Frontend React application
  - `/components` - React components
  - `/utils` - Utility functions and API calls
- `/api` - Backend Express server
- `/public` - Static assets

## Development Guidelines

### Code Style

- Use consistent indentation (2 spaces)
- Follow React best practices
- Write meaningful comments
- Use descriptive variable and function names

### Git Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with descriptive messages:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

3. Push your branch and create a pull request

### Testing

Before submitting a pull request, ensure:

1. The application builds without errors
   ```bash
   npm run build
   ```

2. All features work as expected
3. No regression issues are introduced

## Environment Variables

The project uses environment variables for configuration:

- `.env` - Development environment
- `.env.production` - Production environment

Make sure to update these files as needed for your development environment.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.