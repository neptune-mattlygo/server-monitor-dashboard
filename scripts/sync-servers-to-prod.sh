#!/bin/bash
# Script to clear production servers and load local servers

echo "Exporting local servers..."
docker exec -i supabase_db_server-monitor pg_dump -U postgres -d postgres -t servers --data-only --column-inserts --no-owner > /tmp/local_servers_export.sql

echo "Clearing production servers and dependencies..."
npx supabase db execute "
-- Clear all dependent tables first
TRUNCATE server_events CASCADE;
TRUNCATE audit_logs CASCADE;
TRUNCATE servers CASCADE;
" --db-url "$(npx supabase status --output json | jq -r '.DB_URL')"

echo "Loading local servers to production..."
cat /tmp/local_servers_export.sql | npx supabase db execute --file - --db-url "$(npx supabase status --output json | jq -r '.DB_URL')"

echo "Done! Check server count:"
npx supabase db execute "SELECT COUNT(*) FROM servers;" --db-url "$(npx supabase status --output json | jq -r '.DB_URL')"
