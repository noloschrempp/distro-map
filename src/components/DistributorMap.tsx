import { useEffect, useRef, useState } from 'react';
import { Category, Distributor, Property } from '../models/types';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone } from 'lucide-react';

interface DistributorMapProps {
  distributors: Distributor[];
  selectedCategory: Category;
  userProperties?: Property[];
  selectedProperty?: Property | null;
  selectedDistributor?: Distributor | null;
  onSelectProperty?: (property: Property) => void;
  showNearestDistributors?: boolean;
  forceBoundsResetRef?: React.MutableRefObject<boolean>;
}

function MapBoundsUpdater({
  distributors,
  userProperties,
  selectedProperty,
  selectedDistributor,
  selectedCategory,
  showNearestDistributors,
  forceBoundsResetRef
}: {
  distributors: Distributor[];
  userProperties?: Property[];
  selectedProperty?: Property | null;
  selectedDistributor?: Distributor | null;
  selectedCategory: Category;
  showNearestDistributors?: boolean;
  forceBoundsResetRef?: React.MutableRefObject<boolean>;
}) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  const boundsUpdateTimeout = useRef<NodeJS.Timeout>();
  const mapInitialized = useRef(false);
  const prevDistributorsCount = useRef(distributors.length);

  // Listen for centerMap events
  useEffect(() => {
    const handleCenterMap = (e: CustomEvent) => {
      const { lat, lon } = e.detail;
      map.setView([lat, lon], 14, { animate: true });
    };

    window.addEventListener('centerMap' as any, handleCenterMap as any);
    return () => window.removeEventListener('centerMap' as any, handleCenterMap as any);
  }, [map]);

  // Handle map initialization
  useEffect(() => {
    if (!map || mapInitialized.current) return;

    const checkMap = setInterval(() => {
      try {
        if (map.getContainer() && map._loaded && map.getPane('mapPane')?._leaflet_pos) {
          clearInterval(checkMap);
          setIsMapReady(true);
          mapInitialized.current = true;
          
          // Initial bounds fit
          updateBounds();
        }
      } catch (error) {
        console.warn('Map not ready yet, retrying...');
      }
    }, 100);

    return () => clearInterval(checkMap);
  }, [map]);

  // Function to update map bounds
  const updateBounds = () => {
    if (!map || !isMapReady || !map.getPane('mapPane')?._leaflet_pos) {
      return;
    }

    try {
      // PRIORITY 0: Explicit bounds reset (e.g., from clearing filters)
      // This handles the React 18 batching issue where multiple state updates
      // happen simultaneously. By using a ref instead of state, we provide a
      // synchronous signal that survives the batching cycle and ensures the
      // map resets to show all distributors when filters are cleared.
      if (forceBoundsResetRef?.current) {
        forceBoundsResetRef.current = false; // Reset the flag

        // Force fit to all distributors
        const bounds = L.latLngBounds([]);
        let hasValidPoints = false;

        distributors.forEach(loc => {
          if (loc.location_lat && loc.location_lon &&
              !isNaN(loc.location_lat) && !isNaN(loc.location_lon)) {
            bounds.extend([loc.location_lat, loc.location_lon]);
            hasValidPoints = true;
          }
        });

        if (userProperties?.length) {
          userProperties.forEach(prop => {
            if (prop.location_lat && prop.location_lon &&
                !isNaN(prop.location_lat) && !isNaN(prop.location_lon)) {
              bounds.extend([prop.location_lat, prop.location_lon]);
              hasValidPoints = true;
            }
          });
        }

        if (hasValidPoints && bounds.isValid()) {
          const maxZoom = distributors.length === 1 ? 14 : distributors.length <= 5 ? 10 : 12;
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: maxZoom,
            animate: true,
            duration: 0.5
          });
        } else {
          map.setView([39.8283, -98.5795], 4, { animate: true });
        }
        return; // Exit early - don't check other priorities
      }

      // PRIORITY 1: If we have a selected property and showNearestDistributors is true,
      // zoom to that location with a closer view
      if (selectedProperty && showNearestDistributors) {
        if (selectedProperty.location_lat && selectedProperty.location_lon) {
          map.setView(
            [selectedProperty.location_lat, selectedProperty.location_lon],
            10,
            { animate: true, duration: 0.5 }
          );
          return;
        }
      }

      // If a distributor is selected, focus on it
      if (selectedDistributor?.location_lat && selectedDistributor?.location_lon) {
        map.setView(
          [selectedDistributor.location_lat, selectedDistributor.location_lon],
          14,
          { animate: true, duration: 0.5 }
        );
        return;
      }

      // Otherwise, fit bounds to show all visible markers
      const bounds = L.latLngBounds([]);
      let hasValidPoints = false;

      // Add distributors to bounds
      distributors.forEach(loc => {
        if (loc.location_lat && loc.location_lon &&
            !isNaN(loc.location_lat) && !isNaN(loc.location_lon)) {
          bounds.extend([loc.location_lat, loc.location_lon]);
          hasValidPoints = true;
        }
      });

      // Add user properties to bounds
      if (userProperties?.length) {
        userProperties.forEach(prop => {
          if (prop.location_lat && prop.location_lon &&
              !isNaN(prop.location_lat) && !isNaN(prop.location_lon)) {
            bounds.extend([prop.location_lat, prop.location_lon]);
            hasValidPoints = true;
          }
        });
      }

      // If we have valid bounds, fit the map to them
      if (hasValidPoints && bounds.isValid()) {
        // Use different zoom levels based on number of markers
        const maxZoom = distributors.length === 1 ? 14 : distributors.length <= 5 ? 10 : 12;
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: maxZoom,
          animate: true,
          duration: 0.5
        });
      } else {
        // Default view of continental US if no valid points
        map.setView([39.8283, -98.5795], 4, { animate: true });
      }
    } catch (error) {
      console.error("Error updating map bounds:", error);
      // Fallback to default view
      map.setView([39.8283, -98.5795], 4);
    }
  };

  // Update bounds when data changes
  useEffect(() => {
    if (!map || !isMapReady) return;

    // Detect if we're transitioning from filtered to unfiltered (significant increase)
    // This allows us to skip the 100ms delay for better UX when clearing filters
    const distributorCountIncreased = distributors.length > prevDistributorsCount.current * 2;
    const isUnfiltering = distributorCountIncreased &&
                         !selectedProperty &&
                         !showNearestDistributors &&
                         !selectedDistributor;

    // Update the ref for next comparison
    prevDistributorsCount.current = distributors.length;

    // Clear any pending timeout
    if (boundsUpdateTimeout.current) {
      clearTimeout(boundsUpdateTimeout.current);
    }

    // Skip delay if we're explicitly resetting or doing a major unfilter
    const shouldSkipDelay = forceBoundsResetRef?.current || isUnfiltering;

    if (shouldSkipDelay) {
      // Execute immediately for filter clears
      if (map.getPane('mapPane')?._leaflet_pos) {
        updateBounds();
      }
    } else {
      // Delay bounds update to prevent race conditions for normal updates
      boundsUpdateTimeout.current = setTimeout(() => {
        if (map.getPane('mapPane')?._leaflet_pos) {
          updateBounds();
        }
      }, 100);
    }

    return () => {
      if (boundsUpdateTimeout.current) {
        clearTimeout(boundsUpdateTimeout.current);
      }
    };
  }, [map, distributors, userProperties, selectedCategory, selectedProperty, selectedDistributor, showNearestDistributors, isMapReady]);

  return null;
}

function DistributorMap({
  distributors,
  selectedCategory,
  userProperties,
  selectedProperty,
  selectedDistributor,
  onSelectProperty,
  showNearestDistributors,
  forceBoundsResetRef
}: DistributorMapProps) {
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [markerSize, setMarkerSize] = useState({ 
    distributor: { width: 32, height: 32, iconSize: 16 },
    property: { width: 36, height: 36, iconSize: 18 },
    currentLocation: { width: 40, height: 40, iconSize: 20 }
  });

  // Default center of continental US
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Create custom icons for each category
  const getIcons = () => ({
    'HVAC': createCategoryIcon('#1E88E5', 'fan', markerSize.distributor),
    'Appliances': createCategoryIcon('#4CAF50', 'building', markerSize.distributor),
    'Flooring': createCategoryIcon('#FF9800', 'layers', markerSize.distributor),
    'Paint': createCategoryIcon('#E91E63', 'paintbrush', markerSize.distributor),
    'Carpet': createCategoryIcon('#9C27B0', 'waves', markerSize.distributor),
    'Property': createPropertyIcon('#5E35B1', markerSize.property),
    'CurrentLocation': createCurrentLocationIcon('#FF5722', markerSize.currentLocation)
  });

  // Helper to create category-specific marker icons with Lucide icons
  const createCategoryIcon = (color: string, iconType: string, size: { width: number, height: number, iconSize: number }) => {
    let iconSvg = '';

    switch (iconType) {
      case 'fan':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"/><path d="M12 12v.01"/></svg>`;
        break;
      case 'building':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V2a1 1 0 0 1 1-1h9.97a1 1 0 0 1 1.03 1v3"/><path d="M12 10H6"/><path d="M12 14H6"/><path d="M16 22V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v15"/><path d="M22 11h-5"/><path d="M22 15h-5"/><path d="M2 22h20"/></svg>`;
        break;
      case 'layers':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.18-8.58 3.91a2 2 0 0 1-1.66 0L2 12.18"/><path d="m22 17.18-8.58 3.91a2 2 0 0 1-1.66 0L2 17.18"/></svg>`;
        break;
      case 'paintbrush':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 14 7l-1.74-1.74a1 1 0 0 0-1.42 0L9.11 7l-7.37 7.37a1 1 0 0 0 0 1.42l5.5 5.5a1 1 0 0 0 1.42 0L16 14l1.74 1.74a1 1 0 0 0 1.42 0l1.74-1.74 4-4a1 1 0 0 0 0-1.42l-5.5-5.5a1 1 0 0 0-1.42 0Z"/><path d="m2.27 18.1 3.64-3.64 3.63 3.63"/></svg>`;
        break;
      case 'waves':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
        break;
      default:
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V2a1 1 0 0 1 1-1h9.97a1 1 0 0 1 1.03 1v3"/><path d="M12 10H6"/><path d="M12 14H6"/><path d="M16 22V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v15"/><path d="M22 11h-5"/><path d="M22 15h-5"/><path d="M2 22h20"/></svg>`;
    }

    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="background-color: ${color}; width: ${size.width}px; height: ${size.height}px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          ${iconSvg}
        </div>
      `,
      iconSize: [size.width, size.height],
      iconAnchor: [size.width/2, size.height/2],
      popupAnchor: [0, -size.height/2]
    });
  };

  // Helper to create property marker icon
  const createPropertyIcon = (color: string, size: { width: number, height: number, iconSize: number }) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="background-color: ${color}; width: ${size.width}px; height: ${size.height}px; transform: rotate(45deg); display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [size.width, size.height],
      iconAnchor: [size.width/2, size.height/2],
      popupAnchor: [0, -size.height/2]
    });
  };

  // Helper to create current location marker icon
  const createCurrentLocationIcon = (color: string, size: { width: number, height: number, iconSize: number }) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="background-color: ${color}; width: ${size.width}px; height: ${size.height}px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border: 4px solid rgba(255,87,34,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="${size.iconSize}" height="${size.iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </div>
      `,
      iconSize: [size.width, size.height],
      iconAnchor: [size.width/2, size.height/2],
      popupAnchor: [0, -size.height/2]
    });
  };

  // Update filtered distributors when props change
  useEffect(() => {
    // Distributors are already filtered in MapPage, just validate coordinates
    const filtered = distributors.filter(d =>
      d.location_lat != null && d.location_lon != null &&
      !isNaN(d.location_lat) && !isNaN(d.location_lon)
    );

    setFilteredDistributors(filtered);

    // Dynamically adjust marker size based on the number of markers
    const totalMarkers = filtered.length + (userProperties?.length || 0);
    if (totalMarkers > 50) {
      setMarkerSize({
        distributor: { width: 20, height: 20, iconSize: 10 },
        property: { width: 24, height: 24, iconSize: 12 },
        currentLocation: { width: 28, height: 28, iconSize: 14 }
      });
    } else if (totalMarkers > 30) {
      setMarkerSize({
        distributor: { width: 24, height: 24, iconSize: 12 },
        property: { width: 28, height: 28, iconSize: 14 },
        currentLocation: { width: 32, height: 32, iconSize: 16 }
      });
    } else {
      setMarkerSize({
        distributor: { width: 32, height: 32, iconSize: 16 },
        property: { width: 36, height: 36, iconSize: 18 },
        currentLocation: { width: 40, height: 40, iconSize: 20 }
      });
    }
  }, [distributors, userProperties?.length]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
      whenReady={() => setMapReady(true)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      
      <MapBoundsUpdater
        distributors={distributors}
        userProperties={userProperties}
        selectedProperty={selectedProperty}
        selectedDistributor={selectedDistributor}
        selectedCategory={selectedCategory}
        showNearestDistributors={showNearestDistributors}
        forceBoundsResetRef={forceBoundsResetRef}
      />

      {mapReady && (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          disableClusteringAtZoom={11}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let size = 16;
            let color = '#3B82F6'; // blue-500

            if (count > 100) {
              size = 28;
              color = '#2563EB'; // blue-600
            } else if (count > 50) {
              size = 24;
              color = '#3B82F6'; // blue-500
            } else if (count > 20) {
              size = 20;
              color = '#60A5FA'; // blue-400
            }

            return L.divIcon({
              html: `
                <div style="
                  background: ${color};
                  width: ${size}px;
                  height: ${size}px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  position: relative;
                ">
                  <div style="
                    background: ${color};
                    width: ${size + 12}px;
                    height: ${size + 12}px;
                    border-radius: 50%;
                    position: absolute;
                    opacity: 0.2;
                    animation: pulse 2s infinite;
                  "></div>
                </div>
              `,
              className: 'cluster-marker-custom',
              iconSize: L.point(size + 12, size + 12),
              iconAnchor: [size / 2 + 6, size / 2 + 6]
            });
          }}
        >
          {filteredDistributors.map(distributor => (
            <Marker
              key={distributor.id}
              position={[distributor.location_lat, distributor.location_lon]}
              icon={getIcons()[distributor.program as keyof ReturnType<typeof getIcons>] || getIcons().HVAC}
            >
              <Popup className="distributor-popup">
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{distributor.distributor}</h3>
                  <p className="text-gray-600">{distributor.name}</p>
                  <div className="mt-2">
                    <p>{distributor.address_line_1}</p>
                    <p>{distributor.address_city}, {distributor.address_state} {distributor.postal_code}</p>
                  </div>
                  {distributor.contact_phone && (
                    <p className="mt-2">
                      <Phone size={14} className="inline mr-1" />
                      <a href={`tel:${distributor.contact_phone}`} className="text-blue-600 hover:underline">
                        {distributor.contact_phone}
                      </a>
                    </p>
                  )}
                  {distributor.distance && (
                    <p className="mt-2 text-sm text-gray-500">
                      Distance: {distributor.distance.toFixed(1)} miles
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      )}

      {mapReady && userProperties?.map(property => (
        <Marker
          key={property.id}
          position={[property.location_lat, property.location_lon]}
          icon={getIcons().Property}
          eventHandlers={{
            click: () => onSelectProperty?.(property)
          }}
        >
          <Popup>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{property.name}</h3>
              <p className="text-gray-600">{property.property_type}</p>
              <div className="mt-2">
                <p>{property.address_line_1}</p>
                <p>{property.address_city}, {property.address_state} {property.postal_code}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {mapReady && selectedProperty?.id === 'current-location' && (
        <Marker
          position={[selectedProperty.location_lat, selectedProperty.location_lon]}
          icon={getIcons().CurrentLocation}
        >
          <Popup>
            <div className="p-4">
              <h3 className="text-lg font-semibold">Your Location</h3>
              <p className="text-gray-600">Showing nearby distributors</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default DistributorMap;