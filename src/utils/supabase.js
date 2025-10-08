import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations
export const projectsAPI = {
  // Fetch all projects
  async getAll() {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Error fetching projects:', error);
        throw error;
      }

      return projects || [];
    } catch (error) {
      console.error('[Projects API] Error:', error);
      throw error;
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