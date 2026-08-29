-- ==============================================================================
-- VariRaksha — Vari Management & Scoped Sub-Entities Schema (Idempotent)
-- ==============================================================================

-- 1. Vari Entity (Parent pilgrimage route instance)
CREATE TABLE IF NOT EXISTS public.vari (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_number TEXT NOT NULL UNIQUE,
    dindi_leader_name TEXT NOT NULL,
    start_point TEXT NOT NULL CHECK (start_point IN ('Dehu', 'Alandi')),
    destination TEXT NOT NULL DEFAULT 'Pandharpur',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Varkari Scoped Sub-Entity (Pilgrims registered to this Vari)
CREATE TABLE IF NOT EXISTS public.vari_varkaris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT,
    emergency_card_id TEXT DEFAULT ('VK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    blood_group TEXT DEFAULT 'B+',
    dindi_number TEXT DEFAULT 'Dindi 01',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dindi Malak Scoped Sub-Entity (Dindi Heads & Owners)
CREATE TABLE IF NOT EXISTS public.vari_dindi_malaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    dindi_name TEXT NOT NULL,
    palkhi_route TEXT DEFAULT 'Main Palkhi Marg',
    total_pilgrims INT DEFAULT 150,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Volunteer Scoped Sub-Entity (Field Coordinators & Volunteers)
CREATE TABLE IF NOT EXISTS public.vari_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    assigned_sector TEXT DEFAULT 'Sector 1 (Alankapuram)',
    duty_type TEXT DEFAULT 'Crowd & Queue Safety',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Medical Staff Scoped Sub-Entity (Doctors, Nurses & First Responders)
CREATE TABLE IF NOT EXISTS public.vari_medical_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    specialization TEXT DEFAULT 'General Emergency & Trauma',
    medical_camp_location TEXT DEFAULT 'Mobile Ambulance Unit 1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast scoped queries
CREATE INDEX IF NOT EXISTS idx_vari_varkaris_vari_id ON public.vari_varkaris(vari_id);
CREATE INDEX IF NOT EXISTS idx_vari_dindi_malaks_vari_id ON public.vari_dindi_malaks(vari_id);
CREATE INDEX IF NOT EXISTS idx_vari_volunteers_vari_id ON public.vari_volunteers(vari_id);
CREATE INDEX IF NOT EXISTS idx_vari_medical_staff_vari_id ON public.vari_medical_staff(vari_id);

-- Enable RLS
ALTER TABLE public.vari ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_varkaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_dindi_malaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_medical_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Vari (Idempotent)
DROP POLICY IF EXISTS "Public read for vari" ON public.vari;
CREATE POLICY "Public read for vari" ON public.vari FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create vari" ON public.vari;
CREATE POLICY "Authenticated users can create vari" ON public.vari FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update vari" ON public.vari;
CREATE POLICY "Authenticated users can update vari" ON public.vari FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete vari" ON public.vari;
CREATE POLICY "Authenticated users can delete vari" ON public.vari FOR DELETE USING (true);

-- RLS Policies for child tables (Idempotent)
DROP POLICY IF EXISTS "Public read for vari_varkaris" ON public.vari_varkaris;
CREATE POLICY "Public read for vari_varkaris" ON public.vari_varkaris FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated CRUD for vari_varkaris" ON public.vari_varkaris;
CREATE POLICY "Authenticated CRUD for vari_varkaris" ON public.vari_varkaris FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read for vari_dindi_malaks" ON public.vari_dindi_malaks;
CREATE POLICY "Public read for vari_dindi_malaks" ON public.vari_dindi_malaks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated CRUD for vari_dindi_malaks" ON public.vari_dindi_malaks;
CREATE POLICY "Authenticated CRUD for vari_dindi_malaks" ON public.vari_dindi_malaks FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read for vari_volunteers" ON public.vari_volunteers;
CREATE POLICY "Public read for vari_volunteers" ON public.vari_volunteers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated CRUD for vari_volunteers" ON public.vari_volunteers;
CREATE POLICY "Authenticated CRUD for vari_volunteers" ON public.vari_volunteers FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read for vari_medical_staff" ON public.vari_medical_staff;
CREATE POLICY "Public read for vari_medical_staff" ON public.vari_medical_staff FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated CRUD for vari_medical_staff" ON public.vari_medical_staff;
CREATE POLICY "Authenticated CRUD for vari_medical_staff" ON public.vari_medical_staff FOR ALL USING (true);
