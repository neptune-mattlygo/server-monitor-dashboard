-- Add server admin credentials fields
-- These fields store admin console login information for servers

ALTER TABLE servers ADD COLUMN admin_url TEXT;
ALTER TABLE servers ADD COLUMN admin_username TEXT;
ALTER TABLE servers ADD COLUMN admin_password TEXT;

-- Add comments
COMMENT ON COLUMN servers.admin_url IS 'Admin console URL for the server';
COMMENT ON COLUMN servers.admin_username IS 'Admin username for server console access';
COMMENT ON COLUMN servers.admin_password IS 'Encrypted admin password (stored with Supabase encryption at rest)';
