import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Category, Distributor, Property } from '../models/types';
import DistributorMap from './DistributorMap';
import DistributorList from './DistributorList';
import SearchBar from './SearchBar';
import DistributorFilter from './DistributorFilter';
import { CategoryFilter } from './CategoryFilter';
import ProgramSidebar from './ProgramSidebar';
import { ShareMapModal } from './ShareMapModal';
import { getDistributors } from '../api/distributors';
import { Navigation, AlertTriangle, X, MapPin, Menu, Share2, Compass } from 'lucide-react';
import { calculateDistance } from '../utils/distance';

export default function MapPage() {
  const { program } = useParams<{ program: string }>();
  const navigate = useNavigate();

  const [allDistributors, setAllDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['ALL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [showNearestDistributors, setShowNearestDistributors] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const forceBoundsResetRef = useRef(false);

  // Map program URL param to Category type
  const selectedCategory: Category = useMemo(() => {
    const programMap: Record<string, Category> = {
      'all': 'ALL',
      'hvac': 'HVAC',
      'appliances': 'Appliances',
      'flooring': 'Flooring',
      'paint': 'Paint',
      'carpet': 'Carpet',
    };

    const category = programMap[program?.toLowerCase() || 'all'];

    // If invalid program, redirect to /map/all
    if (!category && program) {
      navigate('/map/all', { replace: true });
      return 'ALL';
    }

    return category || 'ALL';
  }, [program, navigate]);

  // Initialize selectedCategories from URL params on mount and when route changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoriesParam = params.get('categories');

    if (categoriesParam) {
      const categories = categoriesParam.split(',') as Category[];
      // Validate categories
      const validCategories = categories.filter(c =>
        ['ALL', 'HVAC', 'Appliances', 'Flooring', 'Paint', 'Carpet'].includes(c)
      );
      if (validCategories.length > 0) {
        setSelectedCategories(validCategories);
      }
    } else if (selectedCategory !== 'ALL') {
      // If no URL param but we have a program route, use that category
      setSelectedCategories([selectedCategory]);
    } else {
      // Reset to 'ALL' when navigating to /map/all
      setSelectedCategories(['ALL']);
    }
  }, [selectedCategory]);

  // Update document title based on current program
  useEffect(() => {
    const title = selectedCategory === 'ALL' ? 'All Programs' : selectedCategory;
    document.title = `${title} | Compass`;
  }, [selectedCategory]);

  // Fetch all distributors on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        const distributorsData = await getDistributors();
        setAllDistributors(distributorsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);

  // Clear selected distributor when filters change
  // This ensures that changing filters shows all matching results rather than
  // staying zoomed on a previously selected distributor
  useEffect(() => {
    setSelectedDistributor(null);
  }, [selectedCategories, selectedDistributors, searchQuery]);

  // Handle finding distributors near user's location
  const handleFindNearMe = () => {
    setIsLocating(true);
    setLocationError(null);

    if (navigator.geolocation) {
      const geolocationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });

          const userLocationProperty: Property = {
            id: 'current-location',
            name: 'Your Location',
            address_line_1: 'Current Location',
            address_city: '',
            address_state: '',
            postal_code: '',
            country: 'US',
            location_lat: latitude,
            location_lon: longitude,
            property_type: 'Current Location'
          };

          setSelectedProperty(userLocationProperty);
          setShowNearestDistributors(true);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your location.';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please check your browser permissions and try again.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again later.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get your location timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while trying to get your location.';
          }

          setLocationError(errorMessage);
          setIsLocating(false);
        },
        geolocationOptions
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle distributor selection
  const handleSelectDistributor = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
  };

  // Clear all filters
  const handleClearFilters = () => {
    forceBoundsResetRef.current = true;
    setSelectedDistributors([]);
    setSelectedCategories(['ALL']);
    setSearchQuery('');
    setSelectedProperty(null);
    setShowNearestDistributors(false);
    setUserLocation(null);
    setLocationError(null);
    setSelectedDistributor(null);
  };

  // Handle share link - open modal
  const handleShareLink = () => {
    setShowShareModal(true);
  };

  // Generate shareable URL based on current filters
  const generateShareUrl = useMemo(() => {
    const url = new URL(window.location.href);

    // Add category filter to URL (only if not 'ALL')
    if (!selectedCategories.includes('ALL') && selectedCategories.length > 0) {
      url.searchParams.set('categories', selectedCategories.join(','));
    }

    // Add filter parameters to URL
    if (selectedDistributors.length > 0) {
      url.searchParams.set('distributors', selectedDistributors.join(','));
    }

    if (searchQuery) {
      url.searchParams.set('search', searchQuery);
    }

    if (showNearestDistributors && selectedProperty) {
      url.searchParams.set('lat', selectedProperty.location_lat.toString());
      url.searchParams.set('lon', selectedProperty.location_lon.toString());
      url.searchParams.set('nearMe', 'true');
    }

    return url.toString();
  }, [selectedCategories, selectedDistributors, searchQuery, showNearestDistributors, selectedProperty]);

  // Memoized filtering for performance with 4K+ distributors
  const filteredDistributors = useMemo(() => {
    let filtered = allDistributors;

    // Category filter (multi-select)
    if (!selectedCategories.includes('ALL') && selectedCategories.length > 0) {
      filtered = filtered.filter(d => selectedCategories.includes(d.program as Category));
    }

    // Distributor filter
    if (selectedDistributors.length > 0) {
      filtered = filtered.filter(d => selectedDistributors.includes(d.distributor));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.distributor?.toLowerCase().includes(query) ||
        d.name?.toLowerCase().includes(query) ||
        d.address_city?.toLowerCase().includes(query) ||
        d.address_state?.toLowerCase().includes(query) ||
        d.partner?.toLowerCase().includes(query)
      );
    }

    // Calculate distances and sort if location-based filtering is active
    if (userLocation || (selectedProperty && showNearestDistributors)) {
      const referencePoint = userLocation ||
        (selectedProperty ? { lat: selectedProperty.location_lat, lon: selectedProperty.location_lon } : null);

      if (referencePoint) {
        filtered = filtered
          .map(distributor => ({
            ...distributor,
            distance: calculateDistance(
              referencePoint.lat,
              referencePoint.lon,
              distributor.location_lat,
              distributor.location_lon
            )
          }))
          .filter(d => d.distance! <= 50) // Only show within 50 miles
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
    }

    return filtered;
  }, [allDistributors, selectedCategories, selectedDistributors, searchQuery, userLocation, selectedProperty, showNearestDistributors]);

  return (
    <>
      {/* Program Drawer */}
      <ProgramSidebar
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        onShareLink={handleShareLink}
      />

      <header className="bg-slate-900 border-b border-slate-800">
        <div className="w-full px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg h-10 w-10 flex items-center justify-center">
              <Compass size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-white">
                Sibi Maps
              </h1>
              <button
                onClick={handleShareLink}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors h-10 w-10 flex items-center justify-center"
                title="Share this map"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-80">
              <SearchBar onSearch={handleSearch} />
            </div>

            <button
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              onClick={handleFindNearMe}
              disabled={isLocating}
              title="Find distributors near your location"
            >
              <Navigation size={16} />
              {isLocating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Locating...
                </span>
              ) : (
                <span>Near Me</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-3 py-3 flex-grow overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-3 h-full">
          <div className="w-full lg:w-72 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden flex flex-col shadow-xl">
            <div className="p-3">

              {locationError && (
                <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-start">
                  <AlertTriangle size={14} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              <div className="space-y-2">
                <CategoryFilter
                  selectedCategories={selectedCategories}
                  onCategoriesChange={setSelectedCategories}
                />
                <DistributorFilter
                  distributors={allDistributors}
                  filteredDistributors={filteredDistributors}
                  selectedDistributors={selectedDistributors}
                  onFilterChange={setSelectedDistributors}
                  currentProgram={selectedCategory}
                />
              </div>

              {(selectedCategories.length > 0 && !selectedCategories.includes('ALL') || selectedDistributors.length > 0 || searchQuery || showNearestDistributors) && (
                <button
                  onClick={handleClearFilters}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 border border-slate-800"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="border-t border-slate-800 flex-grow overflow-hidden">
              <DistributorList
                distributors={filteredDistributors}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onSelectDistributor={handleSelectDistributor}
                showingNearMe={showNearestDistributors || userLocation !== null}
              />
            </div>
          </div>

          <div className="w-full lg:flex-1 flex flex-col h-full">
            {selectedProperty && showNearestDistributors && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <MapPin size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{selectedProperty.name}</h3>
                    <p className="text-xs text-slate-400">
                      Showing within 50 miles
                    </p>
                  </div>
                </div>
                <button
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  onClick={() => {
                    setSelectedProperty(null);
                    setShowNearestDistributors(false);
                    setUserLocation(null);
                  }}
                >
                  Show All
                </button>
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex-grow shadow-xl">
              {loading ? (
                <div className="h-full flex items-center justify-center bg-slate-900">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-slate-400">Loading distributors...</p>
                  </div>
                </div>
              ) : (
                <DistributorMap
                  distributors={filteredDistributors}
                  selectedCategory={selectedCategory}
                  selectedProperty={selectedProperty}
                  selectedDistributor={selectedDistributor}
                  showNearestDistributors={showNearestDistributors}
                  forceBoundsResetRef={forceBoundsResetRef}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Map Modal */}
      <ShareMapModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={generateShareUrl}
      />
    </>
  );
}
