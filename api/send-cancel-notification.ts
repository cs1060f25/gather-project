import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface CancelNotificationData {
  to: string;
  eventTitle: string;
  hostName: string;
  hostEmail: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured in environment');
    return res.status(500).json({ error: 'Email service not configured - missing RESEND_API_KEY' });
  }

  const resend = new Resend(apiKey);

  try {
    const { to, eventTitle, hostName, hostEmail } = req.body as CancelNotificationData;

    if (!to || !eventTitle || !hostName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const baseUrl = process.env.SITE_URL || 'https://gatherly.now';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gatherly <invites@gatherly.now>';

    // Generate unique message ID to prevent email threading
    const uniqueId = `cancel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      replyTo: hostEmail,
      subject: `Event Cancelled: ${eventTitle}`,
      headers: {
        'X-Entity-Ref-ID': uniqueId,
        'Message-ID': `<${uniqueId}@gatherly.now>`,
      },
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border: 3px solid #1a1a1a; box-shadow: 8px 8px 0 #1a1a1a; padding: 30px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px;">
        <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 28px; margin: 0; color: #1a1a1a;">Gatherly</h1>
      </div>
      
      <!-- Cancellation Notice -->
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: #fee2e2; border-radius: 50%; margin-bottom: 15px; line-height: 64px; font-size: 24px; color: #dc2626; font-weight: bold;">
          X
        </div>
        <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin: 0 0 10px 0; color: #dc2626;">Event Cancelled</h2>
        <p style="color: #666; margin: 0;">The following event has been cancelled by the organizer.</p>
      </div>
      
      <!-- Event Details -->
      <div style="background: #f9f9f9; border: 2px solid #1a1a1a; padding: 20px; margin-bottom: 25px;">
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 18px; margin: 0 0 10px 0; color: #1a1a1a;">${eventTitle}</h3>
        <p style="color: #666; margin: 0;">Organized by <strong>${hostName}</strong></p>
      </div>
      
      <!-- Message -->
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact the organizer directly at 
          <a href="mailto:${hostEmail}" style="color: #22c55e;">${hostEmail}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding-top: 20px;">
        <p style="margin: 0;">This notification was sent via <a href="${baseUrl}" style="color: #22c55e;">Gatherly</a></p>
      </div>
      
    </div>
  </div>
</body>
</html>
      `
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Failed to send email', 
        details: error,
        message: error.message || 'Unknown Resend error'
      });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending cancellation notification:', errorMessage, error);
    return res.status(500).json({ 
      error: 'Failed to send cancellation email',
      message: errorMessage
    });
  }
}
