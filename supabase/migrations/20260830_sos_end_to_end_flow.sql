-- ==============================================================================
-- VariRaksha — End-to-End SOS Emergency Lifecycle & Atomic Claim RPC Schema
-- ==============================================================================

-- 1. Ensure Table Structure with all Normalized Fields
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    varkari_id UUID,
    vari_id UUID,
    pilgrim_name TEXT NOT NULL,
    pilgrim_phone TEXT,
    pilgrim_age INT,
    pilgrim_gender TEXT DEFAULT 'Male',
    emergency_card_id TEXT,
    dindi_name TEXT,
    problem_type TEXT NOT NULL,
    description TEXT,
    medical_context TEXT,
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('critical', 'moderate', 'normal')),
    status TEXT NOT NULL DEFAULT 'nearby' CHECK (status IN ('nearby', 'in_progress', 'resolved')),
    distance_away TEXT DEFAULT '180m away',
    location_name TEXT DEFAULT 'Sector 1 · Wakhari Corridor',
    latitude DOUBLE PRECISION DEFAULT 17.7120,
    longitude DOUBLE PRECISION DEFAULT 75.2410,
    responder_id TEXT,
    responder_name TEXT,
    responder_phone TEXT,
    claimed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if table was created in an earlier migration
DO $$ BEGIN
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS varkari_id UUID;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS vari_id UUID;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS medical_context TEXT;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS responder_phone TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Indexes for High-Performance Queries and Sorting
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_severity ON public.emergency_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON public.emergency_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_responder ON public.emergency_alerts(responder_id);

-- 3. Row Level Security
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Public read emergency_alerts" ON public.emergency_alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Public insert emergency_alerts" ON public.emergency_alerts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Public update emergency_alerts" ON public.emergency_alerts FOR UPDATE USING (true);

-- 4. Enable Supabase Realtime Publication
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. ATOMIC CLAIM RPC FUNCTION
-- Safely assigns a volunteer to an active emergency alert without race conditions
CREATE OR REPLACE FUNCTION public.claim_emergency_alert(
    p_alert_id UUID,
    p_responder_id TEXT,
    p_responder_name TEXT,
    p_responder_phone TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_alert public.emergency_alerts;
BEGIN
    -- Perform atomic conditional update: only if currently 'nearby' (active unclaimed)
    UPDATE public.emergency_alerts
    SET
        status = 'in_progress',
        responder_id = p_responder_id,
        responder_name = p_responder_name,
        responder_phone = p_responder_phone,
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_alert_id
      AND status = 'nearby'
    RETURNING * INTO v_alert;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_claimed', false,
            'alert', row_to_json(v_alert)
        );
    ELSE
        -- Check if it was already claimed
        SELECT * INTO v_alert FROM public.emergency_alerts WHERE id = p_alert_id;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'already_claimed', true,
                'claimed_by', v_alert.responder_name,
                'alert', row_to_json(v_alert)
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'already_claimed', false,
                'error', 'Alert not found'
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ATOMIC RESOLVE RPC FUNCTION
CREATE OR REPLACE FUNCTION public.resolve_emergency_alert(
    p_alert_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_alert public.emergency_alerts;
BEGIN
    UPDATE public.emergency_alerts
    SET
        status = 'resolved',
        notes = COALESCE(p_notes, notes),
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_alert_id
    RETURNING * INTO v_alert;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'alert', row_to_json(v_alert)
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Alert not found'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
