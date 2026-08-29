-- ==============================================================================
-- VariRaksha — Volunteer Emergency Alerts & Tasks Schema (Idempotent)
-- ==============================================================================

-- 1. Emergency Alerts Table (Live Incident Queue)
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilgrim_name TEXT NOT NULL,
    pilgrim_phone TEXT,
    pilgrim_age INT,
    pilgrim_gender TEXT DEFAULT 'Male',
    emergency_card_id TEXT,
    dindi_name TEXT,
    problem_type TEXT NOT NULL,
    medical_context TEXT,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('critical', 'moderate', 'normal')),
    status TEXT NOT NULL DEFAULT 'nearby' CHECK (status IN ('nearby', 'in_progress', 'resolved')),
    distance_away TEXT DEFAULT '180m away',
    location_name TEXT DEFAULT 'Sector 4 · Wakhari Rest Camp',
    latitude DOUBLE PRECISION DEFAULT 17.6854,
    longitude DOUBLE PRECISION DEFAULT 75.3211,
    responder_id TEXT,
    responder_name TEXT,
    responder_phone TEXT,
    claimed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Volunteer Routine Tasks Table
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    sector TEXT DEFAULT 'Sector 4 (Wakhari Gate)',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 3. Indexes for fast query and sorting
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_severity ON public.emergency_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status ON public.volunteer_tasks(status);

-- 4. Enable Row Level Security
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Idempotent)
DROP POLICY IF EXISTS "Public read emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Public read emergency_alerts" ON public.emergency_alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated CRUD emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Authenticated CRUD emergency_alerts" ON public.emergency_alerts FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read volunteer_tasks" ON public.volunteer_tasks;
CREATE POLICY "Public read volunteer_tasks" ON public.volunteer_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated CRUD volunteer_tasks" ON public.volunteer_tasks;
CREATE POLICY "Authenticated CRUD volunteer_tasks" ON public.volunteer_tasks FOR ALL USING (true);

-- 6. Enable Realtime Replication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_tasks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. Publication registration complete.

