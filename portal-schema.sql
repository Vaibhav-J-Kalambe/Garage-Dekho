-- ============================================================
-- GarageDekho — Garage Management Portal Schema
-- Run in Supabase SQL Editor one query at a time
-- ============================================================

-- Query 1: portal_garages table
CREATE TABLE portal_garages (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  garage_name   TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  city          TEXT DEFAULT 'Pune',
  state         TEXT DEFAULT 'Maharashtra',
  lat           DECIMAL(10, 8),
  lng           DECIMAL(11, 8),
  working_hours JSONB DEFAULT '{"open": "09:00", "close": "21:00", "closed_days": ["Sunday"]}',
  services      TEXT[] DEFAULT ARRAY['General Repair'],
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Query 2: portal_mechanics table
CREATE TABLE portal_mechanics (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_garage_id UUID REFERENCES portal_garages(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  specialization  TEXT DEFAULT 'General',
  status          TEXT DEFAULT 'available'
                  CHECK (status IN ('available', 'busy', 'offline')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Query 3: updated_at trigger for portal_garages
CREATE TRIGGER portal_garages_updated_at
  BEFORE UPDATE ON portal_garages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Query 4: RLS on portal_garages
ALTER TABLE portal_garages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garage owners can manage own record"
  ON portal_garages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Query 5: RLS on portal_mechanics
ALTER TABLE portal_mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Garage owners can manage own mechanics"
  ON portal_mechanics FOR ALL
  USING (
    portal_garage_id IN (
      SELECT id FROM portal_garages WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portal_garage_id IN (
      SELECT id FROM portal_garages WHERE user_id = auth.uid()
    )
  );

-- Query 6: Indexes
CREATE INDEX idx_portal_garages_user    ON portal_garages (user_id);
CREATE INDEX idx_portal_mechanics_garage ON portal_mechanics (portal_garage_id);
CREATE INDEX idx_portal_mechanics_status ON portal_mechanics (status);
