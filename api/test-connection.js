#!/usr/bin/env node

/**
 * Supabase Connection Test Script
 * Run this to verify your Supabase database connection
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Variables Check:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials!');
  console.log('\n📝 To fix this:');
  console.log('   1. Create a .env file in the /api directory');
  console.log('   2. Copy contents from .env.example');
  console.log('   3. Replace with your actual Supabase credentials');
  console.log('\n   Get credentials from: https://app.supabase.com/project/_/settings/api');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection by fetching projects
async function testConnection() {
  try {
    console.log('🔌 Attempting to connect to Supabase...');
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Connection Error:', error.message);
      console.log('\n📝 Possible issues:');
      console.log('   - Invalid credentials');
      console.log('   - Table "projects" does not exist');
      console.log('   - Network connectivity issues');
      console.log('\n   Check your Supabase dashboard: https://app.supabase.com');
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`\n📊 Found ${projects.length} project(s) in database:`);
    
    if (projects.length > 0) {
      projects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} - ${p.status} (${p.progress}%)`);
      });
    } else {
      console.log('   (No projects found - database is empty)');
    }

    // Test tasks table
    console.log('\n🔍 Checking tasks table...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.log('⚠️  Tasks table:', tasksError.message);
    } else {
      console.log(`✅ Tasks table accessible (${tasks.length} task(s) found)`);
    }

    console.log('\n✨ Database connection test completed successfully!');
    console.log('🚀 You can now start the API server with: npm start');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testConnection();
