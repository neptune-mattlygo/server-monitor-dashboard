-- Add external_id column for tracking external monitoring services
-- Migration: Add external_id to servers table

ALTER TABLE servers ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_servers_external_id ON servers(external_id);

-- Add metadata column if it doesn't exist (JSONB for flexible data storage)
ALTER TABLE servers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on metadata for better query performance
CREATE INDEX IF NOT EXISTS idx_servers_metadata ON servers USING GIN (metadata);

-- Add comment
COMMENT ON COLUMN servers.external_id IS 'External service identifier (e.g., uptimerobot_12345)';
COMMENT ON COLUMN servers.metadata IS 'Additional data from external services (monitor settings, links, etc.)';
