/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Convert latitude and longitude from degrees to radians
  const radLat1 = (Math.PI * lat1) / 180;
  const radLon1 = (Math.PI * lon1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const radLon2 = (Math.PI * lon2) / 180;

  // Haversine formula
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Earth's radius in miles
  const R = 3958.8;
  
  // Distance in miles
  return R * c;
}

/**
 * Format distance to a readable string
 * @param distance Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    // For distances less than 1 mile, show one decimal place
    return `${distance.toFixed(1)} mi`;
  } else if (distance < 10) {
    // For distances between 1 and 10 miles, show one decimal place
    return `${distance.toFixed(1)} mi`;
  } else {
    // For distances over 10 miles, round to whole number
    return `${Math.round(distance)} mi`;
  }
}

/**
 * Filter and sort locations by distance
 * @param referencePoint Reference point to measure distance from
 * @param locations Array of locations with lat/lon coordinates
 * @param maxDistance Maximum distance in miles
 * @returns Filtered and sorted array of locations with distances
 */
export function filterByDistance<T extends { location_lat: number; location_lon: number }>(
  referencePoint: { lat: number; lon: number },
  locations: T[],
  maxDistance: number = 50
): (T & { distance: number })[] {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(
        referencePoint.lat,
        referencePoint.lon,
        location.location_lat,
        location.location_lon
      )
    }))
    .filter(location => location.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}