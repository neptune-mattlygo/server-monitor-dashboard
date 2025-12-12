-- Add FileMaker metadata fields
-- These fields store metadata fetched from FileMaker Server Admin API

ALTER TABLE servers ADD COLUMN fm_metadata JSONB;
ALTER TABLE servers ADD COLUMN fm_metadata_updated_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN fm_server_version TEXT;
ALTER TABLE servers ADD COLUMN fm_host_name TEXT;

-- Add comments
COMMENT ON COLUMN servers.fm_metadata IS 'Full metadata JSON from FileMaker Server Admin API';
COMMENT ON COLUMN servers.fm_metadata_updated_at IS 'Timestamp when metadata was last fetched';
COMMENT ON COLUMN servers.fm_server_version IS 'FileMaker Server version from metadata';
COMMENT ON COLUMN servers.fm_host_name IS 'Host name from FileMaker Server metadata';
