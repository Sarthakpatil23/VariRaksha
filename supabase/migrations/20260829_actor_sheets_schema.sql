-- ==============================================================================
-- VariRaksha — Actor Sheets Data Entry Schema & Column Enhancements
-- ==============================================================================

-- 1. Varkaris Table
CREATE TABLE IF NOT EXISTS public.vari_varkaris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    medical_conditions TEXT DEFAULT 'None',
    allergies TEXT DEFAULT 'None',
    village TEXT NOT NULL,
    emergency_card_id TEXT DEFAULT ('VK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    blood_group TEXT DEFAULT 'B+',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter table to ensure all columns exist if table was created previously
DO $$ BEGIN
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS medical_conditions TEXT DEFAULT 'None';
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'None';
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS village TEXT DEFAULT 'Pandharpur';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Dindi Leaders Table
CREATE TABLE IF NOT EXISTS public.vari_dindi_malaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    medical_conditions TEXT DEFAULT 'None',
    allergies TEXT DEFAULT 'None',
    village TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS medical_conditions TEXT DEFAULT 'None';
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'None';
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS village TEXT DEFAULT 'Pandharpur';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Volunteers Table
CREATE TABLE IF NOT EXISTS public.vari_volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    medical_conditions TEXT DEFAULT 'None',
    allergies TEXT DEFAULT 'None',
    village TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS medical_conditions TEXT DEFAULT 'None';
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'None';
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS village TEXT DEFAULT 'Pandharpur';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Medical Staff Table
CREATE TABLE IF NOT EXISTS public.vari_medical_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    medical_conditions TEXT DEFAULT 'None',
    allergies TEXT DEFAULT 'None',
    village TEXT NOT NULL,
    specialization TEXT NOT NULL DEFAULT 'General Emergency & Trauma',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS medical_conditions TEXT DEFAULT 'None';
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'None';
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS village TEXT DEFAULT 'Pandharpur';
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS specialization TEXT DEFAULT 'General Emergency & Trauma';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_varkaris_vari_village ON public.vari_varkaris(vari_id, village);
CREATE INDEX IF NOT EXISTS idx_dindi_malaks_vari ON public.vari_dindi_malaks(vari_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_vari ON public.vari_volunteers(vari_id);
CREATE INDEX IF NOT EXISTS idx_medical_staff_vari_spec ON public.vari_medical_staff(vari_id, specialization);

-- RLS Policies (Idempotent)
ALTER TABLE public.vari_varkaris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_dindi_malaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vari_medical_staff ENABLE ROW LEVEL SECURITY;

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
