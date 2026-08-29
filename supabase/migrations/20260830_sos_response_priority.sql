-- ==============================================================================
-- VariRaksha — Dynamic Response Priority System for Emergency SOS Incidents
-- ==============================================================================

-- 1. Ensure Table Structure contains Priority and Meta Columns
DO $$ BEGIN
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS varkari_id UUID;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS vari_id UUID;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS emergency_type TEXT;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'MODERATE';
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS priority_score NUMERIC DEFAULT 40;
    ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS priority_factors JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Indexes for High-Speed Prioritized Sorting
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority_level ON public.emergency_alerts(priority_level);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority_score ON public.emergency_alerts(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status_created ON public.emergency_alerts(status, created_at DESC);

-- 3. Dynamic Priority Evaluation Function
-- Calculates dynamic response scores, waiting-time bonuses, recency boosts, and priority bands
CREATE OR REPLACE FUNCTION public.calculate_alert_priority_record(
    p_severity TEXT,
    p_problem_type TEXT,
    p_notes TEXT,
    p_medical_context TEXT,
    p_age INT,
    p_created_at TIMESTAMPTZ,
    p_resolved_at TIMESTAMPTZ,
    p_status TEXT,
    p_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
    v_sev_lower TEXT := LOWER(COALESCE(p_severity, 'moderate'));
    v_sev_base INT := 40;
    v_sev_label TEXT := 'Moderate Severity';
    v_age INT := COALESCE(p_age, 0);
    v_age_bonus INT := 0;
    v_med_text TEXT := LOWER(CONCAT(COALESCE(p_medical_context, ''), ' ', COALESCE(p_notes, '')));
    v_med_bonus INT := 0;
    v_prob_text TEXT := LOWER(CONCAT(COALESCE(p_problem_type, ''), ' ', COALESCE(p_notes, '')));
    v_type_bonus INT := 5;
    v_end_time TIMESTAMPTZ;
    v_elapsed_seconds NUMERIC;
    v_waiting_minutes INT;
    v_waiting_bonus NUMERIC := 0;
    v_recency_bonus INT := 0;
    v_raw_score NUMERIC;
    v_effective_score NUMERIC;
    v_priority_level TEXT := 'LOW';
    v_band_rank INT := 1;
    v_explanation TEXT := '';
    v_tags TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 1. Severity Base
    IF v_sev_lower = 'critical' THEN
        v_sev_base := 100;
        v_sev_label := 'Critical Emergency';
    ELSIF v_sev_lower = 'high' THEN
        v_sev_base := 70;
        v_sev_label := 'High Severity';
    ELSIF v_sev_lower = 'moderate' THEN
        v_sev_base := 40;
        v_sev_label := 'Moderate Severity';
    ELSE
        v_sev_base := 20;
        v_sev_label := 'Low Severity';
    END IF;

    -- 2. Age Bonus
    IF v_age >= 75 THEN
        v_age_bonus := 15;
        v_tags := array_append(v_tags, CONCAT('Elderly (', v_age, '+)'));
    ELSIF v_age >= 65 THEN
        v_age_bonus := 10;
        v_tags := array_append(v_tags, CONCAT('Senior (', v_age, ')'));
    ELSIF v_age >= 50 THEN
        v_age_bonus := 5;
        v_tags := array_append(v_tags, CONCAT('Age ', v_age));
    END IF;

    -- 3. Medical Vulnerability
    IF v_med_text LIKE '%cardiac%' OR v_med_text LIKE '%heart%' OR v_med_text LIKE '%stroke%' OR v_med_text LIKE '%हृदय%' THEN
        v_med_bonus := v_med_bonus + 15;
        v_tags := array_append(v_tags, 'Cardiac history');
    END IF;

    IF v_med_text LIKE '%asthma%' OR v_med_text LIKE '%respiratory%' OR v_med_text LIKE '%copd%' OR v_med_text LIKE '%दमा%' OR v_med_text LIKE '%श्वास%' THEN
        v_med_bonus := v_med_bonus + 15;
        v_tags := array_append(v_tags, 'Asthma / Respiratory');
    END IF;

    IF v_med_text LIKE '%diabetes%' OR v_med_text LIKE '%diabetic%' OR v_med_text LIKE '%मधुमेह%' OR v_med_text LIKE '%sugar%' THEN
        v_med_bonus := v_med_bonus + 8;
        v_tags := array_append(v_tags, 'Diabetes');
    END IF;

    IF v_med_text LIKE '%hypertension%' OR v_med_text LIKE '%bp%' OR v_med_text LIKE '%blood pressure%' OR v_med_text LIKE '%रक्तदाब%' THEN
        v_med_bonus := v_med_bonus + 5;
        v_tags := array_append(v_tags, 'High BP');
    END IF;

    IF (v_med_text LIKE '%allerg%' OR v_med_text LIKE '%chronic%' OR v_med_text LIKE '%ऍलर्जी%') AND v_med_bonus = 0 THEN
        v_med_bonus := v_med_bonus + 3;
        v_tags := array_append(v_tags, 'Allergies on file');
    END IF;

    -- 4. Emergency-Type Specific Modifier
    IF v_prob_text LIKE '%chest%' OR v_prob_text LIKE '%breath%' OR v_prob_text LIKE '%unconscious%' OR v_prob_text LIKE '%faint%' OR v_prob_text LIKE '%छातीत दुखणे%' OR v_prob_text LIKE '%बेशुद्ध%' THEN
        v_type_bonus := 30;
        v_tags := array_append(v_tags, 'Chest / Breathing distress');
    ELSIF v_prob_text LIKE '%injur%' OR v_prob_text LIKE '%bleed%' OR v_prob_text LIKE '%fracture%' OR v_prob_text LIKE '%wound%' OR v_prob_text LIKE '%दुखापत%' OR v_prob_text LIKE '%जखम%' OR v_prob_text LIKE '%रक्त%' THEN
        v_type_bonus := 25;
        v_tags := array_append(v_tags, 'Injury / Bleeding');
    ELSIF v_prob_text LIKE '%dehydrat%' OR v_prob_text LIKE '%heat%' OR v_prob_text LIKE '%sunstroke%' OR v_prob_text LIKE '%dizzy%' OR v_prob_text LIKE '%चक्कर%' OR v_prob_text LIKE '%उष्माघात%' THEN
        v_type_bonus := 20;
        v_tags := array_append(v_tags, 'Severe Dehydration');
    ELSIF v_prob_text LIKE '%lost%' OR v_prob_text LIKE '%separat%' OR v_prob_text LIKE '%हरवले%' OR v_prob_text LIKE '%दिंडी%' THEN
        v_type_bonus := 10;
        v_tags := array_append(v_tags, 'Lost from Dindi');
    ELSE
        v_type_bonus := 5;
    END IF;

    -- 5. Waiting Time Bonus
    v_end_time := CASE WHEN p_status = 'resolved' AND p_resolved_at IS NOT NULL THEN p_resolved_at ELSE p_now END;
    v_elapsed_seconds := GREATEST(0, EXTRACT(EPOCH FROM (v_end_time - COALESCE(p_created_at, p_now))));
    v_waiting_minutes := FLOOR(v_elapsed_seconds / 60);

    -- waiting_bonus = min(minutes_unresolved * 0.5, 20.0)
    v_waiting_bonus := LEAST(ROUND((v_waiting_minutes * 0.5)::numeric, 1), 20.0);
    IF v_waiting_minutes >= 3 AND p_status != 'resolved' THEN
        v_tags := array_append(v_tags, CONCAT(v_waiting_minutes, 'm waiting'));
    END IF;

    -- 6. Recency Boost
    IF p_status != 'resolved' THEN
        IF v_waiting_minutes <= 5 THEN
            v_recency_bonus := 10;
            v_tags := array_append(v_tags, 'Just reported');
        ELSIF v_waiting_minutes <= 10 THEN
            v_recency_bonus := 5;
        END IF;
    END IF;

    -- 7. Scores
    v_raw_score := v_sev_base + v_age_bonus + v_med_bonus + v_type_bonus;
    v_effective_score := v_raw_score + v_waiting_bonus + v_recency_bonus;

    -- 8. Priority Band (Critical severity floor)
    IF v_sev_lower = 'critical' OR v_effective_score >= 120 THEN
        v_priority_level := 'CRITICAL';
        v_band_rank := 4;
    ELSIF v_sev_lower = 'high' OR v_effective_score >= 80 THEN
        v_priority_level := 'HIGH';
        v_band_rank := 3;
    ELSIF v_sev_lower = 'moderate' OR v_effective_score >= 45 THEN
        v_priority_level := 'MODERATE';
        v_band_rank := 2;
    ELSE
        v_priority_level := 'LOW';
        v_band_rank := 1;
    END IF;

    IF array_length(v_tags, 1) > 0 THEN
        v_explanation := array_to_string(v_tags, ' · ');
    ELSE
        v_explanation := CONCAT(v_sev_label, ' · Standard response');
    END IF;

    RETURN jsonb_build_object(
        'severity_base', v_sev_base,
        'severity_label', v_sev_label,
        'age_bonus', v_age_bonus,
        'medical_bonus', v_med_bonus,
        'type_bonus', v_type_bonus,
        'waiting_minutes', v_waiting_minutes,
        'waiting_bonus', v_waiting_bonus,
        'recency_bonus', v_recency_bonus,
        'raw_score', v_raw_score,
        'effective_score', v_effective_score,
        'priority_level', v_priority_level,
        'band_rank', v_band_rank,
        'explanation', v_explanation
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger to automatically compute and store baseline priority columns on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.trg_fn_emergency_alerts_priority()
RETURNS TRIGGER AS $$
DECLARE
    v_calc JSONB;
BEGIN
    v_calc := public.calculate_alert_priority_record(
        NEW.severity,
        NEW.problem_type,
        NEW.notes,
        NEW.medical_context,
        NEW.pilgrim_age,
        NEW.created_at,
        NEW.resolved_at,
        NEW.status,
        NOW()
    );

    NEW.priority_level := v_calc->>'priority_level';
    NEW.priority_score := (v_calc->>'raw_score')::NUMERIC;
    NEW.priority_factors := v_calc;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_emergency_alerts_priority ON public.emergency_alerts;
CREATE TRIGGER trg_emergency_alerts_priority
BEFORE INSERT OR UPDATE OF severity, problem_type, notes, medical_context, pilgrim_age
ON public.emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_emergency_alerts_priority();

-- 5. RPC Function: Get Prioritized Emergency Alerts
-- Returns all active alerts dynamically sorted by:
-- 1. Priority Band (CRITICAL > HIGH > MODERATE > LOW)
-- 2. Effective Priority Score (Descending)
-- 3. Created At (Newest first)
CREATE OR REPLACE FUNCTION public.get_prioritized_emergency_alerts(
    p_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    id UUID,
    varkari_id UUID,
    vari_id UUID,
    pilgrim_name TEXT,
    pilgrim_phone TEXT,
    pilgrim_age INT,
    pilgrim_gender TEXT,
    emergency_card_id TEXT,
    dindi_name TEXT,
    problem_type TEXT,
    emergency_type TEXT,
    description TEXT,
    notes TEXT,
    medical_context TEXT,
    severity TEXT,
    status TEXT,
    distance_away TEXT,
    location_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    responder_id TEXT,
    responder_name TEXT,
    responder_phone TEXT,
    claimed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    priority_level TEXT,
    priority_score NUMERIC,
    effective_priority_score NUMERIC,
    priority_band_rank INT,
    priority_explanation TEXT,
    priority_factors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH calculated AS (
        SELECT
            ea.*,
            public.calculate_alert_priority_record(
                ea.severity,
                ea.problem_type,
                ea.notes,
                ea.medical_context,
                ea.pilgrim_age,
                ea.created_at,
                ea.resolved_at,
                ea.status,
                p_now
            ) AS dyn
        FROM public.emergency_alerts ea
    )
    SELECT
        c.id,
        c.varkari_id,
        c.vari_id,
        c.pilgrim_name,
        c.pilgrim_phone,
        c.pilgrim_age,
        c.pilgrim_gender,
        c.emergency_card_id,
        c.dindi_name,
        c.problem_type,
        c.emergency_type,
        c.description,
        c.notes,
        c.medical_context,
        c.severity,
        c.status,
        c.distance_away,
        c.location_name,
        c.latitude,
        c.longitude,
        c.responder_id,
        c.responder_name,
        c.responder_phone,
        c.claimed_at,
        c.resolved_at,
        c.created_at,
        c.updated_at,
        (c.dyn->>'priority_level')::TEXT AS priority_level,
        (c.dyn->>'raw_score')::NUMERIC AS priority_score,
        (c.dyn->>'effective_score')::NUMERIC AS effective_priority_score,
        (c.dyn->>'band_rank')::INT AS priority_band_rank,
        (c.dyn->>'explanation')::TEXT AS priority_explanation,
        c.dyn AS priority_factors
    FROM calculated c
    ORDER BY
        CASE c.status
            WHEN 'nearby' THEN 1
            WHEN 'in_progress' THEN 2
            ELSE 3
        END ASC,
        (c.dyn->>'band_rank')::INT DESC,
        (c.dyn->>'effective_score')::NUMERIC DESC,
        c.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
