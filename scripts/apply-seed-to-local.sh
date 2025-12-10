#!/bin/bash

# Script to apply seed.sql to local Supabase database
# Workaround for Supabase CLI config issues with PostgreSQL 17

set -e

echo "🔄 Applying seed data to local Supabase database..."
echo ""

# Check if seed file exists
if [ ! -f "supabase/seed.sql" ]; then
    echo "❌ Error: supabase/seed.sql not found"
    echo "   Run ./scripts/export-production-to-seed.sh first"
    exit 1
fi

# Check if Docker is running (required for local Supabase)
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Start Docker Desktop and try again"
    exit 1
fi

# Check if local Supabase is running
echo "📡 Checking if local Supabase is running..."
if ! docker ps | grep -q supabase-db; then
    echo "❌ Local Supabase is not running"
    echo "   Start it with: npx supabase start"
    echo "   (ignore the config warnings, it still starts)"
    exit 1
fi

echo "✅ Local Supabase is running"
echo ""

# Get the Supabase DB container
DB_CONTAINER=$(docker ps --filter "name=supabase-db" --format "{{.Names}}" | head -n 1)

if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Could not find Supabase database container"
    exit 1
fi

echo "🗄️  Found database container: $DB_CONTAINER"
echo ""

# Clear existing data
echo "🧹 Clearing existing data..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres <<EOF
TRUNCATE TABLE public.server_events CASCADE;
TRUNCATE TABLE public.servers CASCADE;
TRUNCATE TABLE public.hosts CASCADE;
TRUNCATE TABLE public.regions CASCADE;
TRUNCATE TABLE public.webhook_secrets CASCADE;
EOF

echo "✅ Existing data cleared"
echo ""

# Apply seed data
echo "📥 Applying seed data..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres < supabase/seed.sql

echo ""
echo "✅ Seed data applied successfully!"
echo ""
echo "🎉 Your local database now has production data"
echo ""
echo "📝 Next steps:"
echo "   - View in Supabase Studio: http://localhost:54323"
echo "   - Run your app: npm run dev"
echo "   - Test your changes with real production data"
echo ""
