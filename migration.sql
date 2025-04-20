-- Add metadata, description, and type columns to the nodes table if they don't exist

-- Check if metadata column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE nodes ADD COLUMN metadata JSONB DEFAULT '{}' NOT NULL;
    END IF;
END $$;

-- Check if description column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'description'
    ) THEN
        ALTER TABLE nodes ADD COLUMN description TEXT;
    END IF;
END $$;

-- Check if type column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'type'
    ) THEN
        ALTER TABLE nodes ADD COLUMN type TEXT DEFAULT 'city' NOT NULL;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'nodes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE nodes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$; 