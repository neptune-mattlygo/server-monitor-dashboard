-- Add bucket column to servers table for S3/storage matching
ALTER TABLE servers ADD COLUMN IF NOT EXISTS bucket TEXT;

-- Create index for faster bucket lookups
CREATE INDEX IF NOT EXISTS idx_servers_bucket ON servers(bucket) WHERE bucket IS NOT NULL;

-- Add comment
COMMENT ON COLUMN servers.bucket IS 'S3 bucket name or storage identifier for webhook matching';
