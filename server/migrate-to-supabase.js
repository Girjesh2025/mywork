const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateProjects() {
  try {
    // Read local database
    const dbPath = path.join(__dirname, 'db.json');
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const projects = dbData.projects;

    console.log(`Found ${projects.length} projects in local database`);

    // Clear existing data in Supabase (optional)
    console.log('Clearing existing projects in Supabase...');
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.log('Note: Could not clear existing data:', deleteError.message);
    }

    // Insert all projects
    console.log('Inserting projects into Supabase...');
    
    for (const project of projects) {
      const projectData = {
        id: project.id,
        name: project.name,
        site: project.site,
        status: project.status,
        progress: project.progress,
        tags: project.tags,
        updated_at: project.updatedAt
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) {
        console.error(`Error inserting project ${project.name}:`, error.message);
      } else {
        console.log(`✓ Inserted project: ${project.name}`);
      }
    }

    // Verify the migration
    const { data: allProjects, error: fetchError } = await supabase
      .from('projects')
      .select('*');

    if (fetchError) {
      console.error('Error fetching projects:', fetchError.message);
    } else {
      console.log(`\n✅ Migration completed! Total projects in Supabase: ${allProjects.length}`);
      console.log('Projects in Supabase:');
      allProjects.forEach(project => {
        console.log(`- ${project.name} (${project.status})`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

migrateProjects();