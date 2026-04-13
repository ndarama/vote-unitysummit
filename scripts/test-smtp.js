/**
 * SMTP Configuration Test Script
 * Run this to verify your Gmail SMTP settings work correctly
 * 
 * Usage: node scripts/test-smtp.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('='.repeat(60));
console.log('SMTP CONFIGURATION TEST');
console.log('='.repeat(60));
console.log('');

// Display configuration (hide password)
console.log('Configuration:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || '❌ NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  SMTP_FROM:', process.env.SMTP_FROM || '❌ NOT SET');
console.log('');

// Verify required variables
const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Create transporter
console.log('Creating SMTP transporter...');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

console.log('');
console.log('Testing SMTP connection...');
console.log('');

// Test connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP CONNECTION FAILED');
    console.error('');
    console.error('Error details:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Command:', error.command);
    console.error('');
    console.error('Common solutions:');
    console.error('  1. Enable "Less secure app access" in Gmail settings');
    console.error('     https://myaccount.google.com/lesssecureapps');
    console.error('');
    console.error('  2. OR use an App Password (more secure):');
    console.error('     https://myaccount.google.com/apppasswords');
    console.error('');
    console.error('  3. Check for "Critical security alert" emails from Google');
    console.error('     and approve the sign-in attempt');
    console.error('');
    process.exit(1);
  } else {
    console.log('✅ SMTP CONNECTION SUCCESSFUL!');
    console.log('');
    console.log('Sending test email...');
    console.log('');

    // Send test email
    const testEmail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Unity Awards - SMTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">✅ SMTP Configuration Test Successful!</h2>
          <p>Your SMTP settings are working correctly.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Configuration:</strong><br>
            Host: ${process.env.SMTP_HOST}<br>
            Port: ${process.env.SMTP_PORT}<br>
            User: ${process.env.SMTP_USER}<br>
            From: ${process.env.SMTP_FROM}<br>
          </div>
          <p>You can now use this configuration for sending OTP emails in the Unity Awards voting system.</p>
          <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
            This is an automated test email from Unity Awards.
          </p>
        </div>
      `,
    };

    transporter.sendMail(testEmail, (error, info) => {
      if (error) {
        console.error('❌ FAILED TO SEND TEST EMAIL');
        console.error('');
        console.error('Error:', error.message);
        console.error('');
        process.exit(1);
      } else {
        console.log('✅ TEST EMAIL SENT SUCCESSFULLY!');
        console.log('');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('');
        console.log('Check your inbox:', process.env.SMTP_USER);
        console.log('');
        console.log('='.repeat(60));
        console.log('SMTP configuration is ready for production use!');
        console.log('='.repeat(60));
        process.exit(0);
      }
    });
  }
});
