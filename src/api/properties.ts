import { Property } from '../models/types';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'compass_properties';

/**
 * Get properties from localStorage (temporary solution until backend integration)
 */
export async function getProperties(): Promise<Property[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string): Promise<Property> {
  try {
    const properties = await getProperties();
    const property = properties.find(p => p.id === id);
    if (!property) {
      throw new Error('Property not found');
    }
    return property;
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
}

/**
 * Create a new property
 */
export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  try {
    const properties = await getProperties();
    const newProperty: Property = {
      ...property,
      id: `property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    properties.push(newProperty);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    return newProperty;
  } catch (error) {
    console.error('Error creating property:', error);
    throw error;
  }
}

/**
 * Update an existing property
 */
export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
  try {
    const properties = await getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Property not found');
    }

    const updatedProperty: Property = {
      ...properties[index],
      ...updates,
      id: properties[index].id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };

    properties[index] = updatedProperty;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    return updatedProperty;
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    const properties = await getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Property not found');
    }

    properties.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    throw error;
  }
}

/**
 * Find properties near a location
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMiles Radius in miles
 */
export async function findPropertiesNearLocation(lat: number, lon: number, radiusMiles: number = 50): Promise<Property[]> {
  try {
    const properties = await getProperties();
    return filterPropertiesByDistance(properties, lat, lon, radiusMiles);
  } catch (error) {
    console.error('Error finding properties:', error);
    return [];
  }
}

/**
 * Filter properties by actual distance using the Haversine formula
 */
function filterPropertiesByDistance(
  properties: Property[], 
  lat: number, 
  lon: number, 
  radiusMiles: number
): Property[] {
  return properties.filter(property => {
    const distance = calculateDistance(lat, lon, property.location_lat, property.location_lon);
    return distance <= radiusMiles;
  });
}

/**
 * Calculate distance between two points using the Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}