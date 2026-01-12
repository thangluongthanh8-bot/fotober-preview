# Email Configuration for Fotober Preview

## RESEND API (Recommended - Free tier: 100 emails/day, 3000/month)
Sign up at: https://resend.com

Add these to your `.env` file:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@fotober.com
```

## Sales Email Configuration
Set `sale_email` in the API response or in `constant.ts` to receive revision notifications:

```
sale_email: "sales@fotober.com"
```

## Testing
Without `RESEND_API_KEY`, the email API runs in simulation mode and logs to console.
