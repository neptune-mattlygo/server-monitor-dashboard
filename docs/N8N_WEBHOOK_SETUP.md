# UptimeRobot Email Webhook - n8n Configuration Guide

## Issue Diagnosis

The error `NodeApiError: The service was not able to process your request` from n8n typically means:

1. **Wrong URL** - The endpoint might not be accessible
2. **Authentication failure** - Header or secret mismatch
3. **Network issue** - Cannot reach the server
4. **Malformed request** - JSON payload or headers incorrect

## n8n HTTP Request Node Configuration

### Basic Settings
- **Method**: `POST`
- **URL**: `https://YOUR-DOMAIN.com/api/webhooks/uptimerobot`
  - Replace `YOUR-DOMAIN.com` with your actual Vercel deployment URL
  - For local testing: `http://localhost:3000/api/webhooks/uptimerobot`

### Headers
Add these headers (Authentication > Header Auth > Add):

```
Content-Type: application/json
x-webhook-secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=
```

**IMPORTANT**: 
- Header name is `x-webhook-secret` (lowercase, with hyphen)
- NOT `X-Webhook-Secret` or `X_WEBHOOK_SECRET`
- The secret value should match exactly from your `.env.local`

### Body (JSON)
Send as JSON, not form data:

```json
{
  "emailSubject": "{{ $json.subject }}",
  "emailBody": "{{ $json.text }}"
}
```

Or if using plain text body from email trigger:

```json
{
  "emailSubject": "{{ $node['Email Trigger'].json.subject }}",
  "emailBody": "{{ $node['Email Trigger'].json.text }}"
}
```

## Testing Steps

### 1. Test with curl (Local)

First, start your dev server:
```bash
cd /Users/mattlygo/Documents/GitHub/server-status/apps/client-server/server-monitor
npm run dev
```

Then in another terminal:
```bash
./test-webhook.sh
```

Expected response: `{"success":true,"serverId":"..."}`

### 2. Check n8n Configuration

In n8n HTTP Request node:
1. **URL**: Must be full URL including `https://`
2. **Authentication**: Set to "None" or "Header Auth"
3. **Headers**: Add as separate headers, not in URL
4. **Body**: Must be valid JSON
5. **Options**: 
   - Response Format: `JSON`
   - Timeout: At least 30000ms

### 3. Common n8n Mistakes

❌ **Wrong**: `X-Webhook-Secret` (uppercase X)  
✅ **Correct**: `x-webhook-secret` (lowercase)

❌ **Wrong**: Sending as form data  
✅ **Correct**: Send as JSON with Content-Type header

❌ **Wrong**: Using `http://` for production  
✅ **Correct**: Use `https://` for Vercel deployments

❌ **Wrong**: Missing protocol `your-domain.com/api/...`  
✅ **Correct**: Include protocol `https://your-domain.com/api/...`

### 4. Debug n8n Request

Enable "Always Output Data" in n8n HTTP Request node to see the actual error:

1. Click on HTTP Request node
2. Go to Settings (gear icon)
3. Enable "Always Output Data"
4. Check the execution output for detailed error message

### 5. Verify Production URL

Get your Vercel deployment URL:
```bash
vercel ls
```

Or check in Vercel dashboard under "Deployments"

## Example n8n Workflow

```
[Email Trigger] 
    ↓
[Extract Email Data]
    ↓
[HTTP Request to Webhook]
    ↓
[Success Handler]
```

### Email Trigger Node
- Configure to receive UptimeRobot emails
- Extract: `subject`, `text` (or `html`)

### HTTP Request Node
- **URL**: `https://your-server.vercel.app/api/webhooks/uptimerobot`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-webhook-secret`: `CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=`
- **Body**:
  ```json
  {
    "emailSubject": "={{ $json.subject }}",
    "emailBody": "={{ $json.text }}"
  }
  ```

## Troubleshooting Checklist

- [ ] Dev server running on correct port (3000)
- [ ] Production URL includes `https://` protocol
- [ ] Header name is lowercase `x-webhook-secret`
- [ ] Secret value matches `.env.local` exactly
- [ ] Content-Type is `application/json`
- [ ] Body is valid JSON (not form data)
- [ ] No typos in URL path (`/api/webhooks/uptimerobot`)
- [ ] Firewall/network allows outbound HTTPS
- [ ] n8n can resolve the domain name

## Testing Production Webhook

If deployed to Vercel, test with:

```bash
curl -X POST https://YOUR-DOMAIN.vercel.app/api/webhooks/uptimerobot \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=" \
  -d '{
    "emailSubject": "Monitor is DOWN: test.example.com",
    "emailBody": "Monitor name\ntest.example.com\nChecked URL\ntest.example.com\nRoot cause\nConnection Timeout\nIncident started at\n2025-12-17 09:22:59"
  }'
```

Expected: `{"success":true,"serverId":"uuid-here"}`

## Need More Help?

1. Check n8n execution logs for detailed error
2. Check Vercel logs if deployed: `vercel logs`
3. Test webhook locally with curl first
4. Verify the endpoint exists: `GET https://your-domain.com/` should return 200
