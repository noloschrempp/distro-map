import { Distributor } from '../models/types';
import { supabase } from '../lib/supabase';
import { mockDistributors } from '../data/distributors';
import { generateLargeDistributorDataset } from '../data/largeDistributors';

// Toggle this to test with large dataset (500+ items) for performance testing
const USE_LARGE_DATASET = false;

/**
 * Get distributors from database
 * Currently using mock data - will be replaced with Supabase queries
 * when backend event integration is ready
 */
export async function getDistributors(category?: string, search?: string): Promise<Distributor[]> {
  try {
    // TODO: Replace with real Supabase query when database is configured
    // const { data, error } = await supabase
    //   .from('distributors')
    //   .select('*')
    //   .eq('archived', false);

    // For now, use mock data (can switch to large dataset for testing)
    let distributors = USE_LARGE_DATASET
      ? generateLargeDistributorDataset(500)
      : [...mockDistributors];

    // Parse the distribution_center_manufacturers field if it's a string
    const parsedDistributors = distributors.map(distributor => ({
      ...distributor,
      distribution_center_manufacturers: parseManufacturers(distributor.distribution_center_manufacturers)
    }));

    // Filter out distributors with invalid coordinates
    return parsedDistributors.filter(
      d => d.location_lat != null && d.location_lon != null &&
           !isNaN(d.location_lat) && !isNaN(d.location_lon)
    );
  } catch (error) {
    console.error('Error fetching distributors:', error);
    return [];
  }
}

// Helper function to parse manufacturers data
function parseManufacturers(manufacturers: any): string[] {
  if (!manufacturers) return [];
  
  // If it's already an array, return it
  if (Array.isArray(manufacturers)) return manufacturers;
  
  // If it's a string that looks like JSON, try to parse it
  if (typeof manufacturers === 'string' && 
      (manufacturers.startsWith('[') || manufacturers.startsWith('{'))) {
    try {
      return JSON.parse(manufacturers);
    } catch (e) {
      console.error('Error parsing manufacturers:', e);
      return [manufacturers];
    }
  }
  
  // If it's a string but not JSON, return as single item array
  if (typeof manufacturers === 'string') {
    return [manufacturers];
  }
  
  // For any other case, return empty array
  return [];
}