import { createClient } from '@supabase/supabase-js';

// Supabase configuration
console.log('[Supabase Config] Environment check:');
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

// Authentication API};

// Visitor tracking API
export const visitorsAPI = {
  // Record a new visitor
  async recordVisit(visitorData = {}) {
    console.log('[Visitors API] Recording new visit...');
    
    try {
      // Generate a session ID if not provided
      const sessionId = visitorData.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const visitData = {
        ip_address: visitorData.ipAddress || 'unknown',
        user_agent: visitorData.userAgent || navigator.userAgent,
        session_id: sessionId,
        page_url: visitorData.pageUrl || window.location.href,
        referrer: visitorData.referrer || document.referrer || 'direct',
        visited_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('visitors')
        .insert([visitData])
        .select();

      if (error) {
        console.error('[Visitors API] Error recording visit:', error);
        return { success: false, error };
      }

      console.log('[Visitors API] Visit recorded successfully:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('[Visitors API] Unexpected error recording visit:', error);
      return { success: false, error };
    }
  },

  // Get total visitor count
  async getTotalVisitors() {
    console.log('[Visitors API] Fetching total visitor count...');
    
    try {
      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('[Visitors API] Error fetching visitor count:', error);
        return { success: false, error, count: 0 };
      }

      console.log('[Visitors API] Total visitors:', count);
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('[Visitors API] Unexpected error fetching visitor count:', error);
      return { success: false, error, count: 0 };
    }
  },

  // Get unique visitors count
  async getUniqueVisitors() {
    console.log('[Visitors API] Fetching unique visitor count...');
    
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('ip_address')
        .not('ip_address', 'is', null);

      if (error) {
        console.error('[Visitors API] Error fetching unique visitors:', error);
        return { success: false, error, count: 0 };
      }

      // Count unique IP addresses
      const uniqueIPs = new Set(data.map(visitor => visitor.ip_address));
      const uniqueCount = uniqueIPs.size;

      console.log('[Visitors API] Unique visitors:', uniqueCount);
      return { success: true, count: uniqueCount };
    } catch (error) {
      console.error('[Visitors API] Unexpected error fetching unique visitors:', error);
      return { success: false, error, count: 0 };
    }
  },

  // Get visitors for today
  async getTodayVisitors() {
    console.log('[Visitors API] Fetching today\'s visitor count...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { count, error } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .gte('visited_at', todayISO);

      if (error) {
        console.error('[Visitors API] Error fetching today\'s visitors:', error);
        return { success: false, error, count: 0 };
      }

      console.log('[Visitors API] Today\'s visitors:', count);
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('[Visitors API] Unexpected error fetching today\'s visitors:', error);
      return { success: false, error, count: 0 };
    }
  },

  // Get visitor analytics
  async getVisitorAnalytics() {
    console.log('[Visitors API] Fetching visitor analytics...');
    
    try {
      const [totalResult, uniqueResult, todayResult] = await Promise.all([
        this.getTotalVisitors(),
        this.getUniqueVisitors(),
        this.getTodayVisitors()
      ]);

      return {
        success: true,
        analytics: {
          total: totalResult.count,
          unique: uniqueResult.count,
          today: todayResult.count
        }
      };
    } catch (error) {
      console.error('[Visitors API] Error fetching analytics:', error);
      return {
        success: false,
        error,
        analytics: {
          total: 0,
          unique: 0,
          today: 0
        }
      };
    }
  }
};

export const authAPI = {
  // Verify admin credentials
  async verifyAdmin(username, password) {
    console.log('[Auth API] Verifying admin credentials...');
    
    try {
      // Check if Supabase is properly configured
      if (!finalUrl || !finalKey) {
        console.log('[Auth API] Missing Supabase configuration, using fallback credentials');
        // Fallback to environment variables or default credentials
        const adminUsername = 'admin';
        const adminPassword = 'Admin@india#786';
        return username === adminUsername && password === adminPassword;
      }

      // Try to fetch admin credentials from Supabase
      const { data: admins, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('[Auth API] Error fetching admin from database:', error.message);
        console.log('[Auth API] Falling back to default credentials');
        // Fallback to default credentials if table doesn't exist or other error
        const adminUsername = 'admin';
        const adminPassword = 'Admin@india#786';
        return username === adminUsername && password === adminPassword;
      }

      if (admins && admins.password === password) {
        console.log('[Auth API] Admin credentials verified from database');
        return true;
      }

      console.log('[Auth API] Invalid credentials');
      return false;
    } catch (error) {
      console.error('[Auth API] Unexpected error:', error);
      // Fallback to default credentials on any error
      const adminUsername = 'admin';
      const adminPassword = 'Admin@india#786';
      return username === adminUsername && password === adminPassword;
    }
  },

  // Initialize admin user in database (run once)
  async initializeAdmin() {
    console.log('[Auth API] Initializing admin user in database...');
    
    try {
      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', 'admin')
        .single();

      if (existingAdmin) {
        console.log('[Auth API] Admin user already exists');
        return existingAdmin;
      }

      // Create admin user
      const { data: admin, error } = await supabase
        .from('admin_users')
        .insert([{
          username: 'admin',
          password: 'Admin@india#786',
          email: 'admin@mywork.com',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[Auth API] Error creating admin user:', error);
        throw error;
      }

      console.log('[Auth API] Admin user created successfully');
      return admin;
    } catch (error) {
      console.error('[Auth API] Error initializing admin:', error);
      throw error;
    }
  },

  // Update admin password
  async updateAdminPassword(newPassword) {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .update({ 
          password: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('username', 'admin')
        .select()
        .single();

      if (error) {
        console.error('[Auth API] Error updating admin password:', error);
        throw error;
      }

      return admin;
    } catch (error) {
      console.error('[Auth API] Error:', error);
      throw error;
    }
  }
};