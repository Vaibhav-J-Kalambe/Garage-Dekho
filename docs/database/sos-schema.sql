-- ============================================================
-- GarageDekho SOS Feature - Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. SOS Requests table
CREATE TABLE IF NOT EXISTS sos_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_type    TEXT NOT NULL,
  user_lat      DECIMAL(10, 8) NOT NULL,
  user_lng      DECIMAL(11, 8) NOT NULL,
  user_address  TEXT,
  status        TEXT DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'arrived', 'verified', 'cancelled')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SOS Assignments table (mechanic who accepted)
CREATE TABLE IF NOT EXISTS sos_assignments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id      UUID REFERENCES sos_requests(id) ON DELETE CASCADE NOT NULL,
  garage_id       TEXT,                   -- optional, links to garages table
  garage_name     TEXT NOT NULL,
  mechanic_name   TEXT NOT NULL,
  mechanic_phone  TEXT,
  mechanic_lat    DECIMAL(10, 8),         -- live-updated location
  mechanic_lng    DECIMAL(11, 8),
  otp             TEXT,                   -- 4-digit OTP shown to user on arrival
  otp_verified    BOOLEAN DEFAULT FALSE,
  eta_minutes     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sos_requests_updated_at
  BEFORE UPDATE ON sos_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sos_assignments_updated_at
  BEFORE UPDATE ON sos_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security
ALTER TABLE sos_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_assignments ENABLE ROW LEVEL SECURITY;

-- Users can insert their own SOS requests
CREATE POLICY "Users can insert own sos_requests"
  ON sos_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can read their own SOS requests
CREATE POLICY "Users can read own sos_requests"
  ON sos_requests FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role (API routes) can do everything - handled via service role key
-- Mechanic page reads sos_requests publicly (by requestId link - security by obscurity for MVP)
CREATE POLICY "Public can read sos_requests by id"
  ON sos_requests FOR SELECT
  USING (true);

-- sos_assignments are readable by anyone with the request id (mechanic link)
CREATE POLICY "Public can read sos_assignments"
  ON sos_assignments FOR SELECT
  USING (true);

-- 5. Enable Realtime on both tables
-- Go to Supabase Dashboard → Database → Replication → enable for:
--   sos_requests
--   sos_assignments
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE sos_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_assignments;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sos_requests_status     ON sos_requests (status);
CREATE INDEX IF NOT EXISTS idx_sos_requests_user_id    ON sos_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_sos_assignments_request ON sos_assignments (request_id);
