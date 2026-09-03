-- Migration: Make nom, prenom, and role nullable in profiles table
-- This allows users to create accounts first, then complete their profile information

-- Check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Alter nom column to be nullable
    ALTER TABLE profiles ALTER COLUMN nom DROP NOT NULL;
    
    -- Alter prenom column to be nullable
    ALTER TABLE profiles ALTER COLUMN prenom DROP NOT NULL;
    
    -- Alter role column to be nullable
    ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
    
    RAISE NOTICE 'Migration completed: nom, prenom, and role are now nullable in profiles table';
  ELSE
    RAISE NOTICE 'Migration skipped: profiles table does not exist';
  END IF;
END $$;
