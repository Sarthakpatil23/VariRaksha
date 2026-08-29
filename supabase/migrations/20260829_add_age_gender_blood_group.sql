-- ==============================================================================
-- VariRaksha — Add Missing Personal Info (Age, Gender, Blood Group) Across All Actors
-- ==============================================================================

-- 1. Add columns to vari_varkaris
DO $$ BEGIN
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 55;
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
    ALTER TABLE public.vari_varkaris ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'B+';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Add columns to vari_dindi_malaks (Dindi Leaders)
DO $$ BEGIN
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 58;
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
    ALTER TABLE public.vari_dindi_malaks ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'B+';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Add columns to vari_volunteers
DO $$ BEGIN
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 28;
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
    ALTER TABLE public.vari_volunteers ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'O+';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Add columns to vari_medical_staff
DO $$ BEGIN
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 36;
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
    ALTER TABLE public.vari_medical_staff ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'A+';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Add columns to profiles (if missing)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 50;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT DEFAULT 'B+';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==============================================================================
-- 6. Populate Realistic, Varied Mock Data for Existing Records
-- ==============================================================================

-- Update Varkaris
UPDATE public.vari_varkaris SET 
  age = CASE 
    WHEN mobile_number LIKE '%9423010001%' THEN 64
    WHEN mobile_number LIKE '%9423010002%' THEN 68
    WHEN mobile_number LIKE '%9423010003%' THEN 72
    WHEN mobile_number LIKE '%9423010004%' THEN 61
    WHEN mobile_number LIKE '%9423010005%' THEN 54
    WHEN mobile_number LIKE '%9423010006%' THEN 66
    WHEN mobile_number LIKE '%9423010007%' THEN 59
    WHEN mobile_number LIKE '%9423010008%' THEN 63
    WHEN mobile_number LIKE '%9970832199%' THEN 23
    WHEN mobile_number LIKE '%8237336614%' THEN 24
    WHEN mobile_number LIKE '%9527633295%' THEN 23
    WHEN mobile_number LIKE '%9623332651%' THEN 24
    ELSE (45 + (ABS(HASHTEXT(id::text)) % 30))
  END,
  gender = CASE
    WHEN full_name ILIKE '%bai%' OR full_name ILIKE '%tai%' OR full_name ILIKE '%Sonal%' OR full_name ILIKE '%Shantabai%' OR full_name ILIKE '%Anusaya%' OR full_name ILIKE '%Parvatibai%' OR full_name ILIKE '%Kamalbai%' OR full_name ILIKE '%Godavari%' OR full_name ILIKE '%Kusumtai%' OR full_name ILIKE '%Leelabai%' OR full_name ILIKE '%Sunanda%' OR full_name ILIKE '%Sindhutai%' OR full_name ILIKE '%Saraswati%' OR full_name ILIKE '%Indirabai%' OR full_name ILIKE '%Gopikabai%' OR full_name ILIKE '%Sunita%' OR full_name ILIKE '%Janakibai%' OR full_name ILIKE '%Laxmibai%' OR full_name ILIKE '%Muktatai%' OR full_name ILIKE '%Sumanbai%' THEN 'Female'
    ELSE 'Male'
  END,
  blood_group = COALESCE(NULLIF(blood_group, ''), CASE (ABS(HASHTEXT(id::text)) % 8)
    WHEN 0 THEN 'O+'
    WHEN 1 THEN 'A+'
    WHEN 2 THEN 'B+'
    WHEN 3 THEN 'AB+'
    WHEN 4 THEN 'O-'
    WHEN 5 THEN 'A-'
    WHEN 6 THEN 'B-'
    ELSE 'AB-'
  END);

-- Update Dindi Leaders
UPDATE public.vari_dindi_malaks SET
  age = 50 + (ABS(HASHTEXT(id::text)) % 25),
  gender = CASE WHEN full_name ILIKE '%bai%' OR full_name ILIKE '%tai%' THEN 'Female' ELSE 'Male' END,
  blood_group = CASE (ABS(HASHTEXT(id::text)) % 6)
    WHEN 0 THEN 'O+'
    WHEN 1 THEN 'B+'
    WHEN 2 THEN 'A+'
    WHEN 3 THEN 'AB+'
    WHEN 4 THEN 'B+'
    ELSE 'O+'
  END;

-- Update Volunteers
UPDATE public.vari_volunteers SET
  age = 20 + (ABS(HASHTEXT(id::text)) % 22),
  gender = CASE WHEN (ABS(HASHTEXT(id::text)) % 3 = 0) THEN 'Female' ELSE 'Male' END,
  blood_group = CASE (ABS(HASHTEXT(id::text)) % 4)
    WHEN 0 THEN 'O+'
    WHEN 1 THEN 'B+'
    WHEN 2 THEN 'A+'
    ELSE 'AB+'
  END;

-- Update Medical Staff
UPDATE public.vari_medical_staff SET
  age = 28 + (ABS(HASHTEXT(id::text)) % 25),
  gender = CASE WHEN (ABS(HASHTEXT(id::text)) % 2 = 0) THEN 'Female' ELSE 'Male' END,
  blood_group = CASE (ABS(HASHTEXT(id::text)) % 4)
    WHEN 0 THEN 'O+'
    WHEN 1 THEN 'A+'
    WHEN 2 THEN 'B+'
    ELSE 'AB+'
  END;
