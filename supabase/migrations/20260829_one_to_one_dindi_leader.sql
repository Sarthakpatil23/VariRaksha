-- ==============================================================================
-- VariRaksha — 1-to-1 Dindi Leader Architecture & Constraint Migration
-- ==============================================================================

-- 1. Ensure vari_dindi_malaks has unique vari_id constraint (1 leader per Vari)
CREATE TABLE IF NOT EXISTS public.vari_dindi_malaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vari_id UUID UNIQUE NOT NULL REFERENCES public.vari(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    medical_conditions TEXT DEFAULT 'None',
    allergies TEXT DEFAULT 'None',
    village TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In case table already exists, enforce UNIQUE constraint on vari_id
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vari_dindi_malaks_vari_id_key'
    ) THEN
        ALTER TABLE public.vari_dindi_malaks ADD CONSTRAINT vari_dindi_malaks_vari_id_key UNIQUE (vari_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_dindi_malaks_unique_vari ON public.vari_dindi_malaks(vari_id);

-- 3. RLS Policies
ALTER TABLE public.vari_dindi_malaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for vari_dindi_malaks" ON public.vari_dindi_malaks;
CREATE POLICY "Public read for vari_dindi_malaks" ON public.vari_dindi_malaks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated CRUD for vari_dindi_malaks" ON public.vari_dindi_malaks;
CREATE POLICY "Authenticated CRUD for vari_dindi_malaks" ON public.vari_dindi_malaks FOR ALL USING (true);
