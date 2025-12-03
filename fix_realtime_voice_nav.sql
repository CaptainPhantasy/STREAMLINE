-- Fix Realtime for voice_navigation_commands table
-- Run this in the Supabase SQL Editor

-- First, drop the publication if it exists to avoid errors
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Recreate the publication with all tables including voice_navigation_commands
CREATE PUBLICATION supabase_realtime
FOR TABLE voice_navigation_commands;

-- Add other necessary tables to the publication (optional)
-- You can add more tables as needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE your_other_table_name;

-- Verify the publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';