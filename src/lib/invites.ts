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
  suggested_times?: string[]; // Times the invitee suggested (yes or maybe)
  option_responses?: Record<string, 'yes' | 'maybe' | 'no'>; // Per-option responses
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

// Create a notification for a user
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message?: string,
  eventId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        event_id: eventId,
        read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error creating notification:', err);
    return false;
  }
}

// Delete a single notification
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
    console.log('Notification deleted successfully:', notificationId);
    return true;
  } catch (err) {
    console.error('Error deleting notification:', err);
    return false;
  }
}

// Delete all notifications for a user
export async function deleteAllNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
    console.log('All notifications deleted for user:', userId);
    return true;
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    return false;
  }
}

// Respond to an invite
export async function respondToInvite(
  token: string,
  status: 'accepted' | 'declined' | 'maybe',
  suggestedTimes?: string[],
  optionResponses?: Record<string, 'yes' | 'maybe' | 'no'>
): Promise<InviteResponse> {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({
        status,
        responded_at: new Date().toISOString(),
        suggested_times: suggestedTimes,
        option_responses: optionResponses,
      })
      .eq('token', token)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    const invite = data as Invite;
    
    // Create notification for the event host
    // First try to get the organizer from the gatherly_events table (more reliable)
    if (invite.event_id) {
      const { data: eventData } = await supabase
        .from('gatherly_events')
        .select('user_id')
        .eq('id', invite.event_id)
        .single();
      
      if (eventData?.user_id) {
        const statusText = status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'responded with maybe to';
        const inviteeName = invite.invitee_email.split('@')[0];
        await createNotification(
          eventData.user_id,
          'invitee_response',
          `${inviteeName} ${statusText} your invite`,
          `Response for "${invite.event_title}"`,
          invite.event_id
        );
      }
    }

    return {
      success: true,
      message: status === 'accepted' 
        ? "You're in! See you there." 
        : status === 'declined'
        ? "No worries, maybe next time!"
        : "Got it, we'll keep you posted.",
      invite,
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

// Send invite emails using our secure server-side API
// The API key is stored on the server, not exposed to the frontend
export async function sendInviteEmails(
  invites: Invite[],
  suggestedTimes?: Array<{ day: string; time: string; duration: number }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const invite of invites) {
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: invite.invitee_email,
          eventTitle: invite.event_title,
          hostName: invite.host_name,
          hostEmail: invite.host_email,
          suggestedTimes: suggestedTimes || [{
            day: invite.event_date,
            time: invite.event_time || '09:00',
            duration: 60
          }],
          inviteToken: invite.token,
          location: invite.event_location,
        }),
      });

      if (response.ok) {
        sent++;
        console.log(`Email sent to ${invite.invitee_email}`);
      } else {
        failed++;
        const error = await response.json().catch(() => ({}));
        console.error(`Failed to send email to ${invite.invitee_email}:`, error);
      }
    } catch (err) {
      failed++;
      console.error(`Error sending email to ${invite.invitee_email}:`, err);
    }
  }

  // Log invite links for debugging (in case email fails)
  if (failed > 0) {
    invites.forEach(invite => {
      const inviteUrl = `${window.location.origin}/invite/${invite.token}`;
      console.log(`Invite link for ${invite.invitee_email}: ${inviteUrl}`);
    });
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

