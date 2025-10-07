# Development Server Startup Guide

## Quick Start

### Terminal 1 - Start API Server
```bash
cd api
npm start
```
This will start the API server on http://localhost:3002

### Terminal 2 - Start Frontend Dev Server
```bash
npm run dev
```
This will start the Vite dev server (usually on http://localhost:5173)

## Testing All Buttons

### 1. Dashboard Page
- ✅ **Add Task Button**: Click to add a new task in the "Next Project" section
- ✅ **Search Bar**: Type to filter projects
- ✅ **Navigation Buttons**: Click menu items in sidebar

### 2. Projects Page
- ✅ **+ New Project Button**: Opens create form with live preview
- ✅ **Create Button**: Saves new project to database
- ✅ **Cancel Button**: Closes create form
- ✅ **Edit Button**: Opens edit form with live preview for each project
- ✅ **Save Button**: Updates project in database
- ✅ **Delete Button**: Removes project from database
- ✅ **Filter Dropdowns**: Filter by status and sort order

### 3. Next Project Page
- ✅ **Add Project Button**: Creates new project
- ✅ **Edit Button (✏️)**: Inline edit mode for each project
- ✅ **Delete Button (×)**: Removes project
- ✅ **Save Button**: Saves edited project
- ✅ **Cancel Button**: Cancels edit mode

### 4. Status Page
- ✅ **Table Display**: Shows all projects in table format

### 5. Settings Page
- ✅ **Save Changes Button**: Saves settings (frontend only)

### 6. Sidebar
- ✅ **+ Add Project Button**: Creates new project and navigates to Projects page
- ✅ **All Menu Items**: Navigate between pages

## Live Preview Feature

The **Live Preview** is displayed when:
1. Creating a new project in the Projects page
2. Editing an existing project in the Projects page

The preview updates in real-time as you type in the form fields.

## Fixed Issues

1. ✅ API routing - All endpoints now use `/api` prefix
2. ✅ Delete API call - Fixed incorrect endpoint path
3. ✅ ProjectPreview component - Now receives correct props in edit mode
4. ✅ API server port - Changed from 3001 to 3002 to match Vite proxy config
5. ✅ All buttons are functional and connected to backend
