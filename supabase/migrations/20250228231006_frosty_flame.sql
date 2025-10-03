/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `client_id` (uuid, for associating properties with clients)
      - `name` (text, property name/identifier)
      - `address_line_1` (text, street address)
      - `address_line_2` (text, additional address info)
      - `address_city` (text, city)
      - `address_state` (text, state)
      - `postal_code` (text, zip/postal code)
      - `country` (text, country code)
      - `location_lat` (double precision, latitude)
      - `location_lon` (double precision, longitude)
      - `property_type` (text, type of property)
      - `square_footage` (integer, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `properties` table
    - Add policies for authenticated users to manage their own properties
  3. Indexes
    - Index on client_id for quick lookup
    - Index on location coordinates for spatial queries
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  address_city text NOT NULL,
  address_state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  location_lat double precision NOT NULL,
  location_lon double precision NOT NULL,
  property_type text,
  square_footage integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can create their own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can view their own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Users can update their own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can delete their own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS properties_client_id_idx ON properties(client_id);
CREATE INDEX IF NOT EXISTS properties_location_idx ON properties(location_lat, location_lon);

-- Insert sample properties (these will be associated with the first user who signs up)
INSERT INTO properties (
  id,
  name,
  address_line_1,
  address_city,
  address_state,
  postal_code,
  country,
  location_lat,
  location_lon,
  property_type,
  client_id
) VALUES
  (
    gen_random_uuid(),
    'Chicago Office',
    '123 Main Street',
    'Chicago',
    'IL',
    '60601',
    'US',
    41.8781,
    -87.6298,
    'Office',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'New York Headquarters',
    '450 Park Avenue',
    'New York',
    'NY',
    '10022',
    'US',
    40.7603,
    -73.9711,
    'Office',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'Atlanta Branch',
    '1000 Peachtree Street',
    'Atlanta',
    'GA',
    '30309',
    'US',
    33.7816,
    -84.3857,
    'Retail',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'San Francisco Tech Center',
    '555 Market Street',
    'San Francisco',
    'CA',
    '94105',
    'US',
    37.7897,
    -122.3997,
    'Office',
    (SELECT id FROM auth.users LIMIT 1)
  ),
  (
    gen_random_uuid(),
    'Miami Showroom',
    '800 Brickell Avenue',
    'Miami',
    'FL',
    '33131',
    'US',
    25.7654,
    -80.1896,
    'Retail',
    (SELECT id FROM auth.users LIMIT 1)
  );