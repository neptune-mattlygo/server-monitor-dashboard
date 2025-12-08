-- Add region support to hosts
-- This allows hosts to be assigned to regions, and incidents can affect entire regions

-- Add region_id to hosts table
ALTER TABLE hosts 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hosts_region_id ON hosts(region_id);

-- Add comment
COMMENT ON COLUMN hosts.region_id IS 'Links host to a region for grouping and incident management';
