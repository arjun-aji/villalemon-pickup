-- VillaLemon Pickup Database Schema
-- Migration 001: Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVER EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.driver_employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_number TEXT,
  address TEXT,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'suspended')),
  is_first_login BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_number TEXT UNIQUE NOT NULL,
  
  -- Customer Details
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  flight_number TEXT,
  num_passengers INTEGER DEFAULT 1,
  
  -- Financial Details
  amount_to_collect NUMERIC(10,2) NOT NULL DEFAULT 0,
  driver_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_fixed_charges NUMERIC(10,2) DEFAULT 0,
  
  -- Placard
  placard_text TEXT,
  
  -- Instructions
  trip_notes TEXT,
  
  -- Assignment
  assigned_driver_id UUID REFERENCES public.driver_employees(id) ON DELETE SET NULL,
  
  -- Status
  trip_status TEXT DEFAULT 'upcoming' CHECK (trip_status IN ('upcoming', 'available_for_enrollment', 'assigned', 'in_progress', 'completed', 'cancelled')),
  is_published_for_enrollment BOOLEAN DEFAULT false,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP ENROLLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.driver_employees(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(trip_id, driver_id)
);

-- ============================================
-- TRIP EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.driver_employees(id) ON DELETE CASCADE,
  
  -- Expense Items
  petrol_expense NUMERIC(10,2) DEFAULT 0,
  other_expense NUMERIC(10,2) DEFAULT 0,
  expense_description TEXT,
  
  -- Expense line items (JSON array)
  expense_items JSONB DEFAULT '[]',
  
  -- Settlement
  actual_amount_returned NUMERIC(10,2) DEFAULT 0,
  
  -- Computed fields (stored for performance)
  total_expenses NUMERIC(10,2) GENERATED ALWAYS AS (petrol_expense + other_expense) STORED,
  expected_return NUMERIC(10,2),
  settlement_difference NUMERIC(10,2),
  
  -- Receipt URLs
  receipt_urls JSONB DEFAULT '[]',
  
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP SETTLEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL UNIQUE,
  driver_id UUID REFERENCES public.driver_employees(id),
  
  -- Financial Summary
  customer_collection NUMERIC(10,2) NOT NULL DEFAULT 0,
  petrol_expense NUMERIC(10,2) DEFAULT 0,
  driver_charge NUMERIC(10,2) DEFAULT 0,
  other_expenses NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  net_profit NUMERIC(10,2) DEFAULT 0,
  expected_return NUMERIC(10,2) DEFAULT 0,
  actual_return NUMERIC(10,2) DEFAULT 0,
  settlement_difference NUMERIC(10,2) DEFAULT 0,
  
  -- Status
  settlement_status TEXT DEFAULT 'expense_pending' CHECK (settlement_status IN ('expense_pending', 'driver_submitted', 'pending_verification', 'settled', 'difference', 'excess')),
  
  -- Verification
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP STATUS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MONTHLY REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_month INTEGER NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  report_year INTEGER NOT NULL,
  report_name TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT,
  
  -- Summary Stats
  total_trips INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  net_profit NUMERIC(10,2) DEFAULT 0,
  
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(report_month, report_year)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_trips_pickup_date ON public.trips(pickup_date);
CREATE INDEX IF NOT EXISTS idx_trips_assigned_driver ON public.trips(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_enrollments_trip ON public.trip_enrollments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_enrollments_driver ON public.trip_enrollments(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_enrollments_status ON public.trip_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip ON public.trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_settlements_trip ON public.trip_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_settlements_status ON public.trip_settlements(settlement_status);
CREATE INDEX IF NOT EXISTS idx_driver_employees_username ON public.driver_employees(username);
CREATE INDEX IF NOT EXISTS idx_driver_employees_status ON public.driver_employees(employment_status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get driver employee id for current user
CREATE OR REPLACE FUNCTION public.get_current_driver_id()
RETURNS UUID AS $$
  SELECT id FROM public.driver_employees WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin' OR auth.uid() = id);

-- DRIVER EMPLOYEES POLICIES
CREATE POLICY "Admin can manage drivers" ON public.driver_employees
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can view own record" ON public.driver_employees
  FOR SELECT USING (user_id = auth.uid());

-- TRIPS POLICIES
CREATE POLICY "Admin can manage all trips" ON public.trips
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can view assigned and available trips" ON public.trips
  FOR SELECT USING (
    public.get_current_user_role() = 'driver' AND (
      assigned_driver_id = public.get_current_driver_id() OR
      is_published_for_enrollment = true
    )
  );

CREATE POLICY "Driver can update trip status" ON public.trips
  FOR UPDATE USING (
    public.get_current_user_role() = 'driver' AND
    assigned_driver_id = public.get_current_driver_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'driver' AND
    assigned_driver_id = public.get_current_driver_id()
  );

-- TRIP ENROLLMENTS POLICIES
CREATE POLICY "Admin can manage enrollments" ON public.trip_enrollments
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can manage own enrollments" ON public.trip_enrollments
  FOR ALL USING (
    public.get_current_user_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

-- TRIP EXPENSES POLICIES
CREATE POLICY "Admin can view all expenses" ON public.trip_expenses
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can manage own trip expenses" ON public.trip_expenses
  FOR ALL USING (
    public.get_current_user_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

-- TRIP SETTLEMENTS POLICIES
CREATE POLICY "Admin can manage settlements" ON public.trip_settlements
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can view own settlements" ON public.trip_settlements
  FOR SELECT USING (
    public.get_current_user_role() = 'driver' AND
    driver_id = public.get_current_driver_id()
  );

-- TRIP STATUS HISTORY POLICIES
CREATE POLICY "Admin can view all history" ON public.trip_status_history
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Driver can view own trip history" ON public.trip_status_history
  FOR SELECT USING (public.get_current_user_role() = 'driver');

-- MONTHLY REPORTS POLICIES
CREATE POLICY "Only admin can manage reports" ON public.monthly_reports
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_employees_updated_at
  BEFORE UPDATE ON public.driver_employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_expenses_updated_at
  BEFORE UPDATE ON public.trip_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_settlements_updated_at
  BEFORE UPDATE ON public.trip_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate trip number function
CREATE OR REPLACE FUNCTION public.generate_trip_number()
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.trips;
  v_number := 'VH-' || LPAD(v_count::TEXT, 3, '0');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.trips WHERE trip_number = v_number) LOOP
    v_count := v_count + 1;
    v_number := 'VH-' || LPAD(v_count::TEXT, 3, '0');
  END LOOP;
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;
