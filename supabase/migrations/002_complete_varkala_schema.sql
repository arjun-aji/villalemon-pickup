-- ============================================================================
-- VILLALEMON PICKUP — COMPLETE DATABASE SCHEMA (VARKALA HOLIDAYS ENGINE)
-- Generated to replace Varkala_Holidays_Taxi_System_with_your_data.xlsx
-- Covers all 20 worksheets, 3 portals (Admin, Driver, Organization),
-- Dual-Ledger Accounting, Automated Numbering, Views, and RLS.
-- ============================================================================

-- 1. CLEANUP EXISTING TABLES & TYPES (FRESH RESET)
DROP VIEW IF EXISTS v_vehicle_document_alerts CASCADE;
DROP VIEW IF EXISTS v_trip_financials CASCADE;
DROP VIEW IF EXISTS v_driver_balances CASCADE;
DROP VIEW IF EXISTS v_client_summary CASCADE;

DROP TABLE IF EXISTS backup_records CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_trips CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS driver_ledger CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS driver_reports CASCADE;
DROP TABLE IF EXISTS trip_enrollments CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop legacy tables if present
DROP TABLE IF EXISTS monthly_reports CASCADE;
DROP TABLE IF EXISTS trip_status_history CASCADE;
DROP TABLE IF EXISTS trip_settlements CASCADE;
DROP TABLE IF EXISTS trip_expenses CASCADE;
DROP TABLE IF EXISTS driver_employees CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS invoice_type CASCADE;
DROP TYPE IF EXISTS driver_ledger_entry_type CASCADE;
DROP TYPE IF EXISTS paid_by CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS expense_group CASCADE;
DROP TYPE IF EXISTS collection_rule CASCADE;
DROP TYPE IF EXISTS airport_terminal CASCADE;
DROP TYPE IF EXISTS trip_status CASCADE;
DROP TYPE IF EXISTS trip_category CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS vehicle_ownership CASCADE;
DROP TYPE IF EXISTS vehicle_type CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS driver_employment_type CASCADE;
DROP TYPE IF EXISTS payment_terms CASCADE;
DROP TYPE IF EXISTS organization_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUM DEFINITIONS (MATCHING SETTINGS WORKSHEET EXACTLY)
-- ============================================================================

CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'driver',
    'organization'
);

CREATE TYPE organization_type AS ENUM (
    'Travel agency',
    'Tour operator',
    'Hotel / Homestay',
    'Corporate',
    'Individual',
    'Other'
);

CREATE TYPE payment_terms AS ENUM (
    'Pay after each trip',
    'Weekly settlement',
    'Monthly settlement'
);

CREATE TYPE driver_employment_type AS ENUM (
    'Salaried (monthly)',
    'Per-trip payment'
);

CREATE TYPE driver_status AS ENUM (
    'Active',
    'Inactive'
);

CREATE TYPE vehicle_type AS ENUM (
    'Sedan',
    'SUV',
    'Innova',
    'Ertiga',
    'Tempo Traveller 17-seater',
    'Tempo Traveller 26-seater',
    'Other'
);

CREATE TYPE vehicle_ownership AS ENUM (
    'Own',
    'Hired'
);

CREATE TYPE vehicle_status AS ENUM (
    'Available',
    'On trip',
    'Under repair',
    'Inactive'
);

CREATE TYPE trip_category AS ENUM (
    'Airport Pick-up',
    'Airport Drop',
    'Sightseeing',
    'Drop Only at Location',
    'Pick-up from Location'
);

CREATE TYPE trip_status AS ENUM (
    'Pending Approval',
    'Confirmed',
    'Assigned',
    'In Progress',
    'Completed',
    'Cancelled'
);

CREATE TYPE airport_terminal AS ENUM (
    'Terminal 1',
    'Terminal 2'
);

CREATE TYPE collection_rule AS ENUM (
    'Collect',
    'Do not collect',
    'Ask office'
);

CREATE TYPE expense_group AS ENUM (
    'Trip',
    'Vehicle/Workshop',
    'Office',
    'Staff Salary',
    'Hired Vehicle'
);

CREATE TYPE payment_method AS ENUM (
    'Cash',
    'UPI',
    'Bank transfer',
    'Card',
    'Cheque'
);

CREATE TYPE paid_by AS ENUM (
    'Office',
    'Driver'
);

CREATE TYPE driver_ledger_entry_type AS ENUM (
    'Salary due',
    'Advance',
    'Deduction',
    'Payment made',
    'Money sent for expenses',
    'Cash handed to office'
);

CREATE TYPE invoice_type AS ENUM (
    'Trip invoice',
    'Weekly invoice',
    'Monthly invoice'
);

CREATE TYPE invoice_status AS ENUM (
    'Draft',
    'Issued',
    'Cancelled'
);

-- ============================================================================
-- 3. CORE ENTITY TABLES
-- ============================================================================

-- A. PROFILES (Extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'organization',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. ORGANIZATIONS (Clients worksheet)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type organization_type NOT NULL DEFAULT 'Hotel / Homestay',
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    billing_address TEXT,
    gst_number TEXT,
    payment_terms payment_terms NOT NULL DEFAULT 'Monthly settlement',
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 100000.00,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. ORGANIZATION USERS (Multi-tenant partner login mapping)
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    can_submit_trips BOOLEAN NOT NULL DEFAULT TRUE,
    can_view_financials BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, profile_id)
);

-- D. DRIVERS (Drivers worksheet)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    driving_licence_no TEXT NOT NULL,
    licence_expiry DATE,
    employment_type driver_employment_type NOT NULL DEFAULT 'Per-trip payment',
    monthly_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    per_trip_payment DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_arrangement_notes TEXT,
    status driver_status NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- E. VEHICLES (Vehicles worksheet)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT UNIQUE NOT NULL,
    vehicle_type vehicle_type NOT NULL DEFAULT 'Sedan',
    passenger_capacity INT NOT NULL DEFAULT 4,
    ownership vehicle_ownership NOT NULL DEFAULT 'Own',
    owner_supplier_name TEXT,
    supplier_phone TEXT,
    insurance_expiry DATE,
    permit_expiry DATE,
    fitness_certificate_expiry DATE,
    puc_expiry DATE,
    status vehicle_status NOT NULL DEFAULT 'Available',
    document_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- F. TRIPS (Trips worksheet - 38 columns reproduced)
CREATE SEQUENCE IF NOT EXISTS trip_seq START WITH 1;

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_number TEXT UNIQUE NOT NULL, -- e.g. VH-0001
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    ordered_by TEXT NOT NULL,
    trip_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    trip_category trip_category NOT NULL,
    guest_names TEXT NOT NULL,
    guest_contact_number TEXT,
    total_people INT NOT NULL DEFAULT 1,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    final_dropoff TEXT, -- Blank = return to pickup point (sightseeing)
    flight_number_and_time TEXT,
    airport_terminal airport_terminal,
    required_cab_type vehicle_type NOT NULL DEFAULT 'Sedan',
    special_instructions TEXT,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    trip_selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    amount_driver_must_collect DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    collection_rule collection_rule NOT NULL DEFAULT 'Do not collect',
    driver_trip_pay_override DECIMAL(10,2), -- Blank = use driver's standard per-trip rate
    trip_status trip_status NOT NULL DEFAULT 'Pending Approval',
    is_published_for_enrollment BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_by_org BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate VH-0001 trip numbers
CREATE OR REPLACE FUNCTION generate_trip_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trip_number IS NULL OR NEW.trip_number = '' THEN
        NEW.trip_number := 'VH-' || LPAD(nextval('trip_seq')::TEXT, 4, '0');
    END IF;
    
    -- Auto-derive collection_rule
    IF NEW.amount_driver_must_collect > 0 THEN
        NEW.collection_rule := 'Collect';
    ELSE
        NEW.collection_rule := 'Do not collect';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_trip_number
BEFORE INSERT ON trips
FOR EACH ROW EXECUTE FUNCTION generate_trip_number();

-- G. TRIP ENROLLMENTS (Driver portal available trip enrollment)
CREATE TABLE trip_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(trip_id, driver_id)
);

-- H. DRIVER REPORTS (Driver Reports & Form Responses 1 worksheets)
CREATE SEQUENCE IF NOT EXISTS driver_report_seq START WITH 1;

CREATE TABLE driver_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL, -- e.g. DR-0001
    trip_id UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount_collected DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    collection_difference_note TEXT,
    diesel_expense DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    parking_toll_permits_tickets_food DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    other_expenses_details TEXT,
    workshop_expense DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    workshop_details TEXT,
    receipt_photo_url TEXT,
    check_status TEXT NOT NULL DEFAULT 'Pending check', -- 'Checked', 'Pending check'
    admin_verification_note TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_driver_report_receipt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'DR-' || LPAD(nextval('driver_report_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_driver_report_receipt
BEFORE INSERT ON driver_reports
FOR EACH ROW EXECUTE FUNCTION generate_driver_report_receipt();

-- I. EXPENSES (Expenses worksheet - Office & Non-driver payments)
CREATE SEQUENCE IF NOT EXISTS expense_seq START WITH 1;

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number TEXT UNIQUE NOT NULL, -- e.g. EXP-0001
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expense_group expense_group NOT NULL DEFAULT 'Trip',
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method payment_method NOT NULL DEFAULT 'Cash',
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    paid_by paid_by NOT NULL DEFAULT 'Office',
    receipt_url TEXT,
    check_status TEXT NOT NULL DEFAULT 'Pending check',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expense_number IS NULL OR NEW.expense_number = '' THEN
        NEW.expense_number := 'EXP-' || LPAD(nextval('expense_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_expense_number
BEFORE INSERT ON expenses
FOR EACH ROW EXECUTE FUNCTION generate_expense_number();

-- J. DRIVER LEDGER (Driver Ledger worksheet - Dual Accounting Engine)
CREATE TABLE driver_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    entry_type driver_ledger_entry_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- K. INVOICES & INVOICE TRIPS (Bills worksheet)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1;

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL, -- e.g. INV-2611-001
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    invoice_type invoice_type NOT NULL DEFAULT 'Monthly invoice',
    period_from DATE,
    period_to DATE,
    status invoice_status NOT NULL DEFAULT 'Draft',
    notes TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYMM') || '-' || LPAD(nextval('invoice_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Invoiced trips junction (prevents duplicate invoicing of any trip)
CREATE TABLE invoice_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    trip_id UUID UNIQUE NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- L. PAYMENTS (Payments & Receipt worksheets)
CREATE SEQUENCE IF NOT EXISTS payment_seq START WITH 1;

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT UNIQUE NOT NULL, -- e.g. REC-0001
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount_received DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'Bank transfer',
    reference_notes TEXT,
    received_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_payment_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'REC-' || LPAD(nextval('payment_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_payment_receipt_number
BEFORE INSERT ON payments
FOR EACH ROW EXECUTE FUNCTION generate_payment_receipt_number();

-- M. SYSTEM SETTINGS & BACKUP HISTORY (Settings & Backup worksheets)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL DEFAULT 'Varkala Holidays',
    address TEXT DEFAULT 'Varkala, Kerala',
    phone TEXT DEFAULT '919048279460',
    email TEXT DEFAULT 'villalemonhometay@gmail.com',
    bank_upi_details TEXT,
    receipt_footer_note TEXT DEFAULT 'Thank you for travelling with Varkala Holidays.',
    document_alert_days INT NOT NULL DEFAULT 30,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial business configuration
INSERT INTO system_settings (id, business_name, address, phone, email, document_alert_days)
VALUES (
    gen_random_uuid(),
    'Varkala Holidays',
    'Varkala, Kerala',
    '919048279460',
    'villalemonhometay@gmail.com',
    30
);

CREATE TABLE backup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type TEXT NOT NULL, -- 'database_snapshot', 'full_excel_archive'
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. REAL-TIME ACCOUNTING & RECONCILIATION DATABASE VIEWS
-- ============================================================================

-- VIEW 1: Complete Trip Financials (Trip Profit, Expenses, Billing Status, Collections)
CREATE OR REPLACE VIEW v_trip_financials AS
SELECT 
    t.id AS trip_id,
    t.trip_number,
    t.organization_id,
    o.name AS organization_name,
    t.trip_date,
    t.trip_status,
    t.trip_selling_price,
    t.amount_driver_must_collect,
    COALESCE(dr.amount_collected, 0.00) AS collected_by_driver,
    (COALESCE(dr.amount_collected, 0.00) - t.amount_driver_must_collect) AS collection_difference,
    -- Driver reported expenses
    COALESCE(dr.diesel_expense, 0.00) AS diesel_reported,
    COALESCE(dr.parking_toll_permits_tickets_food, 0.00) AS parking_toll_food_reported,
    COALESCE(dr.workshop_expense, 0.00) AS workshop_reported,
    -- Office general expenses linked to trip
    COALESCE((
        SELECT SUM(e.amount) 
        FROM expenses e 
        WHERE e.trip_id = t.id AND e.paid_by = 'Office'
    ), 0.00) AS office_trip_expenses,
    -- Total Trip Expenses
    (
        COALESCE(dr.diesel_expense, 0.00) + 
        COALESCE(dr.parking_toll_permits_tickets_food, 0.00) + 
        COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.trip_id = t.id AND e.paid_by = 'Office'), 0.00)
    ) AS total_trip_expenses,
    -- Net Trip Profit (Calculated strictly when Completed)
    CASE 
        WHEN t.trip_status = 'Completed' THEN 
            t.trip_selling_price - (
                COALESCE(dr.diesel_expense, 0.00) + 
                COALESCE(dr.parking_toll_permits_tickets_food, 0.00) + 
                COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.trip_id = t.id AND e.paid_by = 'Office'), 0.00)
            )
        ELSE NULL 
    END AS trip_profit,
    -- Effective Driver Pay for this trip
    CASE 
        WHEN t.driver_trip_pay_override IS NOT NULL THEN t.driver_trip_pay_override
        WHEN d.employment_type = 'Per-trip payment' THEN d.per_trip_payment
        ELSE 0.00
    END AS effective_driver_pay,
    -- Linked Invoice
    inv.invoice_number,
    CASE 
        WHEN t.trip_status <> 'Completed' THEN ''
        WHEN inv.invoice_number IS NULL THEN 'Unbilled'
        ELSE inv.status::TEXT
    END AS billing_status
FROM trips t
JOIN organizations o ON t.organization_id = o.id
LEFT JOIN drivers d ON t.assigned_driver_id = d.id
LEFT JOIN driver_reports dr ON dr.trip_id = t.id
LEFT JOIN invoice_trips it ON it.trip_id = t.id
LEFT JOIN invoices inv ON it.invoice_id = inv.id;

-- VIEW 2: Client Summary & Statement Balances (Clients worksheet formulas)
CREATE OR REPLACE VIEW v_client_summary AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    o.type AS organization_type,
    o.contact_person,
    o.phone,
    o.whatsapp,
    o.email,
    o.payment_terms,
    o.credit_limit,
    -- Completed Trip Value (L2 formula in Excel)
    COALESCE((
        SELECT SUM(t.trip_selling_price)
        FROM trips t
        WHERE t.organization_id = o.id AND t.trip_status = 'Completed'
    ), 0.00) AS completed_trip_value,
    -- Invoiced Issued Amount (M2 formula in Excel)
    COALESCE((
        SELECT SUM(
            (SELECT SUM(t2.trip_selling_price) FROM invoice_trips it2 JOIN trips t2 ON it2.trip_id = t2.id WHERE it2.invoice_id = inv.id)
        )
        FROM invoices inv
        WHERE inv.organization_id = o.id AND inv.status = 'Issued'
    ), 0.00) AS invoiced_issued_amount,
    -- Paid: Office Received + Driver Collected on Trips (N2 formula in Excel)
    (
        COALESCE((SELECT SUM(p.amount_received) FROM payments p WHERE p.organization_id = o.id), 0.00) +
        COALESCE((SELECT SUM(dr.amount_collected) FROM trips t JOIN driver_reports dr ON dr.trip_id = t.id WHERE t.organization_id = o.id), 0.00)
    ) AS total_paid,
    -- Outstanding Balance (O2 = L2 - N2 formula in Excel)
    (
        COALESCE((SELECT SUM(t.trip_selling_price) FROM trips t WHERE t.organization_id = o.id AND t.trip_status = 'Completed'), 0.00) -
        (
            COALESCE((SELECT SUM(p.amount_received) FROM payments p WHERE p.organization_id = o.id), 0.00) +
            COALESCE((SELECT SUM(dr.amount_collected) FROM trips t JOIN driver_reports dr ON dr.trip_id = t.id WHERE t.organization_id = o.id), 0.00)
        )
    ) AS outstanding_balance,
    -- Credit Check (P2 formula: IF Outstanding > Credit Limit THEN 'OVER LIMIT' ELSE 'OK')
    CASE 
        WHEN (
            COALESCE((SELECT SUM(t.trip_selling_price) FROM trips t WHERE t.organization_id = o.id AND t.trip_status = 'Completed'), 0.00) -
            (
                COALESCE((SELECT SUM(p.amount_received) FROM payments p WHERE p.organization_id = o.id), 0.00) +
                COALESCE((SELECT SUM(dr.amount_collected) FROM trips t JOIN driver_reports dr ON dr.trip_id = t.id WHERE t.organization_id = o.id), 0.00)
            )
        ) > o.credit_limit THEN 'OVER LIMIT'
        ELSE 'OK'
    END AS credit_check
FROM organizations o;

-- VIEW 3: Driver Dual-Ledger Balances (Drivers worksheet Col J, K, L formulas)
CREATE OR REPLACE VIEW v_driver_balances AS
SELECT 
    d.id AS driver_id,
    d.full_name,
    d.phone,
    d.employment_type,
    d.status,
    -- Balance Payable To Driver (His Pay: Trips pay + Salary due - Advances - Deductions - Payments made)
    (
        -- Completed trips earnings
        COALESCE((
            SELECT SUM(
                CASE 
                    WHEN t.driver_trip_pay_override IS NOT NULL THEN t.driver_trip_pay_override
                    WHEN d.employment_type = 'Per-trip payment' THEN d.per_trip_payment
                    ELSE 0.00
                END
            )
            FROM trips t 
            WHERE t.assigned_driver_id = d.id AND t.trip_status = 'Completed'
        ), 0.00)
        +
        -- Ledger Pay Effects (Salary Due [+] , Advance [-] , Deduction [-] , Payment Made [-])
        COALESCE((
            SELECT SUM(
                CASE 
                    WHEN dl.entry_type = 'Salary due' THEN dl.amount
                    WHEN dl.entry_type IN ('Advance', 'Deduction', 'Payment made') THEN -dl.amount
                    ELSE 0.00
                END
            )
            FROM driver_ledger dl
            WHERE dl.driver_id = d.id
        ), 0.00)
    ) AS balance_payable_to_driver,

    -- Cash He Owes The Office (His Cash: Collected from guests + Money sent for expenses - Expenses spent - Cash returned to office)
    (
        -- Cash collected from guests
        COALESCE((
            SELECT SUM(dr.amount_collected)
            FROM driver_reports dr
            WHERE dr.driver_id = d.id
        ), 0.00)
        +
        -- Money sent for expenses from office (+)
        COALESCE((
            SELECT SUM(dl.amount)
            FROM driver_ledger dl
            WHERE dl.driver_id = d.id AND dl.entry_type = 'Money sent for expenses'
        ), 0.00)
        -
        -- Expenses spent by driver on trips (Diesel + Toll/Parking/Food + Workshop)
        COALESCE((
            SELECT SUM(dr.diesel_expense + dr.parking_toll_permits_tickets_food + dr.workshop_expense)
            FROM driver_reports dr
            WHERE dr.driver_id = d.id
        ), 0.00)
        -
        -- Expenses recorded in Expenses ledger marked paid by Driver
        COALESCE((
            SELECT SUM(e.amount)
            FROM expenses e
            WHERE e.driver_id = d.id AND e.paid_by = 'Driver'
        ), 0.00)
        -
        -- Cash handed back to office (-)
        COALESCE((
            SELECT SUM(dl.amount)
            FROM driver_ledger dl
            WHERE dl.driver_id = d.id AND dl.entry_type = 'Cash handed to office'
        ), 0.00)
    ) AS cash_owed_to_office,

    -- Net Settlement (Office owes driver - Driver owes office)
    (
        (
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN t.driver_trip_pay_override IS NOT NULL THEN t.driver_trip_pay_override
                        WHEN d.employment_type = 'Per-trip payment' THEN d.per_trip_payment
                        ELSE 0.00
                    END
                )
                FROM trips t 
                WHERE t.assigned_driver_id = d.id AND t.trip_status = 'Completed'
            ), 0.00)
            +
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN dl.entry_type = 'Salary due' THEN dl.amount
                        WHEN dl.entry_type IN ('Advance', 'Deduction', 'Payment made') THEN -dl.amount
                        ELSE 0.00
                    END
                )
                FROM driver_ledger dl
                WHERE dl.driver_id = d.id
            ), 0.00)
        )
        -
        (
            COALESCE((SELECT SUM(dr.amount_collected) FROM driver_reports dr WHERE dr.driver_id = d.id), 0.00)
            +
            COALESCE((SELECT SUM(dl.amount) FROM driver_ledger dl WHERE dl.driver_id = d.id AND dl.entry_type = 'Money sent for expenses'), 0.00)
            -
            COALESCE((SELECT SUM(dr.diesel_expense + dr.parking_toll_permits_tickets_food + dr.workshop_expense) FROM driver_reports dr WHERE dr.driver_id = d.id), 0.00)
            -
            COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.driver_id = d.id AND e.paid_by = 'Driver'), 0.00)
            -
            COALESCE((SELECT SUM(dl.amount) FROM driver_ledger dl WHERE dl.driver_id = d.id AND dl.entry_type = 'Cash handed to office'), 0.00)
        )
    ) AS net_settlement_amount
FROM drivers d;

-- VIEW 4: Vehicle Document Expiry Alerts (Vehicles worksheet formula)
CREATE OR REPLACE VIEW v_vehicle_document_alerts AS
SELECT 
    v.id AS vehicle_id,
    v.registration_number,
    v.vehicle_type,
    v.status,
    v.insurance_expiry,
    v.permit_expiry,
    v.fitness_certificate_expiry,
    v.puc_expiry,
    CASE 
        WHEN v.insurance_expiry <= CURRENT_DATE THEN 'Insurance EXPIRED'
        WHEN v.permit_expiry <= CURRENT_DATE THEN 'Permit EXPIRED'
        WHEN v.fitness_certificate_expiry <= CURRENT_DATE THEN 'Fitness EXPIRED'
        WHEN v.puc_expiry <= CURRENT_DATE THEN 'PUC EXPIRED'
        WHEN v.insurance_expiry <= (CURRENT_DATE + INTERVAL '30 days') THEN 'Insurance Due Soon'
        WHEN v.permit_expiry <= (CURRENT_DATE + INTERVAL '30 days') THEN 'Permit Due Soon'
        WHEN v.fitness_certificate_expiry <= (CURRENT_DATE + INTERVAL '30 days') THEN 'Fitness Due Soon'
        WHEN v.puc_expiry <= (CURRENT_DATE + INTERVAL '30 days') THEN 'PUC Due Soon'
        ELSE 'OK'
    END AS document_alert
FROM vehicles v;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current user is an Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get driver record ID for current user
CREATE OR REPLACE FUNCTION get_current_driver_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM drivers WHERE profile_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get organization IDs linked to current user
CREATE OR REPLACE FUNCTION get_current_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY 
        SELECT organization_id FROM organization_users WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: PROFILES
CREATE POLICY "Admins full access to profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- POLICIES: ORGANIZATIONS
CREATE POLICY "Admins full access to organizations" ON organizations FOR ALL USING (is_admin());
CREATE POLICY "Org users view own organization" ON organizations FOR SELECT USING (id IN (SELECT get_current_org_ids()));

-- POLICIES: DRIVERS
CREATE POLICY "Admins full access to drivers" ON drivers FOR ALL USING (is_admin());
CREATE POLICY "Drivers view own profile" ON drivers FOR SELECT USING (profile_id = auth.uid());

-- POLICIES: VEHICLES
CREATE POLICY "Admins full access to vehicles" ON vehicles FOR ALL USING (is_admin());
CREATE POLICY "Drivers view vehicles" ON vehicles FOR SELECT TO authenticated USING (TRUE);

-- POLICIES: TRIPS
CREATE POLICY "Admins full access to trips" ON trips FOR ALL USING (is_admin());
CREATE POLICY "Drivers view assigned trips" ON trips FOR SELECT USING (assigned_driver_id = get_current_driver_id() OR (is_published_for_enrollment = TRUE AND trip_status IN ('Pending Approval', 'Confirmed', 'Assigned')));
CREATE POLICY "Org users view their organization trips" ON trips FOR SELECT USING (organization_id IN (SELECT get_current_org_ids()));
CREATE POLICY "Org users submit new trips" ON trips FOR INSERT WITH CHECK (organization_id IN (SELECT get_current_org_ids()));

-- POLICIES: TRIP ENROLLMENTS
CREATE POLICY "Admins full access to enrollments" ON trip_enrollments FOR ALL USING (is_admin());
CREATE POLICY "Drivers view and manage own enrollments" ON trip_enrollments FOR ALL USING (driver_id = get_current_driver_id());

-- POLICIES: DRIVER REPORTS
CREATE POLICY "Admins full access to driver reports" ON driver_reports FOR ALL USING (is_admin());
CREATE POLICY "Drivers view and insert own reports" ON driver_reports FOR ALL USING (driver_id = get_current_driver_id());

-- POLICIES: EXPENSES
CREATE POLICY "Admins full access to expenses" ON expenses FOR ALL USING (is_admin());
CREATE POLICY "Drivers view and insert expenses" ON expenses FOR ALL USING (driver_id = get_current_driver_id());

-- POLICIES: DRIVER LEDGER
CREATE POLICY "Admins full access to driver ledger" ON driver_ledger FOR ALL USING (is_admin());
CREATE POLICY "Drivers view own ledger" ON driver_ledger FOR SELECT USING (driver_id = get_current_driver_id());

-- POLICIES: INVOICES
CREATE POLICY "Admins full access to invoices" ON invoices FOR ALL USING (is_admin());
CREATE POLICY "Org users view own invoices" ON invoices FOR SELECT USING (organization_id IN (SELECT get_current_org_ids()));

-- POLICIES: INVOICE TRIPS
CREATE POLICY "Admins full access to invoice trips" ON invoice_trips FOR ALL USING (is_admin());
CREATE POLICY "Org users view own invoice trips" ON invoice_trips FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE organization_id IN (SELECT get_current_org_ids()))
);

-- POLICIES: PAYMENTS
CREATE POLICY "Admins full access to payments" ON payments FOR ALL USING (is_admin());
CREATE POLICY "Org users view own payments" ON payments FOR SELECT USING (organization_id IN (SELECT get_current_org_ids()));

-- POLICIES: SETTINGS & BACKUPS
CREATE POLICY "Admins manage settings" ON system_settings FOR ALL USING (is_admin());
CREATE POLICY "Authenticated users view settings" ON system_settings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins manage backup records" ON backup_records FOR ALL USING (is_admin());

-- ============================================================================
-- 6. STORAGE BUCKET CONFIGURATION (RECEIPTS & DOCUMENTS)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('receipts', 'receipts', true),
    ('documents', 'documents', false),
    ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read for receipts, authenticated upload
CREATE POLICY "Public Read Receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Auth Upload Receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');

-- ============================================================================
-- 7. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trips_org ON trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_driver_reports_trip ON driver_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_reports_driver ON driver_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_ledger_driver ON driver_ledger(driver_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);

