#!/bin/bash

# Test UptimeRobot webhook with email format
echo "Testing UptimeRobot webhook with email body..."

curl -X POST http://localhost:3000/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=" \
  -d '{
    "emailSubject": "Monitor is DOWN: tphub-dev.travelplaces.co.uk",
    "emailBody": "UptimeRobot\tGo to monitor →\ntphub-dev.travelplaces.co.uk is down.\nHello Neptune Digital,\n\nWe just detected an incident on your monitor. Your service is currently down.\n\nWe will alert you when it'\''s up again.\n\nMonitor name\ntphub-dev.travelplaces.co.uk\nChecked URL\ntphub-dev.travelplaces.co.uk\nRoot cause\nConnection Timeout\nRegion\nEurope\nIncident started at\n2025-12-17 09:22:59"
  }' \
  -v

echo -e "\n\n"
