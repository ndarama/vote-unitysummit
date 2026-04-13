import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { sendVoteOTPEmail } from '@/services/emailService';

/**
 * Test endpoint for sending OTP emails
 * Admin only - for testing email configuration
 */
export async function POST(request: NextRequest) {
  try {
    const role = await requireRole(['admin']);
    if (!role) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[Test Email] Sending test OTP email to:', email);

    // Send test OTP email
    const testCode = '123456';
    const testNomineeName = 'Test Nominee';
    const testCategoryTitle = 'Test Category';

    const emailSent = await sendVoteOTPEmail(
      email,
      testCode,
      testNomineeName,
      testCategoryTitle
    );

    if (emailSent) {
      console.log('[Test Email] Test email sent successfully');
      return Response.json({
        success: true,
        message: 'Test email sent successfully',
        sentTo: email,
        code: testCode,
      });
    } else {
      console.error('[Test Email] Failed to send test email');
      return Response.json({
        success: false,
        error: 'Failed to send email. Check server logs for details.',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Test Email] Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'An error occurred',
    }, { status: 500 });
  }
}
