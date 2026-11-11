-- =====================================================================
-- VillaLemon Pickup: Initial Seed Data from Excel Workbook
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnvknruutfrmwyrbhdjq/sql/new
-- =====================================================================

-- 1. Initial System Settings
INSERT INTO public.system_settings (id, business_name, phone, email, address, alert_lead_days_docs, default_credit_limit, auto_trip_id_prefix)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'VillaLemon Pickup',
  '+91 90482 79460',
  'villalemonhometay@gmail.com',
  'Varkala Cliff / Beach Road, Varkala, Kerala',
  30,
  100000.00,
  'VH'
)
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  phone = EXCLUDED.phone;

-- 2. Organizations / Clients from Excel
INSERT INTO public.organizations (name, organization_type, contact_person, phone, whatsapp, email, billing_address, payment_terms, credit_limit, status)
VALUES
  ('Villa Lemon', 'Hotel / Homestay', 'Monkutty', '9048279460', '9048279460', 'villalemonhometay@gmail.com', 'Villa lemon Varkala', 'Monthly settlement', 100000.00, 'Active'),
  ('Panchavadi', 'Hotel / Homestay', 'Annapurna', '7428998752', '7428998752', NULL, 'Panchavadi, Varkala', 'Weekly settlement', 100000.00, 'Active')
ON CONFLICT (name) DO NOTHING;

-- 3. Fleet Vehicles from Excel
INSERT INTO public.vehicles (registration_number, vehicle_type, passenger_capacity, ownership, owner_supplier, supplier_phone, insurance_expiry, permit_expiry, fitness_certificate_expiry, puc_expiry, status)
VALUES
  ('KL 81 D 1478', 'Ertiga', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available'),
  ('Kl 16 Q 7965', 'Sedan', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available')
ON CONFLICT (registration_number) DO NOTHING;

-- 4. Drivers from Excel
INSERT INTO public.drivers (full_name, phone, driving_licence_number, licence_expiry, employment_type, monthly_salary, per_trip_payment, status)
VALUES
  ('Monkutty', '919048279460', '11111111', '2029-12-12', 'Per-trip payment', 0.00, 500.00, 'Active'),
  ('Bimal', '918086066992', '222222', '2029-11-11', 'Salaried (monthly)', 0.00, 500.00, 'Active')
ON CONFLICT (phone) DO NOTHING;

-- 5. Sample Initial Trips from Excel
DO $$
DECLARE
  v_org_villa UUID;
  v_org_pancha UUID;
  v_drv_bimal UUID;
  v_veh_ertiga UUID;
  v_veh_sedan UUID;
BEGIN
  SELECT id INTO v_org_villa FROM public.organizations WHERE name = 'Villa Lemon' LIMIT 1;
  SELECT id INTO v_org_pancha FROM public.organizations WHERE name = 'Panchavadi' LIMIT 1;
  SELECT id INTO v_drv_bimal FROM public.drivers WHERE full_name = 'Bimal' LIMIT 1;
  SELECT id INTO v_veh_ertiga FROM public.vehicles WHERE registration_number = 'KL 81 D 1478' LIMIT 1;
  SELECT id INTO v_veh_sedan FROM public.vehicles WHERE registration_number = 'Kl 16 Q 7965' LIMIT 1;

  -- VH-0001 (Completed Sightseeing)
  INSERT INTO public.trips (
    trip_id, organization_id, ordered_by, trip_date, pickup_time, trip_category,
    guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
    required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
    trip_selling_price, trip_status, amount_driver_must_collect, collected_by_driver,
    collection_status, driver_trip_pay_override
  ) VALUES (
    'VH-0001', v_org_villa, 'Shahid', '2026-11-10', '16:00:00', 'Sightseeing',
    'Iva', 4, 'Villa lemon INN', 'Anjengo fort And Light House', 'Nil',
    'Sedan', '2 hours sightseeing tour', v_drv_bimal, v_veh_sedan,
    1800.00, 'Completed', 1800.00, 1800.00,
    'Collected', 500.00
  ) ON CONFLICT (trip_id) DO NOTHING;

  -- VH-0002 (Confirmed Airport Pick-up)
  INSERT INTO public.trips (
    trip_id, organization_id, ordered_by, trip_date, pickup_time, trip_category,
    guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
    required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
    trip_selling_price, trip_status, amount_driver_must_collect, collected_by_driver,
    collection_status, driver_trip_pay_override
  ) VALUES (
    'VH-0002', v_org_pancha, 'Annapurna', '2026-11-11', '18:55:00', 'Airport Pick-up',
    'Davydova Iuliia', 1, 'Terminal 1', 'Panchavadi', 'AL 2565',
    'Sedan', 'Call Annapurna 20 min before', v_drv_bimal, v_veh_sedan,
    2300.00, 'Confirmed', 0.00, 0.00,
    'Do not collect', 500.00
  ) ON CONFLICT (trip_id) DO NOTHING;

  -- VH-0003 (Confirmed Airport Pick-up)
  INSERT INTO public.trips (
    trip_id, organization_id, ordered_by, trip_date, pickup_time, trip_category,
    guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
    required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
    trip_selling_price, trip_status, amount_driver_must_collect, collected_by_driver,
    collection_status, driver_trip_pay_override
  ) VALUES (
    'VH-0003', v_org_villa, 'Shahid', '2026-11-11', '19:45:00', 'Airport Pick-up',
    'Liudmila Novikova,Matveeva Iuliia', 1, 'Airport ,Terminal 2', 'Villa lemon INN', '3L 248',
    'Ertiga', 'One person will arrive on this flight, another waiting at airport', v_drv_bimal, v_veh_ertiga,
    2300.00, 'Confirmed', 0.00, 0.00,
    'Do not collect', 500.00
  ) ON CONFLICT (trip_id) DO NOTHING;

  -- VH-0004 (Confirmed Airport Drop)
  INSERT INTO public.trips (
    trip_id, organization_id, ordered_by, trip_date, pickup_time, trip_category,
    guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
    required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
    trip_selling_price, trip_status, amount_driver_must_collect, collected_by_driver,
    collection_status, driver_trip_pay_override
  ) VALUES (
    'VH-0004', v_org_villa, 'Shahid', '2026-11-12', '18:00:00', 'Airport Drop',
    'Iva and family', 5, 'Villa lemon INN', 'Airport', 'Nil',
    'Sedan', 'Terminals Confirm with passenger', v_drv_bimal, v_veh_sedan,
    2300.00, 'Confirmed', 0.00, 0.00,
    'Do not collect', 500.00
  ) ON CONFLICT (trip_id) DO NOTHING;

  -- VH-0005 (Confirmed Airport Drop)
  INSERT INTO public.trips (
    trip_id, organization_id, ordered_by, trip_date, pickup_time, trip_category,
    guest_names, total_people, pickup_location, dropoff_location, flight_number_and_time,
    required_cab_type, special_instructions, assigned_driver_id, assigned_vehicle_id,
    trip_selling_price, trip_status, amount_driver_must_collect, collected_by_driver,
    collection_status, driver_trip_pay_override
  ) VALUES (
    'VH-0005', v_org_villa, 'Inga', '2026-11-17', '06:00:00', 'Airport Drop',
    'Inga', 1, 'Villa lemon INN', 'Airport , Terminal 2', 'Nil',
    'Sedan', 'Terminals Confirm with passenger', v_drv_bimal, v_veh_sedan,
    2300.00, 'Confirmed', 0.00, 0.00,
    'Do not collect', 500.00
  ) ON CONFLICT (trip_id) DO NOTHING;

END $$;
