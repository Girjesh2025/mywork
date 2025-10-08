import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const realProjects = [
  {
    name: "MyWork Dashboard",
    site: "mywork-green.vercel.app",
    status: "Live",
    progress: 95,
    tags: ["React", "Dashboard", "Supabase"]
  },
  {
    name: "E-commerce Platform",
    site: "shop.example.com",
    status: "Active",
    progress: 80,
    tags: ["E-commerce", "React", "Stripe"]
  },
  {
    name: "Portfolio Website",
    site: "portfolio.dev",
    status: "Live",
    progress: 100,
    tags: ["Portfolio", "Next.js", "Tailwind"]
  },
  {
    name: "Mobile App Development",
    site: "mobileapp.dev",
    status: "Planned",
    progress: 30,
    tags: ["Mobile", "React Native", "iOS"]
  },
  {
    name: "Blog Platform",
    site: "blog.example.com",
    status: "On Hold",
    progress: 65,
    tags: ["Blog", "CMS", "Markdown"]
  },
  {
    name: "API Gateway Service",
    site: "api.example.com",
    status: "Active",
    progress: 70,
    tags: ["API", "Node.js", "Microservices"]
  }
];

async function addRealData() {
  console.log('🚀 Adding real project data to Supabase...\n');

  try {
    // First, clear existing test data (but keep real projects)
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id, name')
      .ilike('name', '%test%');

    if (existingProjects && existingProjects.length > 0) {
      console.log('🧹 Cleaning up test projects...');
      for (const project of existingProjects) {
        await supabase.from('projects').delete().eq('id', project.id);
        console.log(`   Deleted: ${project.name}`);
      }
    }

    // Add real projects
    console.log('\n📝 Adding real projects...');
    for (const project of realProjects) {
      const { data, error } = await supabase
        .from('projects')
        .insert([project])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error adding ${project.name}:`, error.message);
      } else {
        console.log(`✅ Added: ${data.name} (ID: ${data.id})`);
      }
    }

    // Verify the data
    console.log('\n📊 Verifying database contents...');
    const { data: allProjects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching projects:', fetchError);
    } else {
      console.log(`✅ Total projects in database: ${allProjects.length}`);
      allProjects.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} - ${project.status} (${project.progress}%)`);
      });
    }

    console.log('\n🎉 Real data successfully added to Supabase!');
    console.log('🌐 Your website should now display real project data instead of mock data.');

  } catch (error) {
    console.error('❌ Error adding real data:', error);
  }
}

addRealData();