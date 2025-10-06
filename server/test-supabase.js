const { testConnection, initializeSupabase } = require('./supabase-config');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  // Initialize Supabase
  console.log('1. Initializing Supabase client...');
  const initialized = initializeSupabase();
  
  if (!initialized) {
    console.log('❌ Failed to initialize Supabase client');
    console.log('\n📝 Please check your .env file and ensure:');
    console.log('   - SUPABASE_URL is set');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY is set');
    process.exit(1);
  }
  
  console.log('✅ Supabase client initialized\n');
  
  // Test connection
  console.log('2. Testing database connection...');
  const connected = await testConnection();
  
  if (connected) {
    console.log('✅ Database connection successful!');
    console.log('\n🎉 Supabase is ready to use!');
  } else {
    console.log('❌ Database connection failed');
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check if your Supabase project is active');
    console.log('   - Verify your credentials are correct');
    console.log('   - Ensure your IP is allowed (if using RLS)');
  }
}

// Run the test
testSupabaseConnection().catch(console.error);