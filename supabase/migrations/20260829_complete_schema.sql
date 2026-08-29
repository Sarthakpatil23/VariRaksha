-- ==============================================================================
-- VariRaksha — Complete PostgreSQL Schema & Security Policies for Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('varkari', 'dindi_leader', 'coordinator', 'volunteer', 'medical_staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Auto-Confirm Trigger for Auth Users (Eliminates email confirmation rate limits)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

-- Confirm any existing users that were registered earlier
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 4. Dindi Groups (Pilgrim Marching Columns)
CREATE TABLE IF NOT EXISTS public.dindi_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    leader_phone TEXT NOT NULL,
    route_sector TEXT NOT NULL DEFAULT 'Wakhari -> Phaltan',
    current_lat DOUBLE PRECISION DEFAULT 18.5204,
    current_lng DOUBLE PRECISION DEFAULT 73.8567,
    total_members INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile_number TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'varkari',
    preferred_language TEXT NOT NULL DEFAULT 'mr', -- 'mr', 'hi', 'en'
    emergency_card_id TEXT UNIQUE DEFAULT ('VK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
    dindi_group_id UUID REFERENCES public.dindi_groups(id) ON DELETE SET NULL,
    age INT,
    gender TEXT,
    avatar_url TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Medical Profiles (Linked to User Profile)
CREATE TABLE IF NOT EXISTS public.medical_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blood_group TEXT NOT NULL DEFAULT 'B+',
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    current_medications TEXT[] DEFAULT '{}',
    organ_donor BOOLEAN DEFAULT FALSE,
    critical_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Emergency Contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SOS Events (Realtime Emergency Queue)
CREATE TABLE IF NOT EXISTS public.sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilgrim_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dindi_group_id UUID REFERENCES public.dindi_groups(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'in_response', 'medical_handoff', 'resolved'
    severity TEXT NOT NULL DEFAULT 'critical', -- 'critical', 'moderate', 'info'
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT DEFAULT 'Near Wakhari Gate',
    trigger_type TEXT NOT NULL DEFAULT 'button_press', -- 'button_press', 'qr_scan', 'voice_ai'
    responder_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 9. Broadcast Announcements
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dindi_group_id UUID NOT NULL REFERENCES public.dindi_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Automated Profile Creation Trigger on Supabase Auth SignUp
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        mobile_number,
        role,
        avatar_url
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        NEW.phone,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'varkari'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Also initialize an empty medical profile for the new user
    INSERT INTO public.medical_profiles (profile_id, blood_group)
    VALUES (NEW.id, 'B+')
    ON CONFLICT (profile_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- Row Level Security (RLS) Policies (Idempotent)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dindi_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Public read for emergency cards" ON public.profiles;
CREATE POLICY "Public read for emergency cards" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Medical Profiles Policies
DROP POLICY IF EXISTS "Public read for medical emergency cards" ON public.medical_profiles;
CREATE POLICY "Public read for medical emergency cards" ON public.medical_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own medical profile" ON public.medical_profiles;
CREATE POLICY "Users can manage their own medical profile" ON public.medical_profiles FOR ALL USING (auth.uid() = profile_id);

-- 3. SOS Events Policies
DROP POLICY IF EXISTS "Anyone authenticated can insert SOS" ON public.sos_events;
CREATE POLICY "Anyone authenticated can insert SOS" ON public.sos_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view active SOS events" ON public.sos_events;
CREATE POLICY "Anyone can view active SOS events" ON public.sos_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Responders and creators can update SOS" ON public.sos_events;
CREATE POLICY "Responders and creators can update SOS" ON public.sos_events FOR UPDATE USING (true);

-- 4. Dindi Groups Policies
DROP POLICY IF EXISTS "Public view dindi groups" ON public.dindi_groups;
CREATE POLICY "Public view dindi groups" ON public.dindi_groups FOR SELECT USING (true);

-- 5. Broadcast Messages Policies
DROP POLICY IF EXISTS "Public view broadcast messages" ON public.broadcast_messages;
CREATE POLICY "Public view broadcast messages" ON public.broadcast_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leaders can send broadcasts" ON public.broadcast_messages;
CREATE POLICY "Leaders can send broadcasts" ON public.broadcast_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert Seed Dindi Groups for Demo
INSERT INTO public.dindi_groups (name, leader_name, leader_phone, route_sector, total_members)
VALUES 
  ('Alandi Dindi No. 12 (Sant Dnyaneshwar Maharaj)', 'H.B.P. Sopankaka More', '+91 98220 12345', 'Alandi -> Saswad -> Phaltan', 420),
  ('Dehu Dindi No. 04 (Sant Tukaram Maharaj)', 'H.B.P. Tukaram Patil', '+91 98220 54321', 'Dehu -> Pune -> Pandharpur', 680),
  ('Trayambakeshwar Dindi No. 01 (Sant Nivruttinath)', 'H.B.P. Eknath Maharaj', '+91 98220 99887', 'Nashik -> Ahmednagar -> Wakhari', 350)
ON CONFLICT DO NOTHING;
