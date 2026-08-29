-- ==============================================================================
-- VariRaksha — Fix dindi_name Null Constraint on vari_dindi_malaks
-- ==============================================================================

DO $$ BEGIN
    -- Drop NOT NULL constraint on dindi_name if it exists
    ALTER TABLE public.vari_dindi_malaks ALTER COLUMN dindi_name DROP NOT NULL;
    ALTER TABLE public.vari_dindi_malaks ALTER COLUMN dindi_name SET DEFAULT 'Palkhi Dindi';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    -- Ensure legacy columns are nullable with defaults
    ALTER TABLE public.vari_dindi_malaks ALTER COLUMN palkhi_route DROP NOT NULL;
    ALTER TABLE public.vari_dindi_malaks ALTER COLUMN total_pilgrims DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
