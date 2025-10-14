-- Create visitors table for tracking site visits
CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45),
    user_agent TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON visitors(visited_at);
CREATE INDEX IF NOT EXISTS idx_visitors_ip_address ON visitors(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);

-- Enable Row Level Security
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is admin-only dashboard)
CREATE POLICY "Allow all operations on visitors" ON visitors
    FOR ALL USING (true);

-- Insert some sample data for testing
INSERT INTO visitors (ip_address, user_agent, session_id, page_url, referrer) VALUES
('192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'session_001', '/', 'direct'),
('192.168.1.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'session_002', '/', 'google.com'),
('192.168.1.3', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'session_003', '/', 'facebook.com');