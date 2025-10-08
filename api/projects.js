const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
let supabase = null;

const initializeSupabase = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[Supabase] Environment check:');
    console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Supabase] Missing environment variables');
      return false;
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Client initialized successfully');
    return true;
  } catch (error) {
    console.error('[Supabase] Initialization error:', error);
    return false;
  }
};

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

module.exports = async (req, res) => {
  console.log('[API] Request received:', req.method, req.url);
  
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    console.log('[API] Handling OPTIONS request');
    return res.status(204).end();
  }

  try {
    // Initialize Supabase if not already done
    if (!supabase) {
      const initialized = initializeSupabase();
      if (!initialized) {
        console.error('[API] Failed to initialize Supabase');
        return res.status(500).json({ 
          error: 'Database connection not available',
          details: 'Supabase initialization failed'
        });
      }
    }

    if (req.method === 'GET') {
      console.log('[API] Fetching projects from Supabase');
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase] Query error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
      }

      console.log('[API] Successfully fetched', projects?.length || 0, 'projects');
      return res.status(200).json(projects || []);
    }

    if (req.method === 'POST') {
      console.log('[API] Creating new project');
      const { data: project, error } = await supabase
        .from('projects')
        .insert([req.body])
        .select()
        .single();

      if (error) {
        console.error('[Supabase] Insert error:', error);
        return res.status(500).json({ error: 'Failed to create project', details: error.message });
      }

      console.log('[API] Successfully created project:', project.id);
      return res.status(201).json(project);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};