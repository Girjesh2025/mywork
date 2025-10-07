#!/bin/bash

# Deploy Dashboard Fixes to Vercel
echo "🚀 Deploying Dashboard Fixes to Vercel..."
echo ""

# Show what will be committed
echo "📝 Files to be committed:"
git status --short | grep -v "node_modules" | grep "^ M"
echo ""

# Add the modified files (excluding node_modules and untracked files)
echo "➕ Adding modified files..."
git add api/index.js
git add api/package.json
git add api/package-lock.json
git add src/App.jsx
git add src/pages/Dashboard.jsx
git add src/pages/Projects.jsx
git add src/utils/api.js
git add vite.config.js

# Also add the documentation files
git add START_DEV.md
git add FIXES_APPLIED.md
git add STATUS_REPORT.md
git add VERCEL_DEPLOYMENT_FIX.md
git add api/.env.example
git add api/test-connection.js

echo "✅ Files staged for commit"
echo ""

# Commit with descriptive message
echo "💾 Creating commit..."
git commit -m "Fix: API routes, Supabase connection, and live preview

- Fixed all API routes to use /api prefix
- Added dotenv to load environment variables from root .env
- Fixed ProjectPreview component props in edit mode  
- Fixed delete API endpoint path
- Updated API server port to 3002
- All buttons and CRUD operations now functional
- Live preview working correctly"

echo "✅ Commit created"
echo ""

# Push to origin
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Vercel will automatically build and deploy your changes."
echo "📊 Monitor deployment at: https://vercel.com/dashboard"
echo "🌐 Your site: https://mywork-green.vercel.app"
echo ""
echo "⏱️  Deployment usually takes 1-2 minutes."
echo "🔄 After deployment, hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
