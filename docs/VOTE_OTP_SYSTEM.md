# Vote OTP System Documentation

## Overview

The Vote OTP (One-Time Password) system adds an extra layer of security and verification to the voting process. Voters must confirm their vote via a 6-digit code sent to their email before the vote is registered.

## Flow Diagram

```
1. User selects nominee
2. User clicks "Vote"
3. System validates vote eligibility
4. System generates OTP and sends email
5. User receives email with 6-digit code
6. User enters code in application
7. System verifies code
8. Vote is registered
9. Confirmation email sent
```

## API Endpoints

### 1. Request Vote OTP

**Endpoint:** `POST /api/vote/request-otp`

**Authentication:** Required (user must be logged in)

**Request Body:**
```json
{
  "categoryId": "string",
  "nomineeId": "string"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP kode sendt til din e-post",
  "expires": 1234567890000,
  "expiresIn": 900000
}
```

**Response (Error):**
```json
{
  "error": "Error message in Norwegian"
}
```

**Common Errors:**
- `Ikke logget inn` (401) - Not authenticated
- `Mangler kategori eller nominert` (400) - Missing data
- `Du har allerede stemt i denne kategorien` (409) - Already voted
- `Avstemningen er stengt` (403) - Poll is locked
- `Vent 60 sekunder før du ber om en ny kode` (429) - Rate limited

**Features:**
- Validates vote eligibility before generating OTP
- Rate limiting: 1 request per 60 seconds per category
- OTP expires after 15 minutes
- Sends beautifully formatted email with nominee and category details
- Stores IP and user agent for fraud detection

---

### 2. Confirm Vote with OTP

**Endpoint:** `POST /api/vote/confirm-otp`

**Authentication:** Required

**Request Body:**
```json
{
  "categoryId": "string",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Stemme registrert!",
  "vote": {
    "id": "string",
    "categoryId": "string",
    "nomineeId": "string",
    "timestamp": 1234567890000
  }
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Common Errors:**
- `Ugyldig eller utløpt kode` (400) - Invalid or expired code
- `Denne koden er allerede brukt` (400) - Code already used
- `Feil kode. Vennligst prøv igjen.` (400) - Wrong code
- `Koden har utløpt. Vennligst be om en ny kode.` (400) - Expired

**Features:**
- Verifies OTP code
- Creates vote with fraud detection
- Sends confirmation email
- Logs successful verification
- Marks OTP as used to prevent reuse

---

### 3. Check Pending OTP

**Endpoint:** `GET /api/vote/pending-otp?categoryId={categoryId}`

**Authentication:** Required

**Response (Has Pending):**
```json
{
  "hasPending": true,
  "categoryId": "string",
  "nomineeId": "string",
  "expires": 1234567890000,
  "timeRemaining": 450000
}
```

**Response (No Pending):**
```json
{
  "hasPending": false
}
```

**Use Case:** Check if user has a pending OTP for a category before allowing them to request a new one.

---

### 4. Cancel Pending OTP

**Endpoint:** `POST /api/vote/cancel-otp`

**Authentication:** Required

**Request Body:**
```json
{
  "categoryId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP kode kansellert"
}
```

**Use Case:** Allow users to cancel a pending OTP and request a new one (e.g., if they want to change their vote before confirming).

---

### 5. Get All Pending OTPs (Admin)

**Endpoint:** `GET /api/admin/votes/pending-otps`

**Authentication:** Required (admin or manager role)

**Response:**
```json
[
  {
    "id": "string",
    "email": "string",
    "categoryId": "string",
    "nomineeId": "string",
    "createdAt": 1234567890000,
    "expires": 1234567890000,
    "timeRemaining": 450000
  }
]
```

**Use Case:** Monitor pending OTP requests, identify potential issues.

---

### 6. Cleanup Expired OTPs (Admin)

**Endpoint:** `POST /api/admin/votes/cleanup-otps`

**Authentication:** Required (admin role only)

**Response:**
```json
{
  "success": true,
  "message": "Ryddet opp 15 utløpte OTP koder",
  "count": 15
}
```

**Use Case:** Manual cleanup of expired OTP records (can be scheduled as cron job).

---

## Database Schema

### VoteOTP Model

```prisma
model VoteOTP {
  id         String  @id @default(uuid())
  email      String
  categoryId String
  nomineeId  String
  code       String
  expires    BigInt
  ip         String?
  userAgent  String?
  createdAt  BigInt
  verified   Boolean @default(false)

  @@unique([email, categoryId])
  @@index([email])
  @@index([expires])
}
```

**Key Features:**
- `@@unique([email, categoryId])` - One pending OTP per category per user
- `verified` flag prevents reuse of OTP
- Stores IP and user agent for fraud tracking
- Indexed on email and expires for performance

---

## Service Functions

### voteOTPService.ts

```typescript
import {
  requestVoteOTP,
  verifyVoteOTP,
  getPendingVoteOTP,
  cancelVoteOTP,
  cleanupExpiredVoteOTPs,
  getAllPendingVoteOTPs
} from '@/services/voteOTPService';

// Request OTP for a vote
const otp = await requestVoteOTP({
  email: 'user@example.com',
  categoryId: 'cat-id',
  nomineeId: 'nom-id',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

// Verify OTP code
const pendingVote = await verifyVoteOTP({
  email: 'user@example.com',
  categoryId: 'cat-id',
  code: '123456'
});

// Check for pending OTP
const pending = await getPendingVoteOTP('user@example.com', 'cat-id');

// Cancel pending OTP
const cancelled = await cancelVoteOTP('user@example.com', 'cat-id');

// Cleanup expired (admin)
const count = await cleanupExpiredVoteOTPs();
```

### emailService.ts

```typescript
import {
  sendVoteOTPEmail,
  sendVoteConfirmationEmail
} from '@/services/emailService';

// Send OTP email
await sendVoteOTPEmail(
  'user@example.com',
  '123456',
  'John Doe',
  'Brobyggerprisen 2026'
);

// Send confirmation email
await sendVoteConfirmationEmail(
  'user@example.com',
  'John Doe',
  'Brobyggerprisen 2026'
);
```

---

## Email Templates

### OTP Email

**Subject:** `Bekreft din stemme – Unity Awards 2026`

**Features:**
- Professional gradient header
- Nominee and category highlighted
- Large, easy-to-read OTP code
- Important instructions (validity, security)
- Mobile-responsive design

### Confirmation Email

**Subject:** `Stemme registrert – Unity Awards 2026`

**Features:**
- Success checkmark icon
- Vote details confirmation
- "What happens next" section
- Link back to voting portal
- Professional branding

---

## Frontend Integration

### Step 1: Request OTP

```typescript
async function requestVoteOTP(categoryId: string, nomineeId: string) {
  const response = await fetch('/api/vote/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, nomineeId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const result = await requestVoteOTP('cat-id', 'nom-id');
  showOTPInputDialog(result.expiresIn);
} catch (error) {
  showError(error.message);
}
```

### Step 2: Confirm Vote

```typescript
async function confirmVoteWithOTP(categoryId: string, code: string) {
  const response = await fetch('/api/vote/confirm-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Usage
try {
  const result = await confirmVoteWithOTP('cat-id', '123456');
  showSuccessMessage(result.message);
} catch (error) {
  if (error.message.includes('Feil kode')) {
    showWrongCodeError();
  } else if (error.message.includes('utløpt')) {
    showExpiredCodeError();
  } else {
    showError(error.message);
  }
}
```

### Complete Flow Example

```typescript
// 1. User clicks vote button
async function handleVote(categoryId: string, nomineeId: string) {
  try {
    // Check if already voted
    const status = await checkVoteStatus(categoryId);
    if (status.hasVoted) {
      showAlreadyVotedMessage();
      return;
    }

    // Check for pending OTP
    const pending = await checkPendingOTP(categoryId);
    if (pending.hasPending) {
      showOTPInputDialog(pending.timeRemaining);
      return;
    }

    // Request new OTP
    showLoadingSpinner();
    const result = await requestVoteOTP(categoryId, nomineeId);
    hideLoadingSpinner();
    
    showOTPInputDialog(result.expiresIn);
    showSuccessToast('OTP kode sendt til din e-post');
  } catch (error) {
    hideLoadingSpinner();
    showError(error.message);
  }
}

// 2. User enters OTP code
async function handleOTPSubmit(categoryId: string, code: string) {
  try {
    showLoadingSpinner();
    const result = await confirmVoteWithOTP(categoryId, code);
    hideLoadingSpinner();
    
    hideOTPInputDialog();
    showSuccessMessage('Stemme registrert!');
    refreshVoteStatus();
  } catch (error) {
    hideLoadingSpinner();
    showError(error.message);
  }
}

// 3. Resend OTP (user didn't receive it)
async function handleResendOTP(categoryId: string) {
  try {
    // Cancel existing OTP
    await cancelVoteOTP(categoryId);
    
    // User needs to select nominee again and request new OTP
    showVoteSelectionDialog();
  } catch (error) {
    showError(error.message);
  }
}
```

---

## Security Features

### 1. Rate Limiting
- Only 1 OTP request per 60 seconds per category
- Prevents OTP spam and brute force attempts

### 2. Expiration
- OTP codes expire after 15 minutes
- Automatic cleanup of expired codes

### 3. Single Use
- OTP codes are marked as `verified` after use
- Cannot be reused even if still valid

### 4. Validation
- Vote eligibility checked before OTP generation
- Prevents wasting OTP codes on invalid votes

### 5. Audit Logging
- All OTP requests logged
- Failed verification attempts logged
- Successful confirmations logged

### 6. IP & User Agent Tracking
- Stored with OTP for fraud detection
- Can identify suspicious patterns

---

## Best Practices

### For Frontend Developers

1. **Show countdown timer** for OTP expiration
2. **Allow resend** after 60 seconds
3. **Auto-format OTP input** (6 digits, numeric only)
4. **Clear error messages** for each error type
5. **Confirm before requesting** new OTP if one is pending
6. **Auto-submit** when 6 digits entered (UX improvement)

### For Backend Developers

1. **Monitor OTP request volume** for unusual patterns
2. **Cleanup expired OTPs** regularly (cron job recommended)
3. **Log all security events** for audit trail
4. **Rate limit aggressively** to prevent abuse
5. **Use transaction** when creating vote after OTP verification

### For System Administrators

1. **Configure email provider** (SMTP or Resend)
2. **Test email delivery** regularly
3. **Monitor bounce rates** and email reputation
4. **Review audit logs** for suspicious patterns
5. **Set up alerts** for high OTP request volumes
6. **Schedule cleanup job** (daily recommended)

---

## Error Handling

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "Vent 60 sekunder" | Rate limited | Wait and retry |
| "Koden har utløpt" | OTP expired (>15 min) | Request new OTP |
| "Feil kode" | Wrong code entered | Check email and retry |
| "Denne koden er allerede brukt" | OTP already verified | Vote already registered |
| "Ugyldig eller utløpt kode" | No OTP found | Request new OTP |
| "Du har allerede stemt" | Already voted in category | Cannot vote again |

### Error Recovery

```typescript
function handleOTPError(error: string) {
  if (error.includes('60 sekunder')) {
    showCountdown(60);
  } else if (error.includes('utløpt')) {
    showExpiredDialog();
    enableResendButton();
  } else if (error.includes('Feil kode')) {
    showWrongCodeError();
    clearOTPInput();
  } else if (error.includes('allerede brukt')) {
    showVoteConfirmedDialog();
  } else {
    showGenericError(error);
  }
}
```

---

## Performance Optimization

### Indexes

Ensure these indexes exist (already in schema):
- `VoteOTP.email` - Fast lookup by email
- `VoteOTP.expires` - Efficient cleanup queries
- `VoteOTP.[email, categoryId]` - Unique constraint + fast lookup

### Cleanup Strategy

```typescript
// Cron job (every hour)
import { cleanupExpiredVoteOTPs } from '@/services/voteOTPService';

async function hourlyCleanup() {
  const count = await cleanupExpiredVoteOTPs();
  console.log(`Cleaned up ${count} expired vote OTPs`);
}
```

### Email Optimization

- Use email service provider (Resend or SMTP)
- Configure retries for failed sends
- Log email failures for monitoring
- Consider email queue for high volume

---

## Testing

### Unit Tests

```typescript
describe('Vote OTP Service', () => {
  it('should generate 6-digit code', async () => {
    const otp = await requestVoteOTP({ ... });
    expect(otp.code).toMatch(/^\d{6}$/);
  });

  it('should prevent duplicate requests within 60s', async () => {
    await requestVoteOTP({ ... });
    await expect(requestVoteOTP({ ... })).rejects.toThrow('60 sekunder');
  });

  it('should expire after 15 minutes', async () => {
    const otp = await requestVoteOTP({ ... });
    expect(otp.expires - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it('should reject wrong code', async () => {
    await requestVoteOTP({ ... });
    await expect(verifyVoteOTP({ code: '000000', ... })).rejects.toThrow('Feil kode');
  });

  it('should prevent code reuse', async () => {
    const otp = await requestVoteOTP({ ... });
    await verifyVoteOTP({ code: otp.code, ... });
    await expect(verifyVoteOTP({ code: otp.code, ... })).rejects.toThrow('allerede brukt');
  });
});
```

---

## Migration from Old System

If migrating from direct voting to OTP voting:

1. **Update frontend** to use OTP flow
2. **Keep old endpoint** for backwards compatibility (deprecated)
3. **Add feature flag** to enable/disable OTP requirement
4. **Communicate change** to users in advance
5. **Monitor adoption** and support issues
6. **Remove old endpoint** after migration period

---

## Monitoring & Alerts

### Key Metrics

1. **OTP Request Volume**
   - Requests per minute/hour
   - Success vs error rate

2. **OTP Verification Rate**
   - Percentage of OTPs that get verified
   - Average time to verification

3. **Email Delivery**
   - Send success rate
   - Bounce rate
   - Delivery time

4. **Error Rates**
   - Wrong code attempts
   - Expired codes
   - Rate limit hits

### Recommended Alerts

- OTP request volume > 1000/hour (potential abuse)
- Email failure rate > 5% (delivery issue)
- Wrong code rate > 30% (user confusion)
- Expired code rate > 50% (UX issue - codes expiring too fast)

---

## Troubleshooting

### Users Not Receiving Emails

1. Check email provider configuration
2. Verify SMTP credentials
3. Check spam folder
4. Review email logs for errors
5. Test with different email providers

### High Error Rates

1. Review audit logs for patterns
2. Check rate limiting thresholds
3. Verify OTP expiration time (15 min may be too short)
4. Monitor for brute force attempts
5. Check database performance

### Performance Issues

1. Ensure indexes are created
2. Run cleanup job more frequently
3. Monitor database query performance
4. Consider caching email templates
5. Use connection pooling for email sending

---

## Future Enhancements

1. **SMS OTP** - Alternative to email
2. **Biometric verification** - Fingerprint/Face ID
3. **Remember device** - Skip OTP for trusted devices
4. **Backup codes** - Pre-generated codes for offline use
5. **Multi-language support** - Translated emails
6. **Admin dashboard** - Real-time OTP monitoring
7. **Analytics** - Detailed OTP usage statistics

---

## Support

For issues or questions:
1. Check this documentation
2. Review audit logs for specific errors
3. Test email delivery manually
4. Check database for orphaned OTP records
5. Review code examples above

---

**Last Updated:** April 10, 2026  
**Version:** 1.0.0  
**Maintainer:** Vote Unity Summit Team
