# OTP Vote Confirmation - Quick Start Guide

## Overview

The voting system now requires email verification via OTP (One-Time Password) before votes are registered. This enhances security and ensures vote authenticity.

## Quick Implementation

### 1. Run Database Migration

```bash
npx prisma migrate dev --name add-vote-otp-model
```

Or generate Prisma client:

```bash
npx prisma generate
```

### 2. Verify Environment Variables

Ensure these are set in your `.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Your App <noreply@yourapp.com>"

# Or use Resend (alternative)
RESEND_API_KEY="your-resend-api-key"

# App URL (for email links)
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Test the Flow

#### A. Request OTP

```bash
curl -X POST http://localhost:3000/api/vote/request-otp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "categoryId": "category-uuid",
    "nomineeId": "nominee-uuid"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "OTP kode sendt til din e-post",
  "expires": 1234567890000,
  "expiresIn": 900000
}
```

#### B. Check Email

You'll receive an email with:
- Nominee name and category
- 6-digit OTP code
- Expiration time (15 minutes)

#### C. Confirm Vote

```bash
curl -X POST http://localhost:3000/api/vote/confirm-otp \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "categoryId": "category-uuid",
    "code": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Stemme registrert!",
  "vote": {
    "id": "vote-uuid",
    "categoryId": "category-uuid",
    "nomineeId": "nominee-uuid",
    "timestamp": 1234567890000
  }
}
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/vote/request-otp` | POST | Request OTP for voting |
| `/api/vote/confirm-otp` | POST | Confirm vote with OTP |
| `/api/vote/pending-otp` | GET | Check pending OTP status |
| `/api/vote/cancel-otp` | POST | Cancel pending OTP |
| `/api/admin/votes/pending-otps` | GET | List all pending OTPs (admin) |
| `/api/admin/votes/cleanup-otps` | POST | Cleanup expired OTPs (admin) |

## Frontend Integration Example

```typescript
// Vote button clicked
async function handleVoteClick(categoryId: string, nomineeId: string) {
  try {
    // Step 1: Request OTP
    const response = await fetch('/api/vote/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, nomineeId }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error);
      return;
    }

    const result = await response.json();
    
    // Step 2: Show OTP input dialog
    const code = await showOTPDialog(result.expiresIn);
    
    // Step 3: Confirm vote with OTP
    const confirmResponse = await fetch('/api/vote/confirm-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, code }),
    });

    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      alert(error.error);
      return;
    }

    const confirmResult = await confirmResponse.json();
    alert('Stemme registrert! ✓');
    
  } catch (error) {
    console.error('Vote error:', error);
    alert('En feil oppstod');
  }
}
```

## Email Configuration

### Option 1: Gmail SMTP

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

### Option 2: Resend (Recommended for Production)

1. Sign up at https://resend.com
2. Get your API key
3. Set `RESEND_API_KEY` in `.env`
4. Verify your domain

## Security Features

✅ **Rate Limiting**: 1 OTP request per 60 seconds per category  
✅ **Expiration**: OTP codes expire after 15 minutes  
✅ **Single Use**: OTP codes cannot be reused  
✅ **Validation**: Vote eligibility checked before OTP generation  
✅ **Audit Logging**: All OTP activities logged  
✅ **IP Tracking**: IP address stored with OTP for fraud detection  

## Database Changes

New table: `VoteOTP`

```sql
CREATE TABLE "VoteOTP" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "nomineeId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "expires" BIGINT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" BIGINT NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  
  CONSTRAINT "VoteOTP_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VoteOTP_email_categoryId_key" UNIQUE ("email", "categoryId")
);

CREATE INDEX "VoteOTP_email_idx" ON "VoteOTP"("email");
CREATE INDEX "VoteOTP_expires_idx" ON "VoteOTP"("expires");
```

## Files Created

### Services
- `services/voteOTPService.ts` - OTP business logic
- `services/emailService.ts` - Email sending functionality

### API Routes
- `app/api/vote/request-otp/route.ts` - Request OTP
- `app/api/vote/confirm-otp/route.ts` - Confirm vote with OTP
- `app/api/vote/pending-otp/route.ts` - Check pending OTP
- `app/api/vote/cancel-otp/route.ts` - Cancel pending OTP
- `app/api/admin/votes/pending-otps/route.ts` - Admin: List pending OTPs
- `app/api/admin/votes/cleanup-otps/route.ts` - Admin: Cleanup expired OTPs

### Documentation
- `docs/VOTE_OTP_SYSTEM.md` - Comprehensive OTP system documentation

## Troubleshooting

### Problem: Emails not being sent

**Solution:**
1. Check environment variables
2. Verify SMTP credentials
3. Check spam folder
4. Review server logs for email errors

### Problem: OTP expired error

**Solution:**
- OTP codes expire after 15 minutes
- Request a new OTP code
- Users should verify their vote quickly

### Problem: Rate limiting errors

**Solution:**
- Wait 60 seconds between OTP requests
- This prevents spam and abuse

### Problem: Wrong code errors

**Solution:**
- Ensure user enters the code exactly as shown in email
- Code is case-sensitive (numeric only, but still)
- Check that code hasn't expired

## Maintenance

### Cleanup Expired OTPs

Run manually:
```bash
curl -X POST http://localhost:3000/api/admin/votes/cleanup-otps \
  -H "Cookie: admin-session-cookie"
```

Or setup a cron job:
```typescript
// Run every hour
import { cleanupExpiredVoteOTPs } from '@/services/voteOTPService';

setInterval(async () => {
  await cleanupExpiredVoteOTPs();
}, 60 * 60 * 1000);
```

### Monitor Pending OTPs

```bash
curl http://localhost:3000/api/admin/votes/pending-otps \
  -H "Cookie: admin-session-cookie"
```

## Migration from Old System

If you had direct voting without OTP:

1. **Update frontend** to use new OTP flow
2. **Keep old `/api/vote` endpoint** for backwards compatibility (optional)
3. **Add feature flag** to toggle OTP requirement
4. **Test thoroughly** before deploying
5. **Communicate change** to users

## Next Steps

1. ✅ Run database migration
2. ✅ Configure email provider
3. ✅ Test OTP flow end-to-end
4. ✅ Update frontend to use OTP endpoints
5. ✅ Setup cron job for cleanup
6. ✅ Monitor email delivery
7. ✅ Deploy to production

## Support & Documentation

- Full documentation: `docs/VOTE_OTP_SYSTEM.md`
- API documentation: `docs/VOTE_API.md`
- Vote backend: `docs/VOTING_BACKEND.md`

## Questions?

Common issues and solutions are documented in `docs/VOTE_OTP_SYSTEM.md` under the "Troubleshooting" section.

---

**Version:** 1.0.0  
**Last Updated:** April 10, 2026  
**Status:** ✅ Ready for Production
