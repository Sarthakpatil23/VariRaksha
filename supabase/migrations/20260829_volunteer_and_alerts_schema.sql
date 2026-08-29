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

-- 7. Seed Initial Demo Emergency Alerts (Realistic Wari Sector 4 Scenarios)
TRUNCATE TABLE public.emergency_alerts CASCADE;
TRUNCATE TABLE public.volunteer_tasks CASCADE;

INSERT INTO public.emergency_alerts (
    id, pilgrim_name, pilgrim_phone, pilgrim_age, pilgrim_gender, emergency_card_id,
    dindi_name, problem_type, medical_context, severity, status, distance_away,
    location_name, latitude, longitude, created_at
)
VALUES
    (
        'e1111111-1111-1111-1111-111111111101',
        'Ramesh Dattatray Kulkarni',
        '+91 9423011221',
        68,
        'Male',
        'VK-DEHU03',
        'Sant Tukaram Maharaj Dindi #04',
        'Severe Chest Discomfort & High BP',
        'Hypertension · Cardiac Stent (2021) · Blood Group B+',
        'critical',
        'nearby',
        '180m away · East Gate',
        'Wakhari Main Gate (Palkhi Route)',
        17.6862,
        75.3225,
        NOW() - INTERVAL '2 minutes'
    ),
    (
        'e2222222-2222-2222-2222-222222222202',
        'Shantabai Gyanoba Pawar',
        '+91 9423010002',
        72,
        'Female',
        'VK-DEHU02',
        'Alandi Dindi #12',
        'Heat Exhaustion & Acute Dizziness',
        'Dehydration · Arthritis · Blood Group B+',
        'moderate',
        'nearby',
        '340m away · Water Station 2',
        'Annachhatra Camp 3 (Shade Pavilion)',
        17.6845,
        75.3195,
        NOW() - INTERVAL '6 minutes'
    ),
    (
        'e3333333-3333-3333-3333-333333333303',
        'Damodar Vishwanath Aher',
        '+91 9423040003',
        65,
        'Male',
        'VK-TRM03',
        'Sant Nivruttinath Dindi #01',
        'Separated from Dindi & Asthmatic Wheezing',
        'Mild Asthma · Needs Inhaler Support · Blood Group B+',
        'moderate',
        'nearby',
        '520m away · North Checkpost',
        'Sector 4 North Perimeter Checkpost',
        17.6875,
        75.3240,
        NOW() - INTERVAL '14 minutes'
    ),
    (
        'e4444444-4444-4444-4444-444444444404',
        'Kusumtai Prabhakar Kale',
        '+91 9423020004',
        61,
        'Female',
        'VK-ALN04',
        'Sant Dnyaneshwar Dindi #02',
        'Hydration Assistance & Foot Blister Dressing',
        'High BP · Foot Sore Care · Blood Group B+',
        'normal',
        'nearby',
        '650m away · Medical Post',
        'Mobile Medical Van 2 (Wakhari Cross)',
        17.6830,
        75.3180,
        NOW() - INTERVAL '22 minutes'
    ),
    (
        'e5555555-5555-5555-5555-555555555505',
        'Pandurang Vithoba Shinde',
        '+91 9423060001',
        59,
        'Male',
        'VK-SJG01',
        'Samarth Ramdas Dindi #06',
        'Severe Calf Cramps & Dehydration',
        'Elderly Pilgrim · Electrolytes Administered',
        'moderate',
        'resolved',
        '400m away',
        'Rest Pavilion Sector 4',
        17.6840,
        75.3205,
        NOW() - INTERVAL '45 minutes'
    );

-- Update resolved alert with timestamps and responder metadata
UPDATE public.emergency_alerts
SET 
    responder_id = 'dc770241-be0c-4196-90dd-2574a3d846c4',
    responder_name = 'Abhishek Sanjay Chavan',
    responder_phone = '+91 8888010001',
    claimed_at = NOW() - INTERVAL '40 minutes',
    resolved_at = NOW() - INTERVAL '10 minutes',
    notes = 'Provided ORS solution, leg massage, and rested 20 mins.'
WHERE id = 'e5555555-5555-5555-5555-555555555505';

-- 8. Seed Routine Volunteer Tasks
INSERT INTO public.volunteer_tasks (title, description, sector, status, priority, created_at)
VALUES
    ('Water Tanker 3 Queue Management', 'Manage distribution queue and ensure elderly pilgrims get priority water jugs.', 'Sector 4 (Wakhari Gate)', 'active', 'high', NOW() - INTERVAL '1 hour'),
    ('Emergency Stretcher Standby - Gate 2', 'Keep wheelchair and emergency stretcher on standby near East medical tent.', 'Sector 4 (Wakhari Gate)', 'active', 'high', NOW() - INTERVAL '2 hours'),
    ('Annachhatra Meal Line Coordination', 'Coordinate evening prasad queue and assist differently-abled pilgrims.', 'Sector 4 (Wakhari Gate)', 'active', 'medium', NOW() - INTERVAL '3 hours'),
    ('Dindi Flag 12 Sector Escort', 'Escorted Alandi Dindi column across the congested highway junction safely.', 'Sector 4 (Wakhari Gate)', 'completed', 'medium', NOW() - INTERVAL '4 hours');
