require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
let supabase = null;

const initializeSupabase = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Supabase] Missing environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
      return;
    }

    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Client initialized successfully');
  } catch (error) {
    console.error('[Supabase] Initialization error:', error);
  }
};

initializeSupabase();

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    if (req.method === 'GET') {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('[Projects Route] Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      return res.json(projects);
    }

    if (req.method === 'POST') {
      const { name, site, status = 'Live', progress = 0, tags = ['New'] } = req.body;

      if (!name || !site) {
        return res.status(400).json({ error: 'Name and site are required' });
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert([{
          name,
          site,
          status,
          progress,
          tags,
          updated_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('[Projects Route] Insert error:', error);
        return res.status(500).json({ error: 'Failed to create project' });
      }

      return res.status(201).json(project);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[Projects Route] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};