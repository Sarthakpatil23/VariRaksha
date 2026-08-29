-- ==============================================================================
-- VariRaksha — Rich Data Seed Migration (Plentiful Varkaris, Volunteers & Medical Staff)
-- ==============================================================================

-- 1. Remove legacy start_point check constraint
DO $$ BEGIN
    ALTER TABLE public.vari DROP CONSTRAINT IF EXISTS vari_start_point_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Clear old data cleanly
TRUNCATE TABLE public.vari_actor_emergency_contacts CASCADE;
TRUNCATE TABLE public.vari_medical_staff CASCADE;
TRUNCATE TABLE public.vari_volunteers CASCADE;
TRUNCATE TABLE public.vari_varkaris CASCADE;
TRUNCATE TABLE public.vari_dindi_malaks CASCADE;
TRUNCATE TABLE public.vari CASCADE;

-- 3. Insert 7 Pilgrimage Varis
INSERT INTO public.vari (id, vari_number, dindi_leader_name, start_point, destination, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Vari 01', 'H.B.P. Suresh Tukaram Patil', 'Dehu', 'Pandharpur', 'active'),
    ('a2222222-2222-2222-2222-222222222222', 'Vari 02', 'H.B.P. Vitthalrao Pandurang Gaikwad', 'Alandi', 'Pandharpur', 'active'),
    ('a3333333-3333-3333-3333-333333333333', 'Vari 03', 'H.B.P. Ramchandra Eknath Shinde', 'Paithan', 'Pandharpur', 'active'),
    ('a4444444-4444-4444-4444-444444444444', 'Vari 04', 'H.B.P. Dnyaneshwar Babanrao Jagtap', 'Trimbakeshwar', 'Pandharpur', 'active'),
    ('a5555555-5555-5555-5555-555555555555', 'Vari 05', 'H.B.P. Gajanan Madhav Deshmukh', 'Shegaon', 'Pandharpur', 'active'),
    ('a6666666-6666-6666-6666-666666666666', 'Vari 06', 'H.B.P. Maruti Ramdas Bhosale', 'Sajjangad', 'Pandharpur', 'active'),
    ('a7777777-7777-7777-7777-777777777777', 'Vari 07', 'H.B.P. Sopanrao Govind Kadam', 'Saswad', 'Pandharpur', 'active');

-- 4. Insert 1-to-1 Dindi Leaders
INSERT INTO public.vari_dindi_malaks (id, vari_id, full_name, mobile_number, village, medical_conditions, allergies, dindi_name)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'H.B.P. Suresh Tukaram Patil', '+91 9822011101', 'Baramati, Pune', 'Hypertension (Mild)', 'None', 'Sant Tukaram Maharaj Palkhi Dindi'),
    ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'H.B.P. Vitthalrao Pandurang Gaikwad', '+91 9822011102', 'Khed, Pune', 'Diabetes Type 2', 'Penicillin', 'Sant Dnyaneshwar Maharaj Palkhi Dindi'),
    ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'H.B.P. Ramchandra Eknath Shinde', '+91 9822011103', 'Shevgaon, Ahmednagar', 'None', 'Dust & Pollen', 'Sant Eknath Maharaj Palkhi Dindi'),
    ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'H.B.P. Dnyaneshwar Babanrao Jagtap', '+91 9822011104', 'Sinnar, Nashik', 'Asthma', 'None', 'Sant Nivruttinath Maharaj Palkhi Dindi'),
    ('b5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'H.B.P. Gajanan Madhav Deshmukh', '+91 9822011105', 'Khamgaon, Buldhana', 'None', 'Sulfa drugs', 'Sant Gajanan Maharaj Palkhi Dindi'),
    ('b6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'H.B.P. Maruti Ramdas Bhosale', '+91 9822011106', 'Patan, Satara', 'BP controlled', 'None', 'Samarth Ramdas Swami Palkhi Dindi'),
    ('b7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 'H.B.P. Sopanrao Govind Kadam', '+91 9822011107', 'Purandar, Pune', 'None', 'None', 'Sant Sopandev Maharaj Palkhi Dindi');

-- 5. Leader Emergency Contacts (Multiple per leader)
INSERT INTO public.vari_actor_emergency_contacts (actor_id, actor_type, name, phone_number, relationship)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'dindi_malak', 'Sunita Suresh Patil', '+91 9822099001', 'Spouse'),
    ('b1111111-1111-1111-1111-111111111111', 'dindi_malak', 'Ajinkya Patil (Son)', '+91 9822099002', 'Son'),
    ('b2222222-2222-2222-2222-222222222222', 'dindi_malak', 'Pandurang Gaikwad', '+91 9822099003', 'Brother'),
    ('b2222222-2222-2222-2222-222222222222', 'dindi_malak', 'Aparna Gaikwad (Spouse)', '+91 9822099004', 'Spouse'),
    ('b3333333-3333-3333-3333-333333333333', 'dindi_malak', 'Kavita Shinde', '+91 9822099005', 'Spouse'),
    ('b4444444-4444-4444-4444-444444444444', 'dindi_malak', 'Balasaheb Jagtap', '+91 9822099006', 'Brother'),
    ('b5555555-5555-5555-5555-555555555555', 'dindi_malak', 'Anand Deshmukh', '+91 9822099007', 'Son'),
    ('b6666666-6666-6666-6666-666666666666', 'dindi_malak', 'Ramesh Bhosale', '+91 9822099008', 'Brother'),
    ('b7777777-7777-7777-7777-777777777777', 'dindi_malak', 'Droupadi Kadam', '+91 9822099009', 'Spouse');

-- 6. Insert Plentiful Varkari Records (Pilgrims with full profiles across all 7 Varis)
INSERT INTO public.vari_varkaris (id, vari_id, full_name, mobile_number, village, medical_conditions, allergies, emergency_card_id, blood_group)
VALUES
    -- VARI 01 (Dehu)
    ('c1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111111', 'Tukaram Namdev More', '+91 9423010001', 'Indapur, Pune', 'None', 'None', 'VK-DEHU01', 'O+'),
    ('c1111111-1111-1111-1111-111111111102', 'a1111111-1111-1111-1111-111111111111', 'Shantabai Gyanoba Pawar', '+91 9423010002', 'Phaltan, Satara', 'Joint Pain / Arthritis', 'None', 'VK-DEHU02', 'B+'),
    ('c1111111-1111-1111-1111-111111111103', 'a1111111-1111-1111-1111-111111111111', 'Dnyandev Kashinath Kolhe', '+91 9423010003', 'Daund, Pune', 'Hypertension', 'Penicillin', 'VK-DEHU03', 'A+'),
    ('c1111111-1111-1111-1111-111111111104', 'a1111111-1111-1111-1111-111111111111', 'Anusaya Babanrao Raut', '+91 9423010004', 'Malshiras, Solapur', 'Diabetes', 'None', 'VK-DEHU04', 'AB+'),
    ('c1111111-1111-1111-1111-111111111105', 'a1111111-1111-1111-1111-111111111111', 'Sambhaji Mahadev Jadhav', '+91 9423010005', 'Karmala, Solapur', 'None', 'Dust', 'VK-DEHU05', 'O-'),
    ('c1111111-1111-1111-1111-111111111106', 'a1111111-1111-1111-1111-111111111111', 'Parvatibai Shankar Jagdale', '+91 9423010006', 'Baramati, Pune', 'Asthma', 'None', 'VK-DEHU06', 'B+'),
    ('c1111111-1111-1111-1111-111111111107', 'a1111111-1111-1111-1111-111111111111', 'Vitthal Sakharam Salunkhe', '+91 9423010007', 'Saswad, Pune', 'None', 'None', 'VK-DEHU07', 'A+'),
    ('c1111111-1111-1111-1111-111111111108', 'a1111111-1111-1111-1111-111111111111', 'Kamalbai Anandrao Shinde', '+91 9423010008', 'Wai, Satara', 'Mild Diabetes', 'None', 'VK-DEHU08', 'O+'),

    -- VARI 02 (Alandi)
    ('c2222222-2222-2222-2222-222222222201', 'a2222222-2222-2222-2222-222222222222', 'Nivruttinath Sopan Borade', '+91 9423020001', 'Sangamner, Ahmednagar', 'None', 'None', 'VK-ALN01', 'A+'),
    ('c2222222-2222-2222-2222-222222222202', 'a2222222-2222-2222-2222-222222222222', 'Godavari Laxman Gite', '+91 9423020002', 'Shrigonda, Ahmednagar', 'Cardiac Bypass (2022)', 'Aspirin', 'VK-ALN02', 'B-'),
    ('c2222222-2222-2222-2222-222222222203', 'a2222222-2222-2222-2222-222222222222', 'Baburao Hari Shirole', '+91 9423020003', 'Junnar, Pune', 'Asthma', 'None', 'VK-ALN03', 'O+'),
    ('c2222222-2222-2222-2222-222222222204', 'a2222222-2222-2222-2222-222222222222', 'Kusumtai Prabhakar Kale', '+91 9423020004', 'Khed, Pune', 'High BP', 'None', 'VK-ALN04', 'B+'),
    ('c2222222-2222-2222-2222-222222222205', 'a2222222-2222-2222-2222-222222222222', 'Rajaram Dashrath Thube', '+91 9423020005', 'Ambegaon, Pune', 'None', 'None', 'VK-ALN05', 'AB+'),
    ('c2222222-2222-2222-2222-222222222206', 'a2222222-2222-2222-2222-222222222222', 'Leelabai Vasantrao Deshmukh', '+91 9423020006', 'Rahuri, Ahmednagar', 'Arthritis', 'None', 'VK-ALN06', 'A-'),
    ('c2222222-2222-2222-2222-222222222207', 'a2222222-2222-2222-2222-222222222222', 'Dattatray Bhausaheb Wagh', '+91 9423020007', 'Nevasa, Ahmednagar', 'None', 'Dust', 'VK-ALN07', 'O+'),

    -- VARI 03 (Paithan)
    ('c3333333-3333-3333-3333-333333333301', 'a3333333-3333-3333-3333-333333333333', 'Kishor Dattatraya Joshi', '+91 9423030001', 'Georai, Beed', 'None', 'None', 'VK-PTH01', 'B+'),
    ('c3333333-3333-3333-3333-333333333302', 'a3333333-3333-3333-3333-333333333333', 'Sunanda Keshavrao Kale', '+91 9423030002', 'Ambad, Jalna', 'Low BP', 'None', 'VK-PTH02', 'A+'),
    ('c3333333-3333-3333-3333-333333333303', 'a3333333-3333-3333-3333-333333333333', 'Ganesh Mahadevrao Shelke', '+91 9423030003', 'Majalgaon, Beed', 'None', 'None', 'VK-PTH03', 'O+'),
    ('c3333333-3333-3333-3333-333333333304', 'a3333333-3333-3333-3333-333333333333', 'Sindhutai Vitthalrao Kute', '+91 9423030004', 'Shevgaon, Ahmednagar', 'Diabetes', 'None', 'VK-PTH04', 'B+'),
    ('c3333333-3333-3333-3333-333333333305', 'a3333333-3333-3333-3333-333333333333', 'Bhausaheb Ranganath Ghule', '+91 9423030005', 'Paithan Rural', 'Hypertension', 'Penicillin', 'VK-PTH05', 'AB+'),

    -- VARI 04 (Trimbakeshwar)
    ('c4444444-4444-4444-4444-444444444401', 'a4444444-4444-4444-4444-444444444444', 'Eknath Gangadhar Kale', '+91 9423040001', 'Yeola, Nashik', 'Hypertension', 'None', 'VK-TRM01', 'A-'),
    ('c4444444-4444-4444-4444-444444444402', 'a4444444-4444-4444-4444-444444444444', 'Saraswati Ramdas Patil', '+91 9423040002', 'Niphad, Nashik', 'None', 'None', 'VK-TRM02', 'O+'),
    ('c4444444-4444-4444-4444-444444444403', 'a4444444-4444-4444-4444-444444444444', 'Damodar Vishwanath Aher', '+91 9423040003', 'Deola, Nashik', 'Asthma (Mild)', 'Dust', 'VK-TRM03', 'B+'),
    ('c4444444-4444-4444-4444-444444444404', 'a4444444-4444-4444-4444-444444444444', 'Indirabai Govind Gorde', '+91 9423040004', 'Sinnar, Nashik', 'None', 'None', 'VK-TRM04', 'A+'),

    -- VARI 05 (Shegaon)
    ('c5555555-5555-5555-5555-555555555501', 'a5555555-5555-5555-5555-555555555555', 'Gopikabai Kisanrao Deshmukh', '+91 9423050001', 'Mehkar, Buldhana', 'Diabetes', 'None', 'VK-SHG01', 'B+'),
    ('c5555555-5555-5555-5555-555555555502', 'a5555555-5555-5555-5555-555555555555', 'Marotirao Shamrao Tayade', '+91 9423050002', 'Khamgaon, Buldhana', 'None', 'None', 'VK-SHG02', 'O+'),
    ('c5555555-5555-5555-5555-555555555503', 'a5555555-5555-5555-5555-555555555555', 'Sunita Pralhadrao Gawande', '+91 9423050003', 'Malkapur, Buldhana', 'Joint Stiffness', 'None', 'VK-SHG03', 'A+'),
    ('c5555555-5555-5555-5555-555555555504', 'a5555555-5555-5555-5555-555555555555', 'Gajanan Rambhau Bhatkar', '+91 9423050004', 'Shegaon Rural', 'None', 'None', 'VK-SHG04', 'AB+'),

    -- VARI 06 (Sajjangad)
    ('c6666666-6666-6666-6666-666666666601', 'a6666666-6666-6666-6666-666666666666', 'Pandurang Vithoba Shinde', '+91 9423060001', 'Wai, Satara', 'None', 'None', 'VK-SJG01', 'AB+'),
    ('c6666666-6666-6666-6666-666666666602', 'a6666666-6666-6666-6666-666666666666', 'Janakibai Ramchandra Kadam', '+91 9423060002', 'Koregaon, Satara', 'Hypertension', 'None', 'VK-SJG02', 'O+'),
    ('c6666666-6666-6666-6666-666666666603', 'a6666666-6666-6666-6666-666666666666', 'Bhimrao Yashwantrao More', '+91 9423060003', 'Karad, Satara', 'None', 'None', 'VK-SJG03', 'B+'),
    ('c6666666-6666-6666-6666-666666666604', 'a6666666-6666-6666-6666-666666666666', 'Laxmibai Anandrao Ghorpade', '+91 9423060004', 'Patan, Satara', 'Mild Asthma', 'None', 'VK-SJG04', 'A+'),

    -- VARI 07 (Saswad)
    ('c7777777-7777-7777-7777-777777777701', 'a7777777-7777-7777-7777-777777777777', 'Muktatai Sopanrao Kadam', '+91 9423070001', 'Saswad, Pune', 'None', 'None', 'VK-SSW01', 'O+'),
    ('c7777777-7777-7777-7777-777777777702', 'a7777777-7777-7777-7777-777777777777', 'Govindrao Keshavrao Jagtap', '+91 9423070002', 'Purandar, Pune', 'Diabetes', 'None', 'VK-SSW02', 'B+'),
    ('c7777777-7777-7777-7777-777777777703', 'a7777777-7777-7777-7777-777777777777', 'Sumanbai Ramdas Borawake', '+91 9423070003', 'Jejuri, Pune', 'None', 'None', 'VK-SSW03', 'A+'),
    ('c7777777-7777-7777-7777-777777777704', 'a7777777-7777-7777-7777-777777777777', 'Namdev Bhikaji Phadtare', '+91 9423070004', 'Bhor, Pune', 'Low BP', 'None', 'VK-SSW04', 'O-');

-- 7. Varkari Emergency Contacts (Structured child relationship)
INSERT INTO public.vari_actor_emergency_contacts (actor_id, actor_type, name, phone_number, relationship)
VALUES
    ('c1111111-1111-1111-1111-111111111101', 'varkari', 'Namdev More (Father)', '+91 9423090001', 'Father'),
    ('c1111111-1111-1111-1111-111111111101', 'varkari', 'Sunita More (Spouse)', '+91 9423090002', 'Spouse'),
    ('c1111111-1111-1111-1111-111111111102', 'varkari', 'Sachin Pawar (Son)', '+91 9423090003', 'Son'),
    ('c1111111-1111-1111-1111-111111111103', 'varkari', 'Sarika Kolhe (Wife)', '+91 9423090004', 'Spouse'),
    ('c1111111-1111-1111-1111-111111111104', 'varkari', 'Babanrao Raut (Husband)', '+91 9423090005', 'Spouse'),
    ('c1111111-1111-1111-1111-111111111105', 'varkari', 'Dipak Jadhav (Brother)', '+91 9423090006', 'Brother'),
    ('c1111111-1111-1111-1111-111111111106', 'varkari', 'Shankar Jagdale (Husband)', '+91 9423090007', 'Spouse'),
    ('c1111111-1111-1111-1111-111111111107', 'varkari', 'Ramesh Salunkhe (Son)', '+91 9423090008', 'Son'),
    ('c2222222-2222-2222-2222-222222222201', 'varkari', 'Sunil Borade (Son)', '+91 9423090011', 'Son'),
    ('c2222222-2222-2222-2222-222222222202', 'varkari', 'Dr. Anand Gite (Son)', '+91 9423090012', 'Son'),
    ('c2222222-2222-2222-2222-222222222203', 'varkari', 'Hari Shirole (Father)', '+91 9423090013', 'Father'),
    ('c2222222-2222-2222-2222-222222222204', 'varkari', 'Prabhakar Kale (Spouse)', '+91 9423090014', 'Spouse'),
    ('c3333333-3333-3333-3333-333333333301', 'varkari', 'Dattatraya Joshi (Father)', '+91 9423090021', 'Father'),
    ('c3333333-3333-3333-3333-333333333302', 'varkari', 'Keshavrao Kale (Husband)', '+91 9423090022', 'Spouse'),
    ('c4444444-4444-4444-4444-444444444401', 'varkari', 'Gangadhar Kale (Father)', '+91 9423090031', 'Father'),
    ('c4444444-4444-4444-4444-444444444402', 'varkari', 'Ramdas Patil (Husband)', '+91 9423090032', 'Spouse'),
    ('c5555555-5555-5555-5555-555555555501', 'varkari', 'Kisanrao Deshmukh (Spouse)', '+91 9423090041', 'Spouse'),
    ('c6666666-6666-6666-6666-666666666601', 'varkari', 'Vithoba Shinde (Father)', '+91 9423090051', 'Father'),
    ('c7777777-7777-7777-7777-777777777701', 'varkari', 'Sopanrao Kadam (Husband)', '+91 9423090061', 'Spouse');

-- 8. Insert Plentiful Volunteer Records (Field Coordinators & Safety Stewards)
INSERT INTO public.vari_volunteers (vari_id, full_name, mobile_number, village, medical_conditions, allergies)
VALUES
    -- Vari 01
    ('a1111111-1111-1111-1111-111111111111', 'Abhishek Sanjay Chavan', '+91 8888010001', 'Hadapsar, Pune', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Pranav Mohan Deshpande', '+91 8888010002', 'Kothrud, Pune', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Tanmay Vinayak Joshi', '+91 8888010003', 'Dehu Gaon, Pune', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Pooja Rajesh Shinde', '+91 8888010004', 'Dapodi, Pune', 'None', 'None'),

    -- Vari 02
    ('a2222222-2222-2222-2222-222222222222', 'Swapnil Ashok Shinde', '+91 8888020001', 'Bhosari, PCMC', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Rutuja Vikas Kulkarni', '+91 8888020002', 'Nigdi, PCMC', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Akash Balasaheb Gade', '+91 8888020003', 'Alandi, Pune', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Priyanka Sunil Jadhav', '+91 8888020004', 'Chikhali, PCMC', 'None', 'None'),

    -- Vari 03
    ('a3333333-3333-3333-3333-333333333333', 'Mahesh Balasaheb Thorat', '+91 8888030001', 'Aurangabad City', 'None', 'None'),
    ('a3333333-3333-3333-3333-333333333333', 'Kailas Bhagwat More', '+91 8888030002', 'Paithan, Chh. Sambhajinagar', 'None', 'None'),

    -- Vari 04
    ('a4444444-4444-4444-4444-444444444444', 'Ganesh Vishnu Gaidhani', '+91 8888040001', 'Nashik Road', 'None', 'None'),
    ('a4444444-4444-4444-4444-444444444444', 'Sachin Devidas Shinde', '+91 8888040002', 'Trimbakeshwar Rural', 'None', 'None'),

    -- Vari 05
    ('a5555555-5555-5555-5555-555555555555', 'Vishal Devidas Ingle', '+91 8888050001', 'Akola', 'None', 'None'),
    ('a5555555-5555-5555-5555-555555555555', 'Nilesh Gajanan Wagh', '+91 8888050002', 'Shegaon, Buldhana', 'None', 'None'),

    -- Vari 06
    ('a6666666-6666-6666-6666-666666666666', 'Kiran Anandrao Jagtap', '+91 8888060001', 'Karad, Satara', 'None', 'None'),
    ('a6666666-6666-6666-6666-666666666666', 'Suraj Chandrakant Patil', '+91 8888060002', 'Satara City', 'None', 'None'),

    -- Vari 07
    ('a7777777-7777-7777-7777-777777777777', 'Omkar Dnyaneshwar Borawake', '+91 8888070001', 'Saswad, Pune', 'None', 'None'),
    ('a7777777-7777-7777-7777-777777777777', 'Harshal Bhausaheb Jagdale', '+91 8888070002', 'Jejuri, Pune', 'None', 'None');

-- 9. Insert Plentiful Medical Staff Records (Doctors, Specialists & Nurses across Varis)
INSERT INTO public.vari_medical_staff (vari_id, full_name, mobile_number, village, specialization, medical_conditions, allergies)
VALUES
    -- Vari 01
    ('a1111111-1111-1111-1111-111111111111', 'Dr. Vinayak R. Kulkarni (MD)', '+91 9922010001', 'Shivajinagar, Pune', 'Cardiology & Resuscitation', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Sister Maya Daniel (RN)', '+91 9922010002', 'Camp, Pune', 'Nursing & First Aid Response', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Dr. Shrikant Anil Joshi (MS Ortho)', '+91 9922010003', 'Aundh, Pune', 'Orthopedics & Heat Exhaustion', 'None', 'None'),
    ('a1111111-1111-1111-1111-111111111111', 'Pharmacist Deepak S. More', '+91 9922010004', 'Nigdi, Pune', 'Pharmacology & Medication Dispatch', 'None', 'None'),

    -- Vari 02
    ('a2222222-2222-2222-2222-222222222222', 'Dr. Rajeshwari P. Salunke (MS)', '+91 9922020001', 'Alandi Devachi', 'General Emergency & Trauma', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Dr. Amit Hemant Joshi (BAMS)', '+91 9922020002', 'Chakan, Pune', 'Orthopedics & Heat Exhaustion', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Sister Anjali Mohan Jagtap (RN)', '+91 9922020003', 'Moshi, PCMC', 'Nursing & First Aid Response', 'None', 'None'),
    ('a2222222-2222-2222-2222-222222222222', 'Dr. Samir Jayant Deshmukh (MD)', '+91 9922020004', 'Bhosari, PCMC', 'Cardiology & Resuscitation', 'None', 'None'),

    -- Vari 03
    ('a3333333-3333-3333-3333-333333333333', 'Dr. Sandeep Narayanrao Patil', '+91 9922030001', 'Paithan Rural Hospital', 'Pharmacology & Medication Dispatch', 'None', 'None'),
    ('a3333333-3333-3333-3333-333333333333', 'Dr. Vaishali Eknath Shinde', '+91 9922030002', 'Aurangabad Civil', 'General Emergency & Trauma', 'None', 'None'),

    -- Vari 04
    ('a4444444-4444-4444-4444-444444444444', 'Dr. Sneha Milind Bhalerao', '+91 9922040001', 'Nashik Civil Hospital', 'General Emergency & Trauma', 'None', 'None'),
    ('a4444444-4444-4444-4444-444444444444', 'Sister Rekha Balu Gaikwad', '+91 9922040002', 'Trimbak Health Center', 'Nursing & First Aid Response', 'None', 'None'),

    -- Vari 05
    ('a5555555-5555-5555-5555-555555555555', 'Dr. Prashant Govindrao Wankhede', '+91 9922050001', 'Shegaon Rural Medical Center', 'Cardiology & Resuscitation', 'None', 'None'),
    ('a5555555-5555-5555-5555-555555555555', 'Dr. Arvind Keshavrao Deshmukh', '+91 9922050002', 'Khamgaon Hospital', 'Orthopedics & Heat Exhaustion', 'None', 'None'),

    -- Vari 06
    ('a6666666-6666-6666-6666-666666666666', 'Dr. Mohan Shridhar Dixit', '+91 9922060001', 'Satara Civil Hospital', 'Orthopedics & Heat Exhaustion', 'None', 'None'),
    ('a6666666-6666-6666-6666-666666666666', 'Dr. Pratibha Ramesh Bhosale', '+91 9922060002', 'Patan Rural Hospital', 'Cardiology & Resuscitation', 'None', 'None'),

    -- Vari 07
    ('a7777777-7777-7777-7777-777777777777', 'Sister Rekha Suresh Jagtap', '+91 9922070001', 'Saswad Primary Health Center', 'Nursing & First Aid Response', 'None', 'None'),
    ('a7777777-7777-7777-7777-777777777777', 'Dr. Nitin Dattatray Kadam', '+91 9922070002', 'Purandar Sub-District Hospital', 'General Emergency & Trauma', 'None', 'None');
