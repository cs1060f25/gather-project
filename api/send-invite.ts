import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface InviteEmailData {
  to: string;
  eventTitle: string;
  hostName: string;
  hostEmail: string;
  suggestedTimes: Array<{ day: string; time: string; duration: number }>;
  inviteToken: string;
  location?: string;
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

  // Initialize Resend inside the handler to ensure env var is available
  const resend = new Resend(apiKey);

  try {
    const { to, eventTitle, hostName, hostEmail, suggestedTimes, inviteToken, location } = req.body as InviteEmailData;

    if (!to || !eventTitle || !hostName || !inviteToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format the suggested times for the email
    const formattedTimes = suggestedTimes.map((opt, idx) => {
      const date = new Date(opt.day);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const [hours, minutes] = opt.time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const durationText = opt.duration < 60 ? `${opt.duration}m` : `${opt.duration / 60}h`;
      return `<li style="margin-bottom: 8px;"><strong>Option ${idx + 1}:</strong> ${dayName}, ${monthDay} at ${displayHour}:${minutes} ${ampm} (${durationText})</li>`;
    }).join('');

    const baseUrl = process.env.SITE_URL || 'https://gatherly.now';
    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    // Use verified domain gatherly.now for sending emails
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gatherly <invites@gatherly.now>';

    // Generate unique message ID to prevent email threading
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      replyTo: hostEmail,
      subject: `${hostName} invited you to: ${eventTitle}`,
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
        <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 28px; margin: 0; color: #1a1a1a;">📅 Gatherly</h1>
        <p style="color: #666; margin-top: 5px;">You've been invited to an event!</p>
      </div>
      
      <!-- Event Details -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; margin: 0 0 10px 0; color: #1a1a1a;">${eventTitle}</h2>
        <p style="color: #666; margin: 0;">Organized by <strong>${hostName}</strong></p>
        ${location ? `<p style="color: #666; margin: 5px 0 0 0;">${location}</p>` : ''}
      </div>
      
      <!-- Suggested Times -->
      <div style="background: #f9f9f9; border: 2px solid #1a1a1a; padding: 20px; margin-bottom: 25px;">
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 16px; margin: 0 0 15px 0;">Suggested Times:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #333;">
          ${formattedTimes}
        </ul>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${inviteUrl}" 
           style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 15px 40px; font-weight: bold; font-size: 16px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0 #1a1a1a; transition: all 0.1s;">
          Respond to Invite
        </a>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding-top: 20px;">
        <p style="margin: 0;">This invite was sent via <a href="${baseUrl}" style="color: #22c55e;">Gatherly</a></p>
        <p style="margin: 5px 0 0 0;">If you didn't expect this email, you can safely ignore it.</p>
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
    console.error('Error sending invite:', errorMessage, error);
    return res.status(500).json({ 
      error: 'Failed to send invite email',
      message: errorMessage
    });
  }
}
