import express from 'express';
import { createHostEvent } from '../calendar.js';

export const calendarRouter = express.Router();

calendarRouter.post('/invite', async (req, res) => {
  try {
    const { slot, title, durationMinutes, inviteeEmails, location, description } = req.body;

    if (!slot || !title || !durationMinutes) {
      return res
        .status(400)
        .json({ error: 'slot, title, and durationMinutes are required' });
    }

    const result = await createHostEvent({
      hostId: 'single_host_demo',
      slot,
      title,
      durationMinutes,
      timeZone: 'America/New_York',
      inviteeEmails: inviteeEmails ?? [],
      location: location ?? null,
      description,
    });

    return res.json(result);
  } catch (err) {
    console.error('Calendar invite error:', err);
    return res.status(500).json({ error: 'Failed to create calendar invite' });
  }
});
