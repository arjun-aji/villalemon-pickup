-- =====================================================================
-- VillaLemon Pickup: Initial Seed Data from Excel Workbook
-- Perfectly matched to supabase/migrations/002_complete_varkala_schema.sql
-- =====================================================================

-- 1. Update business name in system settings
UPDATE public.system_settings 
SET business_name = 'VillaLemon Pickup',
    phone = '919048279460',
    email = 'villalemonhometay@gmail.com'
WHERE id IS NOT NULL;

-- 2. Organizations / Clients from Excel
INSERT INTO public.organizations (
    name, 
    type, 
    contact_person, 
    phone, 
    whatsapp, 
    email, 
    billing_address, 
    payment_terms, 
    credit_limit, 
    is_active
)
VALUES
  ('Villa Lemon', 'Hotel / Homestay', 'Monkutty', '9048279460', '9048279460', 'villalemonhometay@gmail.com', 'Villa lemon Varkala', 'Monthly settlement', 100000.00, true),
  ('Panchavadi', 'Hotel / Homestay', 'Annapurna', '7428998752', '7428998752', NULL, 'Panchavadi, Varkala', 'Weekly settlement', 100000.00, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Fleet Vehicles from Excel
INSERT INTO public.vehicles (
    registration_number, 
    vehicle_type, 
    passenger_capacity, 
    ownership, 
    owner_supplier_name, 
    supplier_phone, 
    insurance_expiry, 
    permit_expiry, 
    fitness_certificate_expiry, 
    puc_expiry, 
    status
)
VALUES
  ('KL 81 D 1478', 'Ertiga', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available'),
  ('Kl 16 Q 7965', 'Sedan', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available')
ON CONFLICT (registration_number) DO NOTHING;

-- 4. Drivers from Excel
INSERT INTO public.drivers (
    full_name, 
    phone, 
    driving_licence_no, 
    licence_expiry, 
    employment_type, 
    monthly_salary, 
    per_trip_payment, 
    status
)
VALUES
  ('Monkutty', '919048279460', '11111111', '2029-12-12', 'Per-trip payment', 0.00, 500.00, 'Active'),
  ('Bimal', '918086066992', '222222', '2029-11-11', 'Salaried (monthly)', 0.00, 500.00, 'Active')
ON CONFLICT (phone) DO NOTHING;

-- 5. Real Trips from Excel
INSERT INTO public.trips (
  trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category,
  guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
  required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
  trip_selling_price, trip_status, amount_driver_must_collect, collection_rule,
  driver_trip_pay_override
)
SELECT
  'VH-0001',
  o.id,
  'Shahid',
  '2026-11-10',
  '16:00:00',
  'Sightseeing'::trip_category,
  'Iva',
  4,
  'Villa lemon INN',
  'Anjengo fort And Light House',
  'Nil',
  'Sedan'::vehicle_type,
  '2 hours sightseeing tour',
  d.id,
  v.id,
  1800.00,
  'Completed'::trip_status,
  1800.00,
  'Collect'::collection_rule,
  500.00
FROM organizations o
CROSS JOIN drivers d
CROSS JOIN vehicles v
WHERE o.name = 'Villa Lemon' 
  AND d.full_name = 'Bimal' 
  AND v.registration_number = 'Kl 16 Q 7965'
ON CONFLICT (trip_number) DO NOTHING;

INSERT INTO public.trips (
  trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category,
  guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
  airport_terminal, required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
  trip_selling_price, trip_status, amount_driver_must_collect, collection_rule,
  driver_trip_pay_override
)
SELECT
  'VH-0002',
  o.id,
  'Annapurna',
  '2026-11-11',
  '18:55:00',
  'Airport Pick-up'::trip_category,
  'Davydova Iuliia',
  1,
  'Terminal 1',
  'Panchavadi',
  'AL 2565',
  'Terminal 1'::airport_terminal,
  'Sedan'::vehicle_type,
  'Call Annapurna 20 min before',
  d.id,
  v.id,
  2300.00,
  'Confirmed'::trip_status,
  0.00,
  'Do not collect'::collection_rule,
  500.00
FROM organizations o
CROSS JOIN drivers d
CROSS JOIN vehicles v
WHERE o.name = 'Panchavadi' 
  AND d.full_name = 'Bimal' 
  AND v.registration_number = 'Kl 16 Q 7965'
ON CONFLICT (trip_number) DO NOTHING;

INSERT INTO public.trips (
  trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category,
  guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
  airport_terminal, required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
  trip_selling_price, trip_status, amount_driver_must_collect, collection_rule,
  driver_trip_pay_override
)
SELECT
  'VH-0003',
  o.id,
  'Shahid',
  '2026-11-11',
  '19:45:00',
  'Airport Pick-up'::trip_category,
  'Liudmila Novikova,Matveeva Iuliia',
  1,
  'Airport ,Terminal 2',
  'Villa lemon INN',
  '3L 248',
  'Terminal 2'::airport_terminal,
  'Ertiga'::vehicle_type,
  'One person will arrive on this flight, another waiting at airport',
  d.id,
  v.id,
  2300.00,
  'Confirmed'::trip_status,
  0.00,
  'Do not collect'::collection_rule,
  500.00
FROM organizations o
CROSS JOIN drivers d
CROSS JOIN vehicles v
WHERE o.name = 'Villa Lemon' 
  AND d.full_name = 'Bimal' 
  AND v.registration_number = 'KL 81 D 1478'
ON CONFLICT (trip_number) DO NOTHING;

INSERT INTO public.trips (
  trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category,
  guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
  required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
  trip_selling_price, trip_status, amount_driver_must_collect, collection_rule,
  driver_trip_pay_override
)
SELECT
  'VH-0004',
  o.id,
  'Shahid',
  '2026-11-12',
  '18:00:00',
  'Airport Drop'::trip_category,
  'Iva and family',
  5,
  'Villa lemon INN',
  'Airport',
  'Nil',
  'Sedan'::vehicle_type,
  'Terminals Confirm with passenger',
  d.id,
  v.id,
  2300.00,
  'Confirmed'::trip_status,
  0.00,
  'Do not collect'::collection_rule,
  500.00
FROM organizations o
CROSS JOIN drivers d
CROSS JOIN vehicles v
WHERE o.name = 'Villa Lemon' 
  AND d.full_name = 'Bimal' 
  AND v.registration_number = 'Kl 16 Q 7965'
ON CONFLICT (trip_number) DO NOTHING;

INSERT INTO public.trips (
  trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category,
  guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
  airport_terminal, required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
  trip_selling_price, trip_status, amount_driver_must_collect, collection_rule,
  driver_trip_pay_override
)
SELECT
  'VH-0005',
  o.id,
  'Inga',
  '2026-11-17',
  '06:00:00',
  'Airport Drop'::trip_category,
  'Inga',
  1,
  'Villa lemon INN',
  'Airport , Terminal 2',
  'Nil',
  'Terminal 2'::airport_terminal,
  'Sedan'::vehicle_type,
  'Terminals Confirm with passenger',
  d.id,
  v.id,
  2300.00,
  'Confirmed'::trip_status,
  0.00,
  'Do not collect'::collection_rule,
  500.00
FROM organizations o
CROSS JOIN drivers d
CROSS JOIN vehicles v
WHERE o.name = 'Villa Lemon' 
  AND d.full_name = 'Bimal' 
  AND v.registration_number = 'Kl 16 Q 7965'
ON CONFLICT (trip_number) DO NOTHING;
