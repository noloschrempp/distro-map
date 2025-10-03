/*
  # Change distributors ID column type

  1. Changes
     - Change the ID column type from UUID to text for the distributors table
     - This allows using string identifiers like "airefco-dc-3720" instead of UUIDs
     - Handles dependencies with the locations table
  
  2. Security
     - No changes to security policies
*/

-- Check if the distributors table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'distributors'
  ) THEN
    -- First, check if the ID column is already text type
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'distributors'
      AND column_name = 'id'
      AND data_type = 'text'
    ) THEN
      -- Check if locations table exists and has a foreign key to distributors
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'locations'
      ) AND EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'locations_distributor_id_fkey'
      ) THEN
        -- Drop the foreign key constraint first
        ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_distributor_id_fkey;
        
        -- Remember the constraint for later recreation
        -- We'll create a new constraint after the table is recreated
      END IF;
      
      -- Create a temporary table with the new structure
      CREATE TABLE distributors_new (
        id text PRIMARY KEY,
        distributor text,
        name text,
        program text,
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
      
      -- Copy data, converting UUIDs to text
      INSERT INTO distributors_new
      SELECT id::text, distributor, name, program, archived, 
             address_city, address_line_1, address_line_2, address_state, postal_code, country,
             location_lat, location_lon, store_number, contact_name, contact_emails, contact_phone, contact_fax,
             fulfill_delivery, fulfill_pickup, distribution_image_icon, distribution_center_manufacturers,
             row_num, county_fips, cbsa_title, created_at
      FROM distributors;
      
      -- Drop the old table with CASCADE to handle dependencies
      DROP TABLE distributors CASCADE;
      
      -- Rename the new table
      ALTER TABLE distributors_new RENAME TO distributors;
      
      -- Recreate indexes
      CREATE INDEX IF NOT EXISTS distributors_program_idx ON distributors(program);
      CREATE INDEX IF NOT EXISTS distributors_archived_idx ON distributors(archived);
      CREATE INDEX IF NOT EXISTS distributors_location_idx ON distributors(location_lat, location_lon);
      
      -- Enable RLS
      ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
      
      -- Recreate policies
      CREATE POLICY "Allow public read access to distributors"
        ON distributors
        FOR SELECT
        TO public
        USING (true);
      
      -- If locations table exists, recreate the foreign key with the new column type
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'locations'
      ) THEN
        -- First, alter the distributor_id column in locations to be text type
        ALTER TABLE locations 
        ALTER COLUMN distributor_id TYPE text USING distributor_id::text;
        
        -- Then recreate the foreign key constraint
        ALTER TABLE locations
        ADD CONSTRAINT locations_distributor_id_fkey
        FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END
$$;