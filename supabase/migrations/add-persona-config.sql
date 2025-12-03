-- Add persona_config column to accounts table if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='accounts' AND column_name='persona_config'
  ) THEN
    ALTER TABLE accounts ADD COLUMN persona_config jsonb default '{}'::jsonb;
    RAISE NOTICE 'Added persona_config column to accounts';
  ELSE
    RAISE NOTICE 'persona_config column already exists';
  END IF;
END $$;

