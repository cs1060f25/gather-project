-- Gatherly Invites Table
-- Run this in your Supabase SQL Editor

-- Create the invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_location TEXT,
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')),
  suggested_times TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  -- Create index for faster lookups
  CONSTRAINT invites_token_unique UNIQUE (token)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_event_id ON invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_host_email ON invites(host_email);
CREATE INDEX IF NOT EXISTS idx_invites_invitee_email ON invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- Enable Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read invites by token (for response page)
CREATE POLICY "Anyone can read invites by token" ON invites
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert invites
CREATE POLICY "Authenticated users can create invites" ON invites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Anyone can update invite status (for responding)
CREATE POLICY "Anyone can update invite response" ON invites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Hosts can delete their invites
CREATE POLICY "Hosts can delete their invites" ON invites
  FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = host_email);

-- Create contacts table if not exists
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_gatherly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT contacts_user_email_unique UNIQUE (user_id, email)
);

-- Create index for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own contacts
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own contacts
CREATE POLICY "Users can create their own contacts" ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own contacts
CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own contacts
CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create gatherly_events table for storing created events
CREATE TABLE IF NOT EXISTS gatherly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  options JSONB NOT NULL DEFAULT '[]',
  participants TEXT[] DEFAULT '{}',
  confirmed_option JSONB,
  responses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for gatherly_events
CREATE INDEX IF NOT EXISTS idx_gatherly_events_user_id ON gatherly_events(user_id);
CREATE INDEX IF NOT EXISTS idx_gatherly_events_status ON gatherly_events(status);

-- Enable RLS on gatherly_events
ALTER TABLE gatherly_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY "Users can view their own events" ON gatherly_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own events
CREATE POLICY "Users can create their own events" ON gatherly_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own events" ON gatherly_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete their own events" ON gatherly_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

