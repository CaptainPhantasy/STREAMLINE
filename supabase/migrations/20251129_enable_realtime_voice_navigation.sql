-- Enable Realtime for voice_navigation_commands table
-- This ensures that INSERT operations trigger Realtime events for the frontend listener

-- First ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE voice_navigation_commands;