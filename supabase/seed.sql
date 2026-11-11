-- ============================================================================
-- OPTIONAL DEVELOPMENT SEED DATA (EXACT RECORDS FROM EXCEL WORKBOOK)
-- Run this ONLY if you want to populate the initial sample data from the workbook.
-- Do NOT run in empty production.
-- ============================================================================

-- 1. Sample Organizations
INSERT INTO organizations (id, name, type, contact_person, phone, whatsapp, email, billing_address, payment_terms, credit_limit)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Villa Lemon ', 'Hotel / Homestay', 'Monkutty', '9048279460', '9048279460', 'villalemonhometay@gmail.com', 'Villa lemon Varkala', 'Monthly settlement', 100000.00),
    ('22222222-2222-2222-2222-222222222222', 'Panchavadi', 'Hotel / Homestay', 'Annapurna', '7428998752', '7428998752', NULL, 'Panchavadi', 'Weekly settlement', 100000.00)
ON CONFLICT (name) DO NOTHING;

-- 2. Sample Drivers
INSERT INTO drivers (id, full_name, phone, driving_licence_no, licence_expiry, employment_type, monthly_salary, per_trip_payment, status)
VALUES 
    ('33333333-3333-3333-3333-333333333333', 'Bimal', '918086066992', '222222', '2029-11-11', 'Salaried (monthly)', 0.00, 0.00, 'Active'),
    ('44444444-4444-4444-4444-444444444444', 'Monkutty', '919048279460', '11111111', '2029-12-12', 'Per-trip payment', 0.00, 0.00, 'Active')
ON CONFLICT (phone) DO NOTHING;

-- 3. Sample Vehicles
INSERT INTO vehicles (id, registration_number, vehicle_type, passenger_capacity, ownership, owner_supplier_name, supplier_phone, insurance_expiry, permit_expiry, fitness_certificate_expiry, puc_expiry, status)
VALUES 
    ('55555555-5555-5555-5555-555555555555', 'Kl 16 Q 7965', 'Sedan', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available'),
    ('66666666-6666-6666-6666-666666666666', 'KL 81 D 1478', 'Ertiga', 6, 'Own', 'Shahid', '9048279460', '2029-12-12', '2029-12-12', '2029-12-12', '2029-12-12', 'Available')
ON CONFLICT (registration_number) DO NOTHING;

-- 4. Sample Trips (from workbook Trips sheet)
INSERT INTO trips (
    id, trip_number, organization_id, ordered_by, trip_date, pickup_time, trip_category, guest_names, total_people,
    pickup_location, dropoff_location, flight_number_and_time, required_cab_type, special_instructions,
    assigned_driver_id, assigned_vehicle_id, trip_selling_price, amount_driver_must_collect, collection_rule,
    driver_trip_pay_override, airport_terminal, final_dropoff, trip_status
)
VALUES 
    (
        '77777777-7777-7777-7777-777777777771', 'VH-0001', '11111111-1111-1111-1111-111111111111', 'Shahid', '2026-11-10', '16:00:00', 'Sightseeing', 'Iva', 4,
        'Villa lemon INN', 'Anjengo fort And Light House', 'Nil', 'Sedan', '2 hours',
        '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 1800.00, 1800.00, 'Collect',
        500.00, NULL, 'Return to pickup point', 'Confirmed'
    ),
    (
        '77777777-7777-7777-7777-777777777772', 'VH-0002', '22222222-2222-2222-2222-222222222222', 'Annapurna', '2026-11-11', '18:55:00', 'Airport Pick-up', 'Davydova Iuliia', 1,
        'Teminal 1 ', 'Panchavadi', 'AL 2565', 'Sedan', 'Call Annapurna 20 min before',
        '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 2300.00, 0.00, 'Do not collect',
        500.00, 'Terminal 1', 'Panchavdi', 'Confirmed'
    ),
    (
        '77777777-7777-7777-7777-777777777773', 'VH-0003', '11111111-1111-1111-1111-111111111111', 'Shahid', '2026-11-11', '19:45:00', 'Airport Pick-up', 'Liudmila Novikova,Matveeva Iuliia', 1,
        'Airport ,Terminal 2', 'Villa lemon INN', '3L 248', 'Ertiga', 'One person will arrive on this flight , Another person will wait at airport ',
        '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 2300.00, 0.00, 'Do not collect',
        500.00, 'Terminal 2', 'Villa lemon inn ', 'Confirmed'
    ),
    (
        '77777777-7777-7777-7777-777777777774', 'VH-0004', '11111111-1111-1111-1111-111111111111', 'Shahid', '2026-11-12', '18:00:00', 'Airport Drop', 'Iva and family', 5,
        'Villa lemon INN', 'Airport', 'Nil', 'Sedan', 'Terminals Confirm with passenger',
        '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 2300.00, 0.00, 'Do not collect',
        500.00, 'Terminal 2', NULL, 'Confirmed'
    ),
    (
        '77777777-7777-7777-7777-777777777775', 'VH-0005', '11111111-1111-1111-1111-111111111111', 'Inga', '2026-11-17', '06:00:00', 'Airport Drop', 'Inga', 1,
        'Villa lemon INN', 'Airport , Terminal 2', NULL, 'Sedan', 'Terminals Confirm with passenger',
        '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 2300.00, 0.00, 'Do not collect',
        NULL, 'Terminal 2', NULL, 'Confirmed'
    )
ON CONFLICT (trip_number) DO NOTHING;

-- 5. Sample Driver Report (from Driver Reports sheet for VH-0001)
INSERT INTO driver_reports (
    receipt_number, trip_id, driver_id, amount_collected, diesel_expense, parking_toll_permits_tickets_food,
    workshop_expense, check_status
)
VALUES (
    'DR-0001', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333333', 1800.00, 500.00, 0.00, 0.00, 'Checked'
)
ON CONFLICT (receipt_number) DO NOTHING;
