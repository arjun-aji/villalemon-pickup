-- ============================================================================
-- SYNC TRIP SEQUENCE (Ensures trip_seq is always ahead of existing trips)
-- ============================================================================

SELECT setval('trip_seq', GREATEST((SELECT COALESCE(MAX(SUBSTRING(trip_number FROM 4)::integer), 1) FROM trips), 10));

