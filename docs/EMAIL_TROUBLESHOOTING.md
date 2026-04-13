# Email Configuration Troubleshooting Guide

## Issue: Emails Not Being Sent

### Quick Diagnosis

Run this curl command to test email sending (replace with admin credentials):

```bash
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Cookie: your-admin-session-cookie" \
  -d '{"email": "your-email@example.com"}'
```

### Common Issues with Gmail SMTP

#### 1. App Password Required

Gmail requires an App Password when using 2-factor authentication.

**Solution:**

1. Go to Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification → App passwords
3. Generate new app password for "Mail"
4. Update `.env`:
   ```env
   SMTP_PASSWORD="your-16-character-app-password"
   ```

#### 2. "Less Secure Apps" Disabled

If not using 2FA, you need to enable less secure apps.

**Solution:**

1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn on "Allow less secure apps"
3. Or preferably, enable 2FA and use App Password (more secure)

#### 3. Gmail Blocking Sign-in Attempts

Gmail might block sign-in attempts from new locations.

**Solution:**

1. Check your email for "Critical security alert" from Google
2. Click "Yes, it was me" to approve the sign-in
3. Try sending email again

### Current Configuration Check

Your current `.env` has:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="unitysparknorway@gmail.com"
SMTP_PASSWORD="qrcmzovlwaxjtfss"
SMTP_FROM="post@unitysummit.no <VOTE UNITY SUMMIT>"
```

### Verify Email Settings

1. **Check if password is App Password:**
   - App passwords are 16 characters without spaces
   - Current password looks correct length

2. **Verify SMTP settings:**
   - Gmail SMTP: `smtp.gmail.com`
   - Port 587 with STARTTLS (secure: false) ✓
   - Port 465 with SSL (secure: true)

### Testing Steps

#### Step 1: Test Email Configuration

```bash
# In your terminal
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "unitysparknorway@gmail.com"}'
```

#### Step 2: Check Server Logs

Look for these log messages:

- `[Email] Attempting to send email to...`
- `[SMTP] Transporter configured, sending email...`
- `[SMTP] Email sent successfully!` ✓ Success
- `[SMTP] Failed to send email:` ✗ Error (check error details)

#### Step 3: Verify Environment Variables

Create a test file `test-env.js`:

```javascript
require('dotenv').config();

console.log('SMTP Configuration:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
```

Run: `node test-env.js`

### Alternative: Use Resend (Recommended)

Resend is easier to configure and more reliable:

1. Sign up at https://resend.com
2. Get API key
3. Update `.env`:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   ```
4. Verify domain (optional but recommended)

### Email Service Code Overview

The email service prioritizes providers in this order:

1. **Resend** (if `RESEND_API_KEY` is set)
2. **SMTP** (if `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` are set)
3. **None** (logs error and returns false)

### Debug Mode

In development, OTP codes are logged to console:

```
[Vote OTP] Development mode - OTP code: 123456
```

And included in API response:

```json
{
  "success": true,
  "code": "123456"
}
```

### SMTP Error Codes

Common SMTP errors:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| EAUTH | Authentication failed | Check username/password |
| ECONNECTION | Connection failed | Check host/port |
| ETIMEDOUT | Timeout | Check firewall/network |
| EENVELOPE | Invalid sender/recipient | Check email addresses |

### Firewall/Network Issues

Some networks block SMTP ports:

- **Port 587** (STARTTLS) - usually allowed
- **Port 465** (SSL) - sometimes blocked
- **Port 25** - often blocked

Try port 587 first (current configuration).

### Testing Email Manually

Test SMTP credentials manually:

```bash
# Using telnet
telnet smtp.gmail.com 587

# Using openssl
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

Or use an online SMTP tester:
- https://www.smtper.net/
- https://mxtoolbox.com/diagnostic.aspx

### Production Recommendations

For production, use a dedicated email service:

1. **Resend** (easiest, recommended)
   - Simple API
   - Good deliverability
   - Free tier: 3,000 emails/month

2. **SendGrid**
   - Robust infrastructure
   - Advanced analytics
   - Free tier: 100 emails/day

3. **Amazon SES**
   - Very cheap
   - High volume capable
   - Requires AWS setup

4. **Mailgun**
   - Developer-friendly
   - Good documentation
   - Free tier: 5,000 emails/month

### Immediate Fix Checklist

- [ ] Verify Gmail App Password is correct
- [ ] Check if "Less secure apps" is enabled (if not using 2FA)
- [ ] Test with `/api/admin/test-email` endpoint
- [ ] Check server logs for detailed error messages
- [ ] Try alternative email (not Gmail) to isolate Gmail-specific issues
- [ ] Consider switching to Resend for easier setup

### Quick Resend Setup

```bash
# 1. Sign up at resend.com
# 2. Get API key
# 3. Add to .env
echo 'RESEND_API_KEY="re_your_api_key"' >> .env

# 4. Restart server
npm run dev

# 5. Test
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Support

If issues persist:

1. Check server console logs
2. Test with test endpoint: `/api/admin/test-email`
3. Verify environment variables are loaded
4. Try alternative email provider
5. Check Gmail account security settings

---

**Status:** Email service is implemented and enhanced with detailed logging.
**Next Step:** Test with `/api/admin/test-email` endpoint to diagnose specific issue.
