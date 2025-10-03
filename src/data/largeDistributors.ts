import { Distributor } from '../models/types';
import { mockDistributors } from './distributors';

/**
 * Generate a larger dataset for performance testing
 * This creates 500+ distributors by duplicating and slightly modifying the mock data
 */
export function generateLargeDistributorDataset(count: number = 500): Distributor[] {
  const largeDataset: Distributor[] = [];
  const programs: ('HVAC' | 'Appliances' | 'Flooring' | 'Paint' | 'Carpet')[] = ['HVAC', 'Appliances', 'Flooring', 'Paint', 'Carpet'];

  // Cities across the US for geographic distribution
  const cities = [
    { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
    { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
    { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
    { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
    { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
    { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
    { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
    { city: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
    { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
    { city: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
    { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
    { city: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
    { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
    { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
    { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
    { city: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
    { city: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
    { city: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
    { city: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
    { city: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 }
  ];

  for (let i = 0; i < count; i++) {
    const template = mockDistributors[i % mockDistributors.length];
    const cityData = cities[i % cities.length];
    const program = programs[i % programs.length];

    // Add small random offset to coordinates for variation
    const latOffset = (Math.random() - 0.5) * 0.5;
    const lonOffset = (Math.random() - 0.5) * 0.5;

    largeDataset.push({
      ...template,
      id: `${template.id}-${i}`,
      name: `${cityData.city} Location ${Math.floor(i / cities.length) + 1}`,
      program: program,
      address_city: cityData.city,
      address_state: cityData.state,
      location_lat: cityData.lat + latOffset,
      location_lon: cityData.lon + lonOffset,
      postal_code: `${10000 + i}`,
      store_number: `${cityData.state}-${String(i).padStart(4, '0')}`
    });
  }

  return largeDataset;
}
