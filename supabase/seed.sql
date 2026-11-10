-- VillaLemon Pickup - Seed Data
-- Run this AFTER creating the initial admin user via Supabase Auth

-- Note: Create admin user via Supabase Dashboard or Auth API first
-- Then update the user's metadata with: {"role": "admin", "full_name": "Admin"}
-- The trigger will auto-create the profile

-- Sample data for development (optional)
-- These will only work if you have a valid admin user ID

-- To create admin:
-- 1. Go to Supabase Dashboard > Authentication > Users > Add User
-- 2. Set email and password
-- 3. Set user metadata: {"role": "admin", "full_name": "VillaLemon Admin"}
