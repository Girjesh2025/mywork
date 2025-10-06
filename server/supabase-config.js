const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

const initializeSupabase = () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Supabase] Missing environment variables:');
      console.warn(`SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
      console.warn(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}`);
      return false;
    }
    
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('[Supabase] Client initialized successfully');
    return true;
  } catch (error) {
    console.error('[Supabase] Initialization failed:', error.message);
    return false;
  }
};

const getSupabaseClient = () => {
  if (!supabase) {
    const initialized = initializeSupabase();
    if (!initialized) {
      throw new Error('Supabase client not initialized');
    }
  }
  return supabase;
};

const testConnection = async () => {
  try {
    const client = getSupabaseClient();
    
    // Test connection by trying to access the auth users (simpler test)
    const { data, error } = await client.auth.admin.listUsers();
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      return false;
    }
    
    console.log('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error.message);
    return false;
  }
};

module.exports = {
  initializeSupabase,
  getSupabaseClient,
  testConnection
};