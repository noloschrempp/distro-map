// Models for our database entities
export interface Distributor {
  id: string;
  distributor: string;
  name: string;
  program: string;
  partner?: string; // Partner organization (e.g., "Carrier", "Trane")
  archived: boolean;
  address_city: string;
  address_line_1: string;
  address_line_2?: string;
  address_state: string;
  postal_code: string;
  country: string;
  location_lat: number;
  location_lon: number;
  store_number?: string;
  contact_name?: string;
  contact_emails?: string;
  contact_phone?: string;
  contact_fax?: string;
  fulfill_delivery: boolean;
  fulfill_pickup: boolean;
  distribution_image_icon?: string;
  distribution_center_manufacturers?: string[];
  row_num?: number;
  county_fips?: string;
  cbsa_title?: string;
  created_at?: string;
  distance?: number; // Distance from a property in miles
}

// Category type for filtering
export type Category = 'ALL' | 'HVAC' | 'Appliances' | 'Flooring' | 'Paint' | 'Carpet';

// Combined type for easier data handling
export type DistributorWithLocations = Distributor;

// Property interface for client properties
export interface Property {
  id: string;
  client_id?: string;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  address_city: string;
  address_state: string;
  postal_code: string;
  country: string;
  location_lat: number;
  location_lon: number;
  property_type?: string;
  square_footage?: number;
  created_at?: string;
  updated_at?: string;
}