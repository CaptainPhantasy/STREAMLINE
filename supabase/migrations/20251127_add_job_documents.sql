-- Migration: Add Job Documents System
-- Description: Creates tables for job documents and enhances job_photos table
-- Date: 2025-11-27

-- Create documents table for general job documents (PDFs, contracts, estimates)
CREATE TABLE IF NOT EXISTS job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'pdf', 'estimate', 'invoice', 'contract', 'signature', 'other')),
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category column to job_photos if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_photos' AND column_name = 'category'
  ) THEN
    ALTER TABLE job_photos
    ADD COLUMN category TEXT CHECK (category IN ('before', 'after', 'progress', 'completed'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_documents_account_id ON job_documents(account_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON job_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_job_documents_type ON job_documents(type);
CREATE INDEX IF NOT EXISTS idx_job_documents_created_at ON job_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_photos_category ON job_photos(category);

-- Enable RLS
ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_documents

-- Policy: Users can view documents from their account
CREATE POLICY "Users can view documents from their account"
  ON job_documents
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Authenticated users can insert documents to jobs in their account
CREATE POLICY "Users can insert documents to their account jobs"
  ON job_documents
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
    AND
    job_id IN (
      SELECT id FROM jobs WHERE account_id IN (
        SELECT account_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Policy: Users can update their own uploaded documents
CREATE POLICY "Users can update their own documents"
  ON job_documents
  FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    AND
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Owner and Admin can delete any document, others can delete their own
CREATE POLICY "Users can delete documents with permissions"
  ON job_documents
  FOR DELETE
  USING (
    (
      uploaded_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND account_id = job_documents.account_id
        AND role IN ('owner', 'admin')
      )
    )
    AND
    account_id IN (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  );

-- Create updated_at trigger for job_documents
CREATE OR REPLACE FUNCTION update_job_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_documents_updated_at
  BEFORE UPDATE ON job_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_job_documents_updated_at();

-- Create function to get document count by job
CREATE OR REPLACE FUNCTION get_job_document_count(job_uuid UUID)
RETURNS TABLE (
  photo_count BIGINT,
  document_count BIGINT,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM job_photos WHERE job_id = job_uuid) AS photo_count,
    (SELECT COUNT(*) FROM job_documents WHERE job_id = job_uuid) AS document_count,
    (SELECT COUNT(*) FROM job_photos WHERE job_id = job_uuid) +
    (SELECT COUNT(*) FROM job_documents WHERE job_id = job_uuid) AS total_count;
END;
$$ LANGUAGE plpgsql;

-- Create view for unified document listing
CREATE OR REPLACE VIEW job_all_documents AS
SELECT
  id,
  account_id,
  job_id,
  'photo' AS type,
  NULL AS file_name,
  NULL AS file_size,
  'image/jpeg' AS file_type,
  photo_url AS public_url,
  thumbnail_url,
  caption,
  taken_by AS uploaded_by,
  created_at,
  created_at AS updated_at
FROM job_photos
UNION ALL
SELECT
  id,
  account_id,
  job_id,
  type,
  file_name,
  file_size,
  file_type,
  public_url,
  thumbnail_url,
  caption,
  uploaded_by,
  created_at,
  updated_at
FROM job_documents;

-- Grant permissions on view
GRANT SELECT ON job_all_documents TO authenticated;

-- Comment on tables and columns
COMMENT ON TABLE job_documents IS 'Stores general job documents (PDFs, estimates, invoices, contracts)';
COMMENT ON COLUMN job_documents.type IS 'Document type: photo, pdf, estimate, invoice, contract, signature, other';
COMMENT ON COLUMN job_documents.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN job_documents.public_url IS 'Public URL for document access';
COMMENT ON COLUMN job_photos.category IS 'Photo category: before, after, progress, completed';
COMMENT ON VIEW job_all_documents IS 'Unified view of all job photos and documents';
