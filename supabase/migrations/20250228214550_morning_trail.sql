/*
  # Create distributors and locations tables

  1. New Tables
    - `distributors`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `category` (text, not null)
      - `logo` (text)
      - `logo_url` (text)
      - `created_at` (timestamp with time zone, default: now())
    - `locations`
      - `id` (uuid, primary key)
      - `distributor_id` (uuid, foreign key to distributors.id)
      - `address` (text, not null)
      - `city` (text, not null)
      - `state` (text, not null)
      - `zip` (text, not null)
      - `phone` (text, not null)
      - `lat` (double precision, not null)
      - `lng` (double precision, not null)
      - `store_number` (text)
      - `created_at` (timestamp with time zone, default: now())
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read data
*/

-- Create distributors table
CREATE TABLE IF NOT EXISTS distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  logo text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid REFERENCES distributors(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  phone text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  store_number text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies for distributors
CREATE POLICY "Allow public read access to distributors"
  ON distributors
  FOR SELECT
  TO public
  USING (true);

-- Create policies for locations
CREATE POLICY "Allow public read access to locations"
  ON locations
  FOR SELECT
  TO public
  USING (true);

-- Create index for faster location lookups by distributor
CREATE INDEX IF NOT EXISTS locations_distributor_id_idx ON locations(distributor_id);