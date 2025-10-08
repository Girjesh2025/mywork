import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ibakgspltjnkirtmygkj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliYWtnc3BsdGpua2lydG15Z2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzM1NjAsImV4cCI6MjA3NTM0OTU2MH0.SZj0hRlrvS3Fqv9wCdiXzTiJhNRRcX46bSFSuVS_NCk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing CRUD Operations on Supabase...\n');

async function testCRUDOperations() {
  let testProjectId = null;
  
  try {
    // CREATE - Test creating a new project
    console.log('📝 Testing CREATE operation...');
    const newProject = {
      name: 'Test Project - CRUD',
      site: 'test-crud.example.com',
      status: 'Active',
      progress: 50,
      tags: ['Test', 'CRUD'],
      updated_at: new Date().toISOString().split('T')[0]
    };
    
    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ CREATE failed:', createError.message);
      return false;
    }
    
    testProjectId = createdProject.id;
    console.log('✅ CREATE successful! Project ID:', testProjectId);
    console.log('📋 Created project:', createdProject.name);
    
    // READ - Test reading the created project
    console.log('\n📖 Testing READ operation...');
    const { data: readProject, error: readError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', testProjectId)
      .single();
    
    if (readError) {
      console.error('❌ READ failed:', readError.message);
      return false;
    }
    
    console.log('✅ READ successful!');
    console.log('📋 Read project:', readProject.name);
    
    // UPDATE - Test updating the project
    console.log('\n✏️  Testing UPDATE operation...');
    const updates = {
      name: 'Updated Test Project - CRUD',
      progress: 75,
      status: 'Live'
    };
    
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', testProjectId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError.message);
      return false;
    }
    
    console.log('✅ UPDATE successful!');
    console.log('📋 Updated project:', updatedProject.name);
    console.log('📊 New progress:', updatedProject.progress);
    
    // Test READ ALL - Get all projects
    console.log('\n📚 Testing READ ALL operation...');
    const { data: allProjects, error: readAllError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (readAllError) {
      console.error('❌ READ ALL failed:', readAllError.message);
      return false;
    }
    
    console.log('✅ READ ALL successful!');
    console.log('📊 Total projects in database:', allProjects.length);
    
    // DELETE - Test deleting the test project
    console.log('\n🗑️  Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', testProjectId);
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ DELETE successful!');
    console.log('🧹 Test project cleaned up');
    
    // Verify deletion
    const { data: verifyDelete, error: verifyError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', testProjectId);
    
    if (verifyError) {
      console.error('❌ DELETE verification failed:', verifyError.message);
      return false;
    }
    
    if (verifyDelete.length === 0) {
      console.log('✅ DELETE verified - project no longer exists');
    } else {
      console.error('❌ DELETE verification failed - project still exists');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error during CRUD test:', error);
    
    // Cleanup in case of error
    if (testProjectId) {
      console.log('🧹 Attempting cleanup...');
      try {
        await supabase.from('projects').delete().eq('id', testProjectId);
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError);
      }
    }
    
    return false;
  }
}

// Run the CRUD test
testCRUDOperations().then(success => {
  if (success) {
    console.log('\n🎉 All CRUD operations completed successfully!');
    console.log('✅ Your Supabase database is fully functional');
  } else {
    console.log('\n❌ CRUD operations test failed!');
    console.log('⚠️  There may be permission or configuration issues');
  }
  process.exit(success ? 0 : 1);
});