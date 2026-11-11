-- =====================================================================
-- VillaLemon Pickup: Disable Row-Level Security for Unrestricted Access
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnvknruutfrmwyrbhdjq/sql/new
-- =====================================================================

ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records DISABLE ROW LEVEL SECURITY;
