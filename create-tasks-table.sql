-- Create tasks table in Supabase
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    project_id INTEGER REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to VARCHAR(100),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tasks'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Enable all operations for tasks" ON public.tasks;
CREATE POLICY "Enable all operations for tasks" ON public.tasks
    FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);