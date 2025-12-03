-- Create database-backups storage bucket
-- This bucket will store database backups (users, etc.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'database-backups',
  'database-backups',
  false, -- Private bucket
  52428800, -- 50MB file size limit
  ARRAY['application/json', 'application/zip', 'text/csv']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policy to allow service role to upload/download backups
-- Note: This uses service role, so RLS is bypassed anyway, but good practice

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. database-backups bucket stores database backups.';

