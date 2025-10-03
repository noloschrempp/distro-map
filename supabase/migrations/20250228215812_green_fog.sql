/*
  # Restructure distributors table
  
  1. Table Structure Changes
    - Modify the distributors table to match the new structure
    - Add all required fields for the distributor map application
    
  2. Security
    - Enable Row Level Security on the table
    - Add policy for public read access
    
  3. Performance
    - Create indexes for common query patterns (program, archived, location)
*/

-- Check if the locations table exists and drop the foreign key constraint if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'locations'
  ) THEN
    ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_distributor_id_fkey;
  END IF;
END
$$;

-- Alter the distributors table if it exists, otherwise create it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'distributors'
  ) THEN
    -- Drop existing columns that don't match our new schema
    ALTER TABLE distributors 
      DROP COLUMN IF EXISTS category,
      DROP COLUMN IF EXISTS logo,
      DROP COLUMN IF EXISTS logo_url;
    
    -- Add new columns
    ALTER TABLE distributors 
      ADD COLUMN IF NOT EXISTS distributor text,
      ADD COLUMN IF NOT EXISTS program text,
      ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS address_city text,
      ADD COLUMN IF NOT EXISTS address_line_1 text,
      ADD COLUMN IF NOT EXISTS address_line_2 text,
      ADD COLUMN IF NOT EXISTS address_state text,
      ADD COLUMN IF NOT EXISTS postal_code text,
      ADD COLUMN IF NOT EXISTS country text,
      ADD COLUMN IF NOT EXISTS location_lat double precision,
      ADD COLUMN IF NOT EXISTS location_lon double precision,
      ADD COLUMN IF NOT EXISTS store_number text,
      ADD COLUMN IF NOT EXISTS contact_name text,
      ADD COLUMN IF NOT EXISTS contact_emails text,
      ADD COLUMN IF NOT EXISTS contact_phone text,
      ADD COLUMN IF NOT EXISTS contact_fax text,
      ADD COLUMN IF NOT EXISTS fulfill_delivery boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS fulfill_pickup boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS distribution_image_icon text,
      ADD COLUMN IF NOT EXISTS distribution_center_manufacturers jsonb,
      ADD COLUMN IF NOT EXISTS row_num integer,
      ADD COLUMN IF NOT EXISTS county_fips text,
      ADD COLUMN IF NOT EXISTS cbsa_title text;
      
    -- Make sure required columns are NOT NULL
    ALTER TABLE distributors 
      ALTER COLUMN distributor SET NOT NULL,
      ALTER COLUMN name SET NOT NULL,
      ALTER COLUMN program SET NOT NULL;
      
  ELSE
    -- Create the table from scratch
    CREATE TABLE distributors (
      id text PRIMARY KEY,
      distributor text NOT NULL,
      name text NOT NULL,
      program text NOT NULL,
      archived boolean DEFAULT false,
      address_city text,
      address_line_1 text,
      address_line_2 text,
      address_state text,
      postal_code text,
      country text,
      location_lat double precision,
      location_lon double precision,
      store_number text,
      contact_name text,
      contact_emails text,
      contact_phone text,
      contact_fax text,
      fulfill_delivery boolean DEFAULT false,
      fulfill_pickup boolean DEFAULT false,
      distribution_image_icon text,
      distribution_center_manufacturers jsonb,
      row_num integer,
      county_fips text,
      cbsa_title text,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END
$$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'distributors' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policy for public read access if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'distributors' 
    AND policyname = 'Allow public read access to distributors'
  ) THEN
    CREATE POLICY "Allow public read access to distributors"
      ON distributors
      FOR SELECT
      TO public
      USING (true);
  END IF;
END
$$;

-- Create indexes for common query patterns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'distributors' 
    AND indexname = 'distributors_program_idx'
  ) THEN
    CREATE INDEX distributors_program_idx ON distributors(program);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'distributors' 
    AND indexname = 'distributors_archived_idx'
  ) THEN
    CREATE INDEX distributors_archived_idx ON distributors(archived);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'distributors' 
    AND indexname = 'distributors_location_idx'
  ) THEN
    CREATE INDEX distributors_location_idx ON distributors(location_lat, location_lon);
  END IF;
END
$$;

-- If locations table exists, recreate the foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'locations'
  ) THEN
    ALTER TABLE locations 
      ADD CONSTRAINT locations_distributor_id_fkey 
      FOREIGN KEY (distributor_id) 
      REFERENCES distributors(id) 
      ON DELETE CASCADE;
  END IF;
END
$$;