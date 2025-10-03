/*
  # Insert sample distributor data
  
  1. Data Population
    - Add sample distributor locations with different categories
    - Include all necessary metadata for each distributor
    
  2. Safety
    - Use conditional logic to check column types before inserting
    - Generate proper UUIDs for the id column
    - Use ON CONFLICT to avoid duplicate entries
*/

-- First check if the table and required columns exist
DO $$
DECLARE
  id_type text;
BEGIN
  -- Check if the table exists with the required columns
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'distributors'
  ) AND EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'distributors'
    AND column_name = 'distributor'
  ) THEN
    -- Get the data type of the id column
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'distributors'
    AND column_name = 'id';
    
    -- Insert sample data with proper UUID handling
    IF id_type = 'uuid' THEN
      -- Insert with generated UUIDs
      INSERT INTO distributors (
        id, distributor, name, program, archived, 
        address_city, address_line_1, address_line_2, address_state, postal_code, country,
        location_lat, location_lon, store_number, 
        fulfill_delivery, fulfill_pickup, distribution_image_icon, distribution_center_manufacturers
      )
      VALUES
        (
          gen_random_uuid(), 'kochair', 'Lexington', 'HVAC', FALSE,
          'Lexington', '132 Trade St', NULL, 'KY', '40511-2635', 'US',
          38.07576, -84.54451, 'LEX',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/koch-air-logo.png',
          '["carrier"]'::jsonb
        ),
        (
          gen_random_uuid(), 'kochair', 'Louisville', 'Appliances', FALSE,
          'Louisville', '2600 Blankenbaker Pkwy', NULL, 'KY', '40299', 'US',
          38.20944, -85.53862, 'LVL',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/koch-air-logo.png',
          '["carrier"]'::jsonb
        ),
        (
          gen_random_uuid(), 'auersteelheating', 'Sturtevant', 'Flooring', FALSE,
          'Sturtevant', '1661 Renaissance Blvd', NULL, 'WI', '53177', 'US',
          42.71604, -87.91091, '130',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/auer-steel-logo.png',
          '["carrier"]'::jsonb
        );
    ELSE
      -- Insert with text IDs (for non-UUID id columns)
      INSERT INTO distributors (
        id, distributor, name, program, archived, 
        address_city, address_line_1, address_line_2, address_state, postal_code, country,
        location_lat, location_lon, store_number, 
        fulfill_delivery, fulfill_pickup, distribution_image_icon, distribution_center_manufacturers
      )
      VALUES
        (
          'kochair-dc-lex', 'kochair', 'Lexington', 'HVAC', FALSE,
          'Lexington', '132 Trade St', NULL, 'KY', '40511-2635', 'US',
          38.07576, -84.54451, 'LEX',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/koch-air-logo.png',
          '["carrier"]'::jsonb
        ),
        (
          'kochair-dc-lvl', 'kochair', 'Louisville', 'Appliances', FALSE,
          'Louisville', '2600 Blankenbaker Pkwy', NULL, 'KY', '40299', 'US',
          38.20944, -85.53862, 'LVL',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/koch-air-logo.png',
          '["carrier"]'::jsonb
        ),
        (
          'auersteelheating-dc-130', 'auersteelheating', 'Sturtevant', 'Flooring', FALSE,
          'Sturtevant', '1661 Renaissance Blvd', NULL, 'WI', '53177', 'US',
          42.71604, -87.91091, '130',
          TRUE, TRUE, 'https://s3.us-east-2.amazonaws.com/sibi.images/manufacturer/logos/auer-steel-logo.png',
          '["carrier"]'::jsonb
        )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  ELSE
    -- Log a message if the table or columns don't exist
    RAISE NOTICE 'Table distributors or required columns do not exist. Sample data not inserted.';
  END IF;
END
$$;