-- Cleanup migration: Remove unused phone fields
-- Run this in your Supabase SQL Editor

-- Remove phone column from profiles table if it exists
-- (Phone was removed from signup flow)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles DROP COLUMN phone;
    RAISE NOTICE 'Dropped phone column from profiles table';
  ELSE
    RAISE NOTICE 'Phone column does not exist in profiles table - skipping';
  END IF;
END $$;

-- Note: We keep the phone column in 'contacts' table as users may want to 
-- store phone numbers for their contacts manually

-- Add addGoogleMeet column to gatherly_events if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gatherly_events' AND column_name = 'add_google_meet') THEN
    ALTER TABLE gatherly_events ADD COLUMN add_google_meet BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added add_google_meet column to gatherly_events table';
  ELSE
    RAISE NOTICE 'add_google_meet column already exists in gatherly_events table - skipping';
  END IF;
END $$;
