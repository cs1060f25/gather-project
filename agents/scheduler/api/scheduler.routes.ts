import express from 'express';
import { suggestSlots } from '../simple-scheduler.js';

export const schedulerRouter = express.Router();

schedulerRouter.post('/suggest', async (req, res) => {
  try {
    const { text, durationMinutes, hostId } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required and must be a string' });
    }

    let durationMinutesNumber: number | undefined;
    if (durationMinutes !== undefined) {
      const parsed = Number(durationMinutes);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res
          .status(400)
          .json({ error: 'durationMinutes, if provided, must be a positive number' });
      }
      durationMinutesNumber = parsed;
    }

    // For now, default to a demo host if none is provided. In a real system,
    // hostId should come from the authenticated user.
    const resolvedHostId = typeof hostId === 'string' && hostId.trim().length > 0
      ? hostId.trim()
      : 'single_host_demo';

    console.log('[/api/schedule/suggest] request text =', text, 'hostId =', resolvedHostId);

    const result = await suggestSlots({
      text,
      durationMinutes: durationMinutesNumber,
      hostId: resolvedHostId,
    });
    return res.json({
      ok: true,
      title: result.title,
      where: result.where,
      who: result.who,
      slots: result.slots,
    });
  } catch (err) {
    console.error('Scheduler error:', err);
    return res.status(500).json({ error: 'Failed to generate schedule' });
  }
});
