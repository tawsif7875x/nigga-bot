# Security Guide

## Rate Limiting
The bot implements multiple layers of rate limiting:

```javascript
{
  "messageRateLimit": {
    "enabled": true,
    "windowMs": 60000,  // 1 minute
    "max": 10          // 10 messages per minute
  }
}
```

## Safe Mode
Safe mode protects against spam and abuse:

- Message limits per user/group
- Content filtering
- Activity hours
- Auto breaks
- Spam detection

## Anti-Detection
Features to avoid Facebook's automated detection:

- Random delays
- Human-like typing
- Activity patterns
- Auto breaks
- User agent rotation

## Best Practices
1. Use proper rate limits
2. Enable content filtering
3. Set reasonable daily limits
4. Configure active hours
5. Enable auto breaks
