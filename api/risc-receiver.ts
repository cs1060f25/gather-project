import type { VercelRequest, VercelResponse } from '@vercel/node';

// RISC (Cross-Account Protection) Event Receiver
// Handles security event tokens from Google

interface RISCEvent {
  iss: string;
  aud: string;
  iat: number;
  jti: string;
  events: Record<string, {
    subject: {
      subject_type: string;
      iss: string;
      sub: string;
      email?: string;
    };
    reason?: string;
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.body;
    
    // In production, you should validate the JWT signature using Google's public keys
    // from https://www.googleapis.com/oauth2/v3/certs
    // For now, we'll decode and log the event
    
    if (typeof token === 'string') {
      // JWT token - decode the payload (middle part)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as RISCEvent;
        
        // Validate issuer
        if (payload.iss !== 'https://accounts.google.com/' && payload.iss !== 'accounts.google.com') {
          console.error('Invalid issuer:', payload.iss);
          return res.status(400).json({ error: 'Invalid issuer' });
        }

        // Process the security events
        const events = payload.events;
        for (const [eventType, eventData] of Object.entries(events)) {
          const userSub = eventData.subject?.sub;
          const userEmail = eventData.subject?.email;
          
          console.log(`RISC Event received: ${eventType}`);
          console.log(`User: ${userEmail || userSub}`);
          console.log(`Reason: ${eventData.reason || 'N/A'}`);

          // Handle different event types
          switch (eventType) {
            case 'https://schemas.openid.net/secevent/risc/event-type/sessions-revoked':
              // User's Google sessions were revoked - end their Gatherly sessions
              console.log('Action: Should revoke user sessions');
              // TODO: Implement session revocation in Supabase
              break;

            case 'https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked':
              // OAuth tokens were revoked - clear stored tokens
              console.log('Action: Should clear stored OAuth tokens');
              // TODO: Clear tokens from localStorage guidance
              break;

            case 'https://schemas.openid.net/secevent/risc/event-type/account-disabled':
              // User's Google account was disabled (possibly hijacked)
              console.log('Action: Should disable Google Sign-in for user');
              if (eventData.reason === 'hijacking') {
                console.log('SECURITY ALERT: Account may have been hijacked');
              }
              // TODO: Flag user account for review
              break;

            case 'https://schemas.openid.net/secevent/risc/event-type/account-enabled':
              // User's Google account was re-enabled
              console.log('Action: Can re-enable Google Sign-in for user');
              break;

            case 'https://schemas.openid.net/secevent/risc/event-type/account-credential-change-required':
              // User should update their credentials
              console.log('Action: Should prompt user to review security');
              break;

            case 'https://schemas.openid.net/secevent/risc/event-type/verification':
              // Test verification event
              console.log('Verification event received - RISC is working!');
              break;

            default:
              console.log('Unknown event type:', eventType);
          }
        }

        // Return 202 Accepted as per RISC spec
        return res.status(202).json({ received: true, jti: payload.jti });
      }
    }

    // If we received JSON directly (for testing)
    if (typeof token === 'object' && token !== null) {
      console.log('RISC event (JSON):', JSON.stringify(token, null, 2));
      return res.status(202).json({ received: true });
    }

    return res.status(400).json({ error: 'Invalid token format' });
  } catch (error) {
    console.error('RISC receiver error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
