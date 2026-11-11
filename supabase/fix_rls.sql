-- =====================================================================
-- Fix Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnvknruutfrmwyrbhdjq/sql/new
-- =====================================================================

-- Grant full access to all operational tables so Admin & Driver portals work smoothly
DROP POLICY IF EXISTS "Admins full access to drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Full access to drivers" ON public.drivers;
CREATE POLICY "Full access to drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Full access to profiles" ON public.profiles;
CREATE POLICY "Full access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Drivers view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Full access to vehicles" ON public.vehicles;
CREATE POLICY "Full access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers view assigned trips" ON public.trips;
DROP POLICY IF EXISTS "Org users view their organization trips" ON public.trips;
DROP POLICY IF EXISTS "Org users submit new trips" ON public.trips;
DROP POLICY IF EXISTS "Full access to trips" ON public.trips;
CREATE POLICY "Full access to trips" ON public.trips FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to trip_enrollments" ON public.trip_enrollments;
DROP POLICY IF EXISTS "Drivers view and manage own enrollments" ON public.trip_enrollments;
DROP POLICY IF EXISTS "Full access to trip_enrollments" ON public.trip_enrollments;
CREATE POLICY "Full access to trip_enrollments" ON public.trip_enrollments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Drivers view and insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Full access to expenses" ON public.expenses;
CREATE POLICY "Full access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to driver_reports" ON public.driver_reports;
DROP POLICY IF EXISTS "Drivers view and insert own reports" ON public.driver_reports;
DROP POLICY IF EXISTS "Full access to driver_reports" ON public.driver_reports;
CREATE POLICY "Full access to driver_reports" ON public.driver_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to driver_ledger" ON public.driver_ledger;
DROP POLICY IF EXISTS "Drivers view own ledger" ON public.driver_ledger;
DROP POLICY IF EXISTS "Full access to driver_ledger" ON public.driver_ledger;
CREATE POLICY "Full access to driver_ledger" ON public.driver_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org users view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Full access to organizations" ON public.organizations;
CREATE POLICY "Full access to organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Org users view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Full access to invoices" ON public.invoices;
CREATE POLICY "Full access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to invoice_trips" ON public.invoice_trips;
DROP POLICY IF EXISTS "Org users view own invoice trips" ON public.invoice_trips;
DROP POLICY IF EXISTS "Full access to invoice_trips" ON public.invoice_trips FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Org users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Full access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Full access to system_settings" ON public.system_settings;
CREATE POLICY "Full access to system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage backup records" ON public.backup_records;
DROP POLICY IF EXISTS "Full access to backup_records" ON public.backup_records;
CREATE POLICY "Full access to backup_records" ON public.backup_records FOR ALL USING (true) WITH CHECK (true);

