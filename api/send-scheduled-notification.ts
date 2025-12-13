import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

interface ScheduledNotificationData {
  to: string;
  eventTitle: string;
  hostName: string;
  hostEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location?: string;
  meetLink?: string;
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
    const { 
      to, 
      eventTitle, 
      hostName, 
      hostEmail, 
      scheduledDate, 
      scheduledTime,
      duration,
      location,
      meetLink
    } = req.body as ScheduledNotificationData;

    if (!to || !eventTitle || !hostName || !scheduledDate || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format date and time nicely
    const eventDate = new Date(`${scheduledDate}T${scheduledTime}`);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Calculate end time
    const endDate = new Date(eventDate.getTime() + (duration || 60) * 60000);
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const baseUrl = process.env.SITE_URL || 'https://gatherly.now';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gatherly <invites@gatherly.now>';

    // Generate unique message ID to prevent email threading
    const uniqueId = `scheduled-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const locationHtml = location 
      ? `<tr>
          <td style="padding: 8px 0; color: #666; width: 80px; vertical-align: top;">Where</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${location}</td>
        </tr>`
      : '';

    const meetLinkHtml = meetLink
      ? `<div style="text-align: center; margin: 20px 0;">
          <a href="${meetLink}" 
             style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 14px 32px; font-weight: bold; font-size: 14px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0 #1a1a1a;">
            🎥 Join Google Meet
          </a>
        </div>`
      : '';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      replyTo: hostEmail,
      subject: `✅ ${eventTitle} is confirmed!`,
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
      
      <!-- Header with Logo -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px;">
        <div style="display: inline-block; margin-bottom: 10px;">
          <svg width="40" height="40" viewBox="-2 -2 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M13 6V12L17 14" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" stroke-width="2"/>
            <path d="M6 14V18" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 16H8" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin: 0; color: #1a1a1a;">Gatherly</h1>
      </div>
      
      <!-- Confirmation Badge -->
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; margin-bottom: 15px; line-height: 64px;">
          <span style="font-size: 32px;">✅</span>
        </div>
        <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; margin: 0 0 10px 0; color: #1a1a1a;">It's Official!</h2>
        <p style="color: #666; margin: 0; font-size: 15px;"><strong>${hostName}</strong> has scheduled your event.</p>
      </div>
      
      <!-- Event Details Card -->
      <div style="background: #f9f9f9; border: 2px solid #1a1a1a; padding: 20px; margin-bottom: 20px;">
        <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a; border-bottom: 1px solid #ddd; padding-bottom: 10px;">${eventTitle}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 80px; vertical-align: top;">When</td>
            <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${formattedDate}<br>${formattedTime} - ${formattedEndTime}</td>
          </tr>
          ${locationHtml}
        </table>
      </div>
      
      ${meetLinkHtml}
      
      <!-- Add to Calendar prompt -->
      <div style="text-align: center; margin: 20px 0; padding: 15px; background: #f0fdf4; border: 2px solid #22c55e;">
        <p style="margin: 0; color: #166534; font-size: 14px;">
          📆 <strong>Check your Google Calendar</strong> - you should have received an invite!
        </p>
      </div>
      
      <!-- Contact Info -->
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="color: #666; font-size: 13px; margin: 0;">
          Questions? Contact ${hostName} at 
          <a href="mailto:${hostEmail}" style="color: #22c55e; text-decoration: none;">${hostEmail}</a>
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding-top: 20px;">
        <p style="margin: 0;">Scheduled with <a href="${baseUrl}" style="color: #22c55e; text-decoration: none;">Gatherly</a> • Schedule faster together</p>
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
    console.error('Error sending scheduled notification:', errorMessage, error);
    return res.status(500).json({ 
      error: 'Failed to send scheduled email',
      message: errorMessage
    });
  }
}

