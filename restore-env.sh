#!/bin/bash
# Restore .env.local from backup
# Usage: ./restore-env.sh

if [ -f ".env.local.backup" ]; then
    cp .env.local.backup .env.local
    echo "✅ Restored .env.local from backup"
else
    echo "❌ No backup file found (.env.local.backup)"
    echo "Copying from .env.example instead..."
    cp .env.example .env.local
    echo "⚠️  Please fill in your actual credentials in .env.local"
fi
