// Email Service using Resend API (free tier: 100 emails/day, 3000/month)
// Alternative: EmailJS, Nodemailer with Gmail SMTP
// This service is designed to work with Next.js API routes

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface RevisionNotificationData {
  jobCode: string;
  fileName: string;
  fileUrl: string;
  comment: string;
  customerEmail?: string;
  salesEmail?: string;
  supportEmail?: string;
  timestamp: string;
}

// Email template for revision request
export const createRevisionEmailHtml = (data: RevisionNotificationData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revision Request - ${data.jobCode}</title>
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
    <p style="color: #aaa; margin: 0; font-size: 12px;">This is an automated notification from Fotober Preview System</p>
  </div>
</body>
</html>
  `.trim();
};

// Send email via API route (to be called from client)
export const sendRevisionEmail = async (data: RevisionNotificationData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('[EmailService] Failed to send email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Batch send emails (for multiple revisions)
export const sendBatchRevisionEmails = async (
  dataList: RevisionNotificationData[]
): Promise<{ success: boolean; sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const data of dataList) {
    const result = await sendRevisionEmail(data);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success: failed === 0, sent, failed };
};
