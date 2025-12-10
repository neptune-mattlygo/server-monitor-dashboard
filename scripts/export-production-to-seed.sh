#!/bin/bash

# Script to export production Supabase database to local seed file
# This allows you to test migrations against real production data locally

set -e

echo "🔍 Exporting production database to seed file..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Get Supabase project details
echo "📋 You'll need your production Supabase connection details"
echo ""
read -p "Enter your Supabase project ID (from dashboard URL): " PROJECT_ID
read -p "Enter your database password: " -s DB_PASSWORD
echo ""

# Connection string
DB_HOST="${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo ""
echo "🔌 Connecting to production database..."

# Export schema and data using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --data-only \
  --table=public.servers \
  --table=public.hosts \
  --table=public.regions \
  --table=public.server_events \
  --table=public.webhook_secrets \
  > supabase/seed.sql

echo ""
echo "✅ Production data exported to supabase/seed.sql"
echo ""
echo "📝 Next steps:"
echo "   1. Review the seed file: cat supabase/seed.sql"
echo "   2. Apply to local database: npx supabase db reset"
echo "   3. Your local database will now match production"
echo ""
echo "⚠️  Note: This includes ALL production data. Be careful with sensitive information."
