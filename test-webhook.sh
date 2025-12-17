#!/bin/bash

# Test UptimeRobot webhook with email format
# Usage: WEBHOOK_SECRET_UPTIMEROBOT=your_secret_here ./test-webhook.sh

if [ -z "$WEBHOOK_SECRET_UPTIMEROBOT" ]; then
  echo "Error: WEBHOOK_SECRET_UPTIMEROBOT environment variable is not set"
  echo "Usage: WEBHOOK_SECRET_UPTIMEROBOT=your_secret_here ./test-webhook.sh"
  exit 1
fi

echo "Testing UptimeRobot webhook with email body..."

curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET_UPTIMEROBOT" \
  -d '{
    "emailSubject": "Monitor is DOWN: tphub-dev.travelplaces.co.uk",
    "emailBody": "UptimeRobot\tGo to monitor →\ntphub-dev.travelplaces.co.uk is down.\nHello Neptune Digital,\n\nWe just detected an incident on your monitor. Your service is currently down.\n\nWe will alert you when it'\''s up again.\n\nMonitor name\ntphub-dev.travelplaces.co.uk\nChecked URL\ntphub-dev.travelplaces.co.uk\nRoot cause\nConnection Timeout\nRegion\nEurope\nIncident started at\n2025-12-17 09:22:59"
  }' \
  -v

echo -e "\n\n"
