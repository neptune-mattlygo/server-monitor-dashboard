#!/bin/bash

# This script exports production data and creates a seed.sql file
# Usage: ./scripts/export-prod-to-seed.sh <PRODUCTION_DB_URL>

if [ -z "$1" ]; then
  echo "Error: Production database URL required"
  echo "Usage: $0 <PRODUCTION_DB_URL>"
  echo "Example: $0 'postgresql://postgres:[password]@[host]:[port]/postgres'"
  exit 1
fi

PROD_DB_URL="$1"
OUTPUT_FILE="supabase/seed.sql"

echo "Exporting production data to $OUTPUT_FILE..."

# Export data from production
pg_dump "$PROD_DB_URL" \
  --data-only \
  --inserts \
  --column-inserts \
  --no-owner \
  --no-privileges \
  --table=hosts \
  --table=servers \
  --table=server_events \
  --table=user_profiles \
  --table=audit_log \
  > "$OUTPUT_FILE"

echo "Export complete!"
echo "Now run: npx supabase db reset"
