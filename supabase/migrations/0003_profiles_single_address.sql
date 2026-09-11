-- 0003_profiles_single_address.sql
-- Collapse the address to a single `street_address` column (the full Base
-- Adresse Nationale label) and drop the redundant city / postal_code /
-- country columns from profiles. Safe to re-run.

ALTER TABLE profiles DROP COLUMN IF EXISTS city;
ALTER TABLE profiles DROP COLUMN IF EXISTS postal_code;
ALTER TABLE profiles DROP COLUMN IF EXISTS country;

COMMENT ON COLUMN profiles.street_address IS 'Full postal address, entered via the Base Adresse Nationale (label includes street, city and postal code).';
