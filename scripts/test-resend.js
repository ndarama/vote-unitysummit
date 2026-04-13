/**
 * Resend API Test Script
 * Run this to verify your Resend API key works correctly
 * 
 * Usage: node scripts/test-resend.js
 */

require('dotenv').config();
const { Resend } = require('resend');

console.log('='.repeat(60));
console.log('RESEND API TEST');
console.log('='.repeat(60));
console.log('');

// Check API key
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found in .env file');
  console.error('Please add: RESEND_API_KEY="re_your_key_here"');
  process.exit(1);
}

console.log('✅ RESEND_API_KEY found:', apiKey.substring(0, 10) + '...');
console.log('');

// Initialize Resend
const resend = new Resend(apiKey);

// Test email
const testEmail = {
  from: 'Unity Awards <onboarding@resend.dev>',
  to: 'devstack@mountaincre8.com', // Your verified Resend email
  subject: 'Unity Awards - Resend API Test',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #001f2b 0%, #003d52 100%);padding:40px 32px;text-align:center">
          <h1 style="color:#ffffff;margin:0;font-size:28px">✅ Resend API Test</h1>
          <p style="color:#a0d5e8;margin:8px 0 0 0">Unity Awards 2026</p>
        </div>

        <!-- Content -->
        <div style="padding:40px 32px">
          <h2 style="color:#001f2b;margin:0 0 16px 0;font-size:22px">Success!</h2>
          
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px 0">
            Your Resend API is working correctly! 🎉
          </p>

          <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:0 0 24px 0">
            <p style="margin:0;color:#166534;font-size:14px;line-height:1.5">
              <strong>✓ API Key Valid</strong><br>
              <strong>✓ Email Sent Successfully</strong><br>
              <strong>✓ Ready for Production</strong>
            </p>
          </div>

          <div style="background-color:#f8f9fa;border-left:4px solid #001f2b;padding:16px 20px;margin:0 0 24px 0">
            <p style="margin:0;color:#666;font-size:13px;line-height:1.5">
              <strong>Note:</strong> This test email is sent from <code>onboarding@resend.dev</code>. 
              To use your own domain (<code>unitysummit.no</code>), you need to verify it in the Resend dashboard.
            </p>
          </div>

          <p style="color:#666;font-size:14px;line-height:1.6;margin:0">
            You can now use Resend for sending OTP codes and vote confirmations in the Unity Awards voting system.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color:#f8f9fa;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="margin:0;color:#888;font-size:12px">
            This is an automated test email from Unity Awards
          </p>
        </div>

      </div>
    </body>
    </html>
  `,
};

console.log('Sending test email...');
console.log('From:', testEmail.from);
console.log('To:', testEmail.to);
console.log('Subject:', testEmail.subject);
console.log('');

// Send email
resend.emails.send(testEmail)
  .then((result) => {
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('');
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('');
    console.log('Email ID:', result.data?.id || result.id);
    console.log('');
    console.log('='.repeat(60));
    console.log('Check your inbox:', testEmail.to);
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the email arrived in your inbox');
    console.log('2. To use your own domain (unitysummit.no):');
    console.log('   - Go to https://resend.com/domains');
    console.log('   - Add your domain and verify DNS records');
    console.log('   - Update the "from" address in emailService.ts');
    console.log('');
  })
  .catch((error) => {
    console.error('❌ FAILED TO SEND EMAIL');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('API key')) {
      console.error('Possible issues:');
      console.error('1. Invalid API key - check your RESEND_API_KEY in .env');
      console.error('2. Get a new key from https://resend.com/api-keys');
    } else if (error.message.includes('domain')) {
      console.error('Possible issues:');
      console.error('1. The "from" email domain is not verified');
      console.error('2. Use "onboarding@resend.dev" for testing');
      console.error('3. Or verify your domain at https://resend.com/domains');
    } else {
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
    console.error('');
    process.exit(1);
  });
