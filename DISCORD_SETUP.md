# Discord Alerts Setup

## Quick Setup (2 minutes)

### 1. Create Discord Webhook
1. Go to your Discord server
2. Right-click on a channel → **Edit Channel**
3. Go to **Integrations** → **Webhooks**
4. Click **Create Webhook**
5. Copy the webhook URL

### 2. Add to Environment
Add to your `.env` file:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url-here
```

### 3. Restart Backend
```bash
./pulsewatch-api
```

## What You'll Get

- 🔴 **Red alerts** when websites go DOWN
- 🟢 **Green alerts** when websites come back UP  
- 📊 **Response time** included in alerts
- 🚫 **No spam** - only alerts on status changes

## Example Alert
```
❌ Google is OFFLINE
URL: https://google.com
Response Time: 0ms
Today at 1:51 AM
```

## Troubleshooting

**No alerts?** Check:
1. Webhook URL is correct in `.env`
2. Backend restarted after adding webhook
3. Website actually changed status (up→down or down→up)

**Too many alerts?** The system only sends alerts when status changes, not every minute.