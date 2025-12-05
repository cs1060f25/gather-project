// Invite system for Gatherly
import { supabase } from './supabase';

export interface Invite {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_time?: string;
  event_location?: string;
  host_name: string;
  host_email: string;
  invitee_email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
  created_at: string;
  responded_at?: string;
  suggested_times?: string[]; // Times the invitee suggested
}

export interface InviteResponse {
  success: boolean;
  message: string;
  invite?: Invite;
}

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create invites for an event
export async function createInvites(
  eventId: string,
  eventData: {
    title: string;
    date: string;
    time?: string;
    location?: string;
  },
  hostName: string,
  hostEmail: string,
  inviteeEmails: string[]
): Promise<{ invites: Invite[]; errors: string[] }> {
  const invites: Invite[] = [];
  const errors: string[] = [];

  for (const email of inviteeEmails) {
    const token = generateToken();
    const invite: Omit<Invite, 'id'> = {
      event_id: eventId,
      event_title: eventData.title,
      event_date: eventData.date,
      event_time: eventData.time,
      event_location: eventData.location,
      host_name: hostName,
      host_email: hostEmail,
      invitee_email: email.toLowerCase().trim(),
      token,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('invites')
        .insert(invite)
        .select()
        .single();

      if (error) {
        console.error('Error creating invite:', error);
        errors.push(`Failed to create invite for ${email}: ${error.message}`);
      } else if (data) {
        invites.push(data as Invite);
      }
    } catch (err) {
      console.error('Error creating invite:', err);
      errors.push(`Failed to create invite for ${email}`);
    }
  }

  return { invites, errors };
}

// Get invite by token (for response page)
export async function getInviteByToken(token: string): Promise<Invite | null> {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error fetching invite:', error);
      return null;
    }

    return data as Invite;
  } catch (err) {
    console.error('Error fetching invite:', err);
    return null;
  }
}

// Respond to an invite
export async function respondToInvite(
  token: string,
  status: 'accepted' | 'declined' | 'maybe',
  suggestedTimes?: string[]
): Promise<InviteResponse> {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({
        status,
        responded_at: new Date().toISOString(),
        suggested_times: suggestedTimes,
      })
      .eq('token', token)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: status === 'accepted' 
        ? "You're in! See you there." 
        : status === 'declined'
        ? "No worries, maybe next time!"
        : "Got it, we'll keep you posted.",
      invite: data as Invite,
    };
  } catch (err) {
    return { success: false, message: 'Failed to respond to invite' };
  }
}

// Get all invites for an event
export async function getEventInvites(eventId: string): Promise<Invite[]> {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching invites:', error);
      return [];
    }

    return data as Invite[];
  } catch (err) {
    console.error('Error fetching invites:', err);
    return [];
  }
}

// Get pending invites for a user (as host)
export async function getHostPendingInvites(hostEmail: string): Promise<Invite[]> {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('host_email', hostEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      return [];
    }

    return data as Invite[];
  } catch (err) {
    console.error('Error fetching pending invites:', err);
    return [];
  }
}

// Send invite emails using Resend API
export async function sendInviteEmails(invites: Invite[]): Promise<{ sent: number; failed: number }> {
  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not configured. Emails will not be sent.');
    // For demo purposes, log the invite links
    invites.forEach(invite => {
      const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
      console.log(`Invite link for ${invite.invitee_email}: ${inviteUrl}`);
    });
    return { sent: 0, failed: invites.length };
  }

  let sent = 0;
  let failed = 0;

  for (const invite of invites) {
    const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
    const eventDate = new Date(invite.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Gatherly <invites@gatherly.now>',
          to: invite.invitee_email,
          subject: `${invite.host_name} invited you: ${invite.event_title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: #fff; }
                .header { background: #000; color: #fff; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
                .content { padding: 32px 24px; }
                .event-card { background: #fafafa; border: 3px solid #000; padding: 20px; margin: 20px 0; }
                .event-title { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
                .event-detail { color: #666; margin: 8px 0; }
                .buttons { margin: 24px 0; }
                .btn { display: inline-block; padding: 14px 28px; text-decoration: none; font-weight: 700; border: 3px solid #000; margin: 8px 8px 8px 0; }
                .btn-yes { background: #22c55e; color: #fff; }
                .btn-no { background: #fff; color: #000; }
                .btn-maybe { background: #fbbf24; color: #000; }
                .footer { padding: 20px 24px; text-align: center; color: #888; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 Gatherly</h1>
                </div>
                <div class="content">
                  <p>Hey there!</p>
                  <p><strong>${invite.host_name}</strong> has invited you to:</p>
                  
                  <div class="event-card">
                    <div class="event-title">${invite.event_title}</div>
                    <div class="event-detail">📅 ${eventDate}</div>
                    ${invite.event_time ? `<div class="event-detail">🕐 ${invite.event_time}</div>` : ''}
                    ${invite.event_location ? `<div class="event-detail">📍 ${invite.event_location}</div>` : ''}
                  </div>
                  
                  <p>Can you make it?</p>
                  
                  <div class="buttons">
                    <a href="${inviteUrl}?response=accepted" class="btn btn-yes">Yes, I'm in!</a>
                    <a href="${inviteUrl}?response=maybe" class="btn btn-maybe">Maybe</a>
                    <a href="${inviteUrl}?response=declined" class="btn btn-no">Can't make it</a>
                  </div>
                  
                  <p style="color: #888; font-size: 14px;">
                    Or click here to respond: <a href="${inviteUrl}">${inviteUrl}</a>
                  </p>
                </div>
                <div class="footer">
                  Sent via Gatherly • Schedule faster together
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      });

      if (response.ok) {
        sent++;
        console.log(`Email sent to ${invite.invitee_email}`);
      } else {
        failed++;
        console.error(`Failed to send email to ${invite.invitee_email}`);
      }
    } catch (err) {
      failed++;
      console.error(`Error sending email to ${invite.invitee_email}:`, err);
    }
  }

  return { sent, failed };
}

// Get invite stats for an event
export function getInviteStats(invites: Invite[]): {
  total: number;
  accepted: number;
  declined: number;
  maybe: number;
  pending: number;
} {
  return {
    total: invites.length,
    accepted: invites.filter(i => i.status === 'accepted').length,
    declined: invites.filter(i => i.status === 'declined').length,
    maybe: invites.filter(i => i.status === 'maybe').length,
    pending: invites.filter(i => i.status === 'pending').length,
  };
}

