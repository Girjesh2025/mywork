import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ibakgspltjnkirtmygkj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYWtnc3BsdGpua2lydG15Z2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM1NjAsImV4cCI6MjA3NTM0OTU2MH0.SZj0hRlrvS3Fqv9wCdiXzTiJhNRRcX46bSFSuVS_NCk';

console.log('🔍 Testing Supabase Connection...');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing basic connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('projects').select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ Connection Error:', error.message);
      console.error('📋 Error Details:', error);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Projects table exists');
    console.log('📈 Current project count:', data?.length || 0);
    
    // Test 2: Try to fetch all projects
    console.log('\n🔍 Fetching all projects...');
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Fetch Error:', fetchError.message);
      return false;
    }
    
    console.log('✅ Projects fetched successfully!');
    console.log('📋 Found projects:', projects?.length || 0);
    
    if (projects && projects.length > 0) {
      console.log('📝 Sample project:', projects[0]);
    } else {
      console.log('📭 Database is empty - no projects found');
    }
    
    // Test 3: Check tasks table
    console.log('\n🔍 Testing tasks table...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('count', { count: 'exact' });
    
    if (tasksError) {
      console.error('⚠️  Tasks table error:', tasksError.message);
    } else {
      console.log('✅ Tasks table accessible');
      console.log('📈 Current task count:', tasks?.length || 0);
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase connection test completed successfully!');
  } else {
    console.log('\n❌ Supabase connection test failed!');
  }
  process.exit(success ? 0 : 1);
});