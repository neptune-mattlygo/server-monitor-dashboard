# Quick Fix for n8n Error

## Most Likely Issue: Header Name Case

The webhook expects the header name **exactly** as: `x-webhook-secret` (all lowercase)

### In n8n HTTP Request Node:

1. Go to **Headers** section
2. Add header:
   - **Name**: `x-webhook-secret` (copy this exactly)
   - **Value**: `CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=`

3. Add second header:
   - **Name**: `Content-Type`
   - **Value**: `application/json`

### Full n8n Configuration

**URL**: `https://your-domain.vercel.app/api/webhooks/uptimerobot`

**Method**: POST

**Authentication**: None (using custom header instead)

**Headers**:
```
x-webhook-secret: CcJlNnU6609i6PcGMp9oKiKcpY4xaCGuwNEfwAgq7uM=
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "emailSubject": "={{ $json.subject }}",
  "emailBody": "={{ $json.text }}"
}
```

### Test It

Save and execute the workflow. You should get:
- Status: 200
- Response: `{"success":true,"serverId":"..."}`

### If Still Failing

Check in n8n execution:
1. Click on the HTTP Request node after execution
2. Look at "Input Data" - verify the JSON is correct
3. Look at "Output Data" - see the actual error message

Common errors:
- **401 Unauthorized**: Header name wrong or secret mismatch
- **429 Too Many Requests**: Rate limited, wait 1 minute
- **500 Internal Server Error**: Server issue, check logs
- **Cannot reach host**: Wrong URL or server not running
