-- ==============================================================================
-- VariRaksha — Structured Emergency Contacts for Varkaris & Dindi Leaders
-- ==============================================================================

-- 1. Normalized Emergency Contacts Table for Actors (1-to-many relationship)
CREATE TABLE IF NOT EXISTS public.vari_actor_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('varkari', 'dindi_malak', 'volunteer', 'medical_staff')),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relationship TEXT DEFAULT 'Emergency Contact',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by actor
CREATE INDEX IF NOT EXISTS idx_actor_emergency_contacts ON public.vari_actor_emergency_contacts(actor_id, actor_type);

-- Enable Row Level Security
ALTER TABLE public.vari_actor_emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for vari_actor_emergency_contacts" ON public.vari_actor_emergency_contacts;
CREATE POLICY "Public read for vari_actor_emergency_contacts" ON public.vari_actor_emergency_contacts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated CRUD for vari_actor_emergency_contacts" ON public.vari_actor_emergency_contacts;
CREATE POLICY "Authenticated CRUD for vari_actor_emergency_contacts" ON public.vari_actor_emergency_contacts FOR ALL USING (true);
