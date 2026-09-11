-- 0002_requests_anonymous.sql
-- Incremental migration: allow anonymous estimation requests (homepage form
-- submitted before account creation) and store the submitter's contact
-- details directly on the request row when there is no linked client profile.
--
-- This is the minimal delta over 0001_schema_english.sql. Safe to re-run.

-- 1. Allow NULL client_id for requests submitted anonymously.
ALTER TABLE requests
    ALTER COLUMN client_id DROP NOT NULL;

-- 2. Denormalized contact details used when client_id is null.
ALTER TABLE requests
    ADD COLUMN IF NOT EXISTS client_first_name TEXT,
    ADD COLUMN IF NOT EXISTS client_last_name  TEXT,
    ADD COLUMN IF NOT EXISTS client_email      TEXT,
    ADD COLUMN IF NOT EXISTS client_phone      TEXT;

COMMENT ON COLUMN requests.client_id IS 'Linked client profile. Nullable: anonymous estimation requests submitted before account creation are later linked via UPDATE.';
COMMENT ON COLUMN requests.client_first_name IS 'Submitter first name, used when client_id is null (anonymous homepage estimation form).';
COMMENT ON COLUMN requests.client_last_name  IS 'Submitter last name, used when client_id is null (anonymous homepage estimation form).';
COMMENT ON COLUMN requests.client_email      IS 'Submitter email, used when client_id is null (anonymous homepage estimation form).';
COMMENT ON COLUMN requests.client_phone      IS 'Submitter phone, used when client_id is null (anonymous homepage estimation form).';
