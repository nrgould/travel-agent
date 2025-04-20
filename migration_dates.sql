-- Add dedicated timestamp columns for start and end dates

-- Check if start_date column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE nodes ADD COLUMN start_date TIMESTAMPTZ;
    END IF;
END $$;

-- Check if end_date column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE nodes ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
END $$;

-- Migrate any existing date data from metadata to the dedicated columns
UPDATE nodes
SET 
  start_date = (metadata->>'startDate')::timestamptz,
  end_date = (metadata->>'endDate')::timestamptz
WHERE 
  metadata->>'startDate' IS NOT NULL OR
  metadata->>'endDate' IS NOT NULL; 