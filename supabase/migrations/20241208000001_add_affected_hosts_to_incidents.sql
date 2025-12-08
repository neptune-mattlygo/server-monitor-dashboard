-- Add affected_hosts column to status_incidents table
-- This allows incidents to specify affected hosts, and all servers in those hosts will be automatically included

ALTER TABLE status_incidents
ADD COLUMN IF NOT EXISTS affected_hosts UUID[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN status_incidents.affected_hosts IS 'Array of host IDs affected by this incident. Servers in these hosts are automatically included.';
