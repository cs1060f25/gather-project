-- Add google_event_id column to gatherly_events table
-- This stores the Google Calendar event ID so we can delete it when cancelling

ALTER TABLE gatherly_events 
ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gatherly_events_google_event_id 
ON gatherly_events(google_event_id);
