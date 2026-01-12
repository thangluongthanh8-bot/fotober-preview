import { NextRequest, NextResponse } from 'next/server';

// Email configuration
// Using Resend API - Free tier: 100 emails/day, 3000/month
// Sign up at https://resend.com and get API key
// Set RESEND_API_KEY in .env.local

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@fotober.com';

interface RevisionNotificationData {
  jobCode: string;
  fileName: string;
  fileUrl: string;
  comment: string;
  customerEmail?: string;
  salesEmail: string;
  timestamp: string;
}

// Email template
const createEmailHtml = (data: RevisionNotificationData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0088cc 0%, #005fa3 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Revision Request</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Job Code: ${data.jobCode}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0088cc;">
      <h2 style="color: #0088cc; margin: 0 0 15px 0; font-size: 18px;">File Details</h2>
      <p style="margin: 5px 0;"><strong>File Name:</strong> ${data.fileName}</p>
      <p style="margin: 5px 0;"><strong>Preview Link:</strong> <a href="${data.fileUrl}" style="color: #0088cc;">View File</a></p>
      ${data.customerEmail ? `<p style="margin: 5px 0;"><strong>Customer:</strong> ${data.customerEmail}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Requested at:</strong> ${data.timestamp}</p>
    </div>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">💬 Customer Comment</h3>
      <p style="margin: 0; color: #856404; font-style: italic;">"${data.comment}"</p>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
      <a href="${data.fileUrl}" style="display: inline-block; background: #0088cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View File & Take Action</a>
    </div>
  </div>
  
  <div style="background: #333; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #aaa; margin: 0; font-size: 12px;">Fotober Preview System - Automated Notification</p>
  </div>
</body>
</html>
  `.trim();
};

export async function POST(request: NextRequest) {
  try {
    const data: RevisionNotificationData = await request.json();

    // Validate required fields
    if (!data.salesEmail || !data.comment || !data.fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: salesEmail, comment, fileName' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!RESEND_API_KEY) {
      console.warn('[Email API] RESEND_API_KEY not configured, simulating email send');
      // Simulate success for testing without API key
      console.log('[Email API] Would send email to:', data.salesEmail);
      console.log('[Email API] Subject: Revision Request -', data.jobCode, '-', data.fileName);
      console.log('[Email API] Comment:', data.comment);
      
      return NextResponse.json({
        success: true,
        message: 'Email simulated (no API key configured)',
        debug: { to: data.salesEmail, subject: `Revision Request - ${data.jobCode} - ${data.fileName}` }
      });
    }

    // Create plain text version for better deliverability
    const textContent = `
Revision Request - ${data.jobCode}

File Details:
- File Name: ${data.fileName}
- Preview Link: ${data.fileUrl}
- Requested at: ${data.timestamp}

Customer Comment:
"${data.comment}"

---
Fotober Preview System - Automated Notification
    `.trim();

    // Send email via Resend with improved headers
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Fotober Preview <${FROM_EMAIL}>`,
        reply_to: FROM_EMAIL,
        to: data.salesEmail,
        subject: `[Fotober] Revision: ${data.fileName} - Job ${data.jobCode}`,
        html: createEmailHtml(data),
        text: textContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('[Email API] Resend error:', emailResult);
      return NextResponse.json(
        { error: emailResult.message || 'Failed to send email' },
        { status: emailResponse.status }
      );
    }

    console.log('[Email API] Email sent successfully:', emailResult.id);
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailResult.id
    });

  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
