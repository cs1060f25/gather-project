import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

interface ReminderEmailData {
  to: string;
  eventTitle: string;
  hostName: string;
  hostEmail: string;
  reminderType: 'pending' | 'scheduled';
  inviteToken?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
}

// Initialize Supabase client for server-side
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

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
    // Check if we received eventId (bulk reminder) or individual data
    const { eventId, ...individualData } = req.body;

    if (eventId) {
      // Bulk reminder: look up event and all pending invites
      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Database not configured' });
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get event details
      const { data: event, error: eventError } = await supabase
        .from('gatherly_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError || !event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      // Get all pending invites for this event
      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'pending');
      
      if (invitesError) {
        return res.status(500).json({ error: 'Failed to fetch invites' });
      }
      
      if (!invites || invites.length === 0) {
        return res.status(200).json({ success: true, message: 'No pending invites to remind' });
      }

      // Get host info - use user_id which is the actual column in gatherly_events
      const { data: hostProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', event.user_id)
        .single();
      
      const hostName = hostProfile?.full_name || event.host_name || event.title;
      const hostEmail = hostProfile?.email || event.host_email || '';
      
      const baseUrl = process.env.SITE_URL || 'https://gatherly.now';
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gatherly <reminders@gatherly.now>';
      
      // Send reminder to each pending invitee
      const results = [];
      for (const invite of invites) {
        const inviteUrl = `${baseUrl}/invite/${invite.token}`;
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const subject = `Quick nudge from ${hostName} about ${event.title}`;
        const htmlContent = generatePendingReminderHtml({
          eventTitle: event.title,
          hostName,
          inviteUrl,
          location: event.location,
          baseUrl
        });

        try {
          const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [invite.invitee_email],
            replyTo: hostEmail,
            subject,
            headers: {
              'X-Entity-Ref-ID': uniqueId,
              'Message-ID': `<${uniqueId}@gatherly.now>`,
            },
            html: htmlContent
          });

          results.push({
            email: invite.invitee_email,
            success: !error,
            id: data?.id,
            error: error?.message
          });
        } catch (err) {
          results.push({
            email: invite.invitee_email,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      return res.status(200).json({ 
        success: true, 
        sent: successCount,
        total: invites.length,
        results 
      });
    }

    // Individual reminder (legacy support)
    const { 
      to, 
      eventTitle, 
      hostName, 
      hostEmail, 
      reminderType, 
      inviteToken,
      scheduledDate,
      scheduledTime,
      location 
    } = individualData as ReminderEmailData;

    if (!to || !eventTitle || !hostName || !reminderType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const baseUrl = process.env.SITE_URL || 'https://gatherly.now';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gatherly <reminders@gatherly.now>';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let subject: string;
    let htmlContent: string;

    if (reminderType === 'pending') {
      const inviteUrl = `${baseUrl}/invite/${inviteToken}`;
      subject = `Quick nudge from ${hostName} about ${eventTitle}`;
      htmlContent = generatePendingReminderHtml({
        eventTitle,
        hostName,
        inviteUrl,
        location,
        baseUrl
      });
    } else {
      // Reminder for scheduled event
      const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) : 'TBD';
      
      const formattedTime = scheduledTime ? (() => {
        const [hours, minutes] = scheduledTime.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      })() : 'TBD';

      subject = `See you soon! ${eventTitle} is coming up`;
      htmlContent = generateScheduledReminderHtml({
        eventTitle,
        hostName,
        formattedDate,
        formattedTime,
        location,
        baseUrl
      });
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      replyTo: hostEmail,
      subject,
      headers: {
        'X-Entity-Ref-ID': uniqueId,
        'Message-ID': `<${uniqueId}@gatherly.now>`,
      },
      html: htmlContent
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Failed to send reminder email', 
        details: error
      });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending reminder:', errorMessage, error);
    return res.status(500).json({ 
      error: 'Failed to send reminder email',
      message: errorMessage
    });
  }
}

// Helper function to generate pending reminder HTML
function generatePendingReminderHtml(params: {
  eventTitle: string;
  hostName: string;
  inviteUrl: string;
  location?: string;
  baseUrl: string;
}): string {
  const { eventTitle, hostName, inviteUrl, location, baseUrl } = params;
  return `
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
      
      <!-- Friendly Message -->
      <div style="margin-bottom: 25px;">
        <p style="font-size: 18px; color: #333; margin: 0 0 15px 0; line-height: 1.5;">
          Hey! Just a friendly reminder that <strong>${hostName}</strong> is still waiting to hear from you.
        </p>
        <div style="background: #fafafa; border-left: 4px solid #22c55e; padding: 15px 20px; margin-bottom: 15px;">
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin: 0 0 8px 0; color: #1a1a1a;">${eventTitle}</h2>
          ${location ? `<p style="color: #666; margin: 0; font-size: 14px;">${location}</p>` : ''}
        </div>
        <p style="color: #666; margin: 0; font-size: 15px;">
          Let them know which times work for you so they can lock in a date!
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${inviteUrl}" 
           style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 16px 48px; font-weight: bold; font-size: 16px; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0 #1a1a1a;">
          Share Your Availability
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 12px;">Only takes a moment</p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding-top: 20px;">
        <p style="margin: 0;">Sent with <a href="${baseUrl}" style="color: #22c55e; text-decoration: none;">Gatherly</a></p>
      </div>
      
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function to generate scheduled reminder HTML
function generateScheduledReminderHtml(params: {
  eventTitle: string;
  hostName: string;
  formattedDate: string;
  formattedTime: string;
  location?: string;
  baseUrl: string;
}): string {
  const { eventTitle, hostName, formattedDate, formattedTime, location, baseUrl } = params;
  return `
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
      
      <!-- Friendly Message -->
      <div style="margin-bottom: 25px;">
        <p style="font-size: 18px; color: #333; margin: 0 0 15px 0; line-height: 1.5;">
          Just a heads up - you have an event coming up with <strong>${hostName}</strong>!
        </p>
        <div style="background: #fafafa; border-left: 4px solid #22c55e; padding: 15px 20px;">
          <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin: 0 0 15px 0; color: #1a1a1a;">${eventTitle}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #666; width: 80px; vertical-align: top;">When</td>
              <td style="padding: 6px 0; color: #333; font-weight: 500;">${formattedDate} at ${formattedTime}</td>
            </tr>
            ${location ? `
            <tr>
              <td style="padding: 6px 0; color: #666; vertical-align: top;">Where</td>
              <td style="padding: 6px 0; color: #333; font-weight: 500;">${location}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>
      
      <!-- Friendly Note -->
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="color: #666; font-size: 15px; margin: 0;">Looking forward to seeing you there!</p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; color: #999; font-size: 12px; border-top: 2px solid #eee; padding-top: 20px;">
        <p style="margin: 0;">Sent with <a href="${baseUrl}" style="color: #22c55e; text-decoration: none;">Gatherly</a></p>
      </div>
      
    </div>
  </div>
</body>
</html>
  `;
}
