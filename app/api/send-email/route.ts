import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ============================================================================
// Email Configuration
// ============================================================================

// Priority: 1. Resend API  2. Gmail SMTP  3. Simulation
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'support@fotober.com';

// Gmail SMTP Config (fallback)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// ============================================================================
// Types
// ============================================================================

interface RevisionNotificationData {
  jobCode: string;
  fileName: string;
  fileUrl: string;
  comment: string;
  customerEmail?: string;
  salesEmail: string;
  timestamp: string;
}

// ============================================================================
// Email Template
// ============================================================================

const createEmailHtml = (data: RevisionNotificationData): string => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: #0099cc; padding: 20px 30px;">
      <h1 style="color: white; margin: 0; font-size: 22px; font-weight: normal;">Revision Requested</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="margin: 0 0 20px 0;">Hi,</p>
      
      <p style="margin: 0 0 20px 0;">
        Order ID <strong>${data.jobCode}</strong> has been requested to edit the output.<br>
        ${currentDate}
      </p>
      
      <p style="margin: 0 0 15px 0;">We've got your revision request with below information:</p>
      
      <p style="margin: 0 0 8px 0;"><strong>File Name:</strong> ${data.fileName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Order Code:</strong> ${data.jobCode}</p>
      <p style="margin: 0 0 8px 0;"><strong>Request Date:</strong> ${data.timestamp}</p>
      <p style="margin: 0 0 20px 0;"><strong>Revision Comment:</strong> ${data.comment}</p>
      
      <p style="margin: 0 0 8px 0;">
        <strong>Preview Link:</strong> <a href="${data.fileUrl}" style="color: #0099cc;">View File</a>
      </p>
      
      <p style="margin: 20px 0;">
        This revision request will be processed by our team. Thank you for allowing Fotober to serve you.
      </p>
      
      <p style="margin: 30px 0 5px 0;">Kind Regards,</p>
      <p style="margin: 0; font-weight: bold;">Fotober</p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9f9f9; padding: 15px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; color: #999; font-size: 12px;">2021 © By FOTOBER</p>
    </div>
    
  </div>
</body>
</html>
  `.trim();
};

const createTextContent = (data: RevisionNotificationData): string => {
  return `
Revision Requested

Hi,

Order ID ${data.jobCode} has been requested to edit the output.

File Name: ${data.fileName}
Order Code: ${data.jobCode}
Request Date: ${data.timestamp}
Revision Comment: ${data.comment}

Preview Link: ${data.fileUrl}

This revision request will be processed by our team. Thank you for allowing Fotober to serve you.

Kind Regards,
Fotober

---
2021 © By FOTOBER
  `.trim();
};

// ============================================================================
// Email Senders
// ============================================================================

async function sendViaResend(data: RevisionNotificationData): Promise<{ success: boolean; message: string; emailId?: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Fotober Preview <${FROM_EMAIL}>`,
      reply_to: 'support@fotober.com',
      to: data.salesEmail,
      subject: `Order ID ${data.jobCode} has been requested to edit the output.`,
      html: createEmailHtml(data),
      text: createTextContent(data),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Resend API error');
  }

  return { success: true, message: 'Email sent via Resend', emailId: result.id };
}

async function sendViaGmailSMTP(data: RevisionNotificationData): Promise<{ success: boolean; message: string }> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // SSL for port 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Fotober Vietnam" <${SMTP_USER}>`,
    replyTo: 'support@fotober.com',
    to: data.salesEmail,
    subject: `Order ID ${data.jobCode} has been requested to edit the output.`,
    text: createTextContent(data),
    html: createEmailHtml(data),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('[Email API] Gmail SMTP sent:', info.messageId);
  
  return { success: true, message: `Email sent via Gmail SMTP: ${info.messageId}` };
}

// ============================================================================
// API Route Handler
// ============================================================================

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

    // Try sending email with priority order
    let result: { success: boolean; message: string; emailId?: string };

    // Priority 1: Gmail SMTP
    // if (SMTP_USER && SMTP_PASS) {
    //   try {
    //     console.log('[Email API] Attempting Gmail SMTP...');
    //     result = await sendViaGmailSMTP(data);
    //     return NextResponse.json(result);
    //   } catch (err) {
    //     console.error('[Email API] Gmail SMTP failed:', err);
    //     return NextResponse.json(
    //       { error: `Email failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
    //       { status: 500 }
    //     );
    //   }
    // }
    // Priority 2: Resend API
    if (RESEND_API_KEY) {
      try {
        console.log('[Email API] Attempting Resend API...');
        result = await sendViaResend(data);
        return NextResponse.json(result);
      } catch (err) {
        console.error('[Email API] Resend failed:', err);
        // Fall through to Gmail SMTP
      }
    }


    // Priority 3: Simulation (no credentials configured)
    console.warn('[Email API] No email credentials configured, simulating...');
    console.log('[Email API] Would send email to:', data.salesEmail);
    console.log('[Email API] Subject: [Fotober] Revision:', data.jobCode, '-', data.fileName);
    console.log('[Email API] Comment:', data.comment);

    return NextResponse.json({
      success: true,
      message: 'Email simulated (no credentials configured)',
      debug: { 
        to: data.salesEmail, 
        subject: `Order ID ${data.jobCode} has been requested to edit the output.`,
        hint: 'Set RESEND_API_KEY or SMTP_USER/SMTP_PASS in .env'
      }
    });

  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
