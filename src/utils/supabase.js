import { createClient } from '@supabase/supabase-js';

// Supabase configuration
console.log('[Supabase Config] Environment check:');
console.log('[Supabase Config] import.meta.env:', import.meta.env);
console.log('[Supabase Config] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('[Supabase Config] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback to hardcoded values if environment variables are not loaded
const fallbackUrl = 'https://ibakgspltjnkirtmygkj.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYWtnc3BsdGpua2lydG15Z2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM1NjAsImV4cCI6MjA3NTM0OTU2MH0.SZj0hRlrvS3Fqv9wCdiXzTiJhNRRcX46bSFSuVS_NCk';

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

console.log('[Supabase Config] Using URL:', finalUrl);
console.log('[Supabase Config] Using Key:', finalKey ? 'SET' : 'MISSING');

if (!finalUrl || !finalKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', finalUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', finalKey ? 'Set' : 'Missing');
}

// Create Supabase client
export const supabase = createClient(finalUrl, finalKey);

// Mock data for fallback when Supabase is not available
const mockProjects = [
  {
    id: 1,
    name: "MyWork Dashboard",
    site: "mywork-dashboard.vercel.app",
    status: "Active",
    progress: 75,
    tags: ["React", "Dashboard"],
    updated_at: "2024-10-08",
    created_at: "2024-10-01T10:00:00Z"
  },
  {
    id: 2,
    name: "E-commerce Platform",
    site: "shop.example.com",
    status: "Live",
    progress: 100,
    tags: ["E-commerce", "React"],
    updated_at: "2024-10-07",
    created_at: "2024-09-15T09:00:00Z"
  },
  {
    id: 3,
    name: "Mobile App Development",
    site: "mobileapp.dev",
    status: "Planned",
    progress: 25,
    tags: ["Mobile", "React Native"],
    updated_at: "2024-10-06",
    created_at: "2024-09-20T14:00:00Z"
  },
  {
    id: 4,
    name: "Portfolio Website",
    site: "portfolio.dev",
    status: "Live",
    progress: 100,
    tags: ["Portfolio", "Next.js"],
    updated_at: "2024-10-05",
    created_at: "2024-08-10T11:00:00Z"
  },
  {
    id: 5,
    name: "Blog Platform",
    site: "blog.example.com",
    status: "On Hold",
    progress: 60,
    tags: ["Blog", "CMS"],
    updated_at: "2024-10-04",
    created_at: "2024-07-20T16:00:00Z"
  }
];

// Database operations
export const projectsAPI = {
  // Fetch all projects
  async getAll() {
    console.log('[Supabase] Starting getAll() function...');
    
    try {
      // Check if Supabase is properly configured
      if (!finalUrl || !finalKey) {
        console.log('[Supabase] Missing configuration, using mock data');
        console.log('[Supabase] URL:', finalUrl ? 'Set' : 'Missing');
        console.log('[Supabase] Key:', finalKey ? 'Set' : 'Missing');
        return mockProjects;
      }

      console.log('[Supabase] Configuration OK, fetching from database...');
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[Supabase] Raw response - Data:', projects, 'Error:', error);

      if (error) {
        console.error('[Supabase] Error fetching projects:', error);
        console.log('[Supabase] Falling back to mock data');
        return mockProjects;
      }

      // Return real data from database if available
      if (projects && projects.length > 0) {
        console.log('[Supabase] Successfully loaded', projects.length, 'projects from database');
        console.log('[Supabase] Project names:', projects.map(p => p.name));
        return projects;
      }

      // Only use mock data if database is completely empty
      console.log('[Supabase] Database is empty, using mock data for demo');
      return mockProjects;
    } catch (error) {
      console.error('[Projects API] Unexpected error:', error);
      console.log('[Projects API] Falling back to mock data');
      return mockProjects;
    }
  },

  // Create a new project
  async create(projectData) {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creating project:', error);
        throw error;
      }

      return project;
    } catch (error) {
      console.error('[Projects API] Error:', error);
      throw error;
    }
  },

  // Update a project
  async update(id, updates) {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error updating project:', error);
        throw error;
      }

      return project;
    } catch (error) {
      console.error('[Projects API] Error:', error);
      throw error;
    }
  },

  // Delete a project
  async delete(id) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Error deleting project:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[Projects API] Error:', error);
      throw error;
    }
  }
};

// Tasks API
export const tasksAPI = {
  // Get all tasks
  async getAll() {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Error fetching tasks:', error);
        throw error;
      }

      return tasks || [];
    } catch (error) {
      console.error('[Tasks API] Error:', error);
      throw error;
    }
  },

  // Get tasks for a project
  async getByProject(projectId) {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Error fetching tasks:', error);
        throw error;
      }

      return tasks || [];
    } catch (error) {
      console.error('[Tasks API] Error:', error);
      throw error;
    }
  },

  // Create a new task
  async create(taskData) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Error creating task:', error);
        throw error;
      }

      return task;
    } catch (error) {
      console.error('[Tasks API] Error:', error);
      throw error;
    }
  }
};