-- Add fmserver_name column to servers table for matching FileMaker webhook data
ALTER TABLE servers ADD COLUMN fmserver_name TEXT;

-- Add index for faster lookups
CREATE INDEX idx_servers_fmserver_name ON servers(fmserver_name) WHERE fmserver_name IS NOT NULL;

-- Add comment
COMMENT ON COLUMN servers.fmserver_name IS 'FileMaker Server name used to match incoming webhook data (may differ from display name)';
