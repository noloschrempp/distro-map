import { useState, useRef, useEffect } from 'react';
import { Distributor, Category } from '../models/types';
import { ChevronDown, ChevronUp, Building2, Fan, Layers, Paintbrush, Waves, ChevronDownCircle, Navigation, MapPin, Phone, Store } from 'lucide-react';
import { formatDistance } from '../utils/distance';

interface DistributorListProps {
  distributors: Distributor[];
  selectedCategory: Category;
  searchQuery: string;
  onSelectDistributor?: (distributor: Distributor) => void;
  showingNearMe?: boolean;
}

export default function DistributorList({ 
  distributors, 
  selectedCategory, 
  searchQuery, 
  onSelectDistributor,
  showingNearMe = false
}: DistributorListProps) {
  const [expandedDistributor, setExpandedDistributor] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  
  // Filter distributors based on category
  const filteredDistributors = selectedCategory === 'ALL'
    ? distributors
    : distributors.filter(d => d.program === selectedCategory);
  
  // Filter by search query if provided
  const searchedDistributors = searchQuery
    ? filteredDistributors.filter(d => 
        d.distributor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.address_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.address_state?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredDistributors;
  
  // Sort distributors by distance if distance is available or we're showing near me
  const sortedDistributors = [...searchedDistributors].sort((a, b) => {
    // If showing near me, prioritize sorting by distance
    if (showingNearMe) {
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    // Otherwise, use the standard sorting logic
    // If both have distance, sort by distance
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    // If only a has distance, a comes first
    if (a.distance !== undefined) return -1;
    // If only b has distance, b comes first
    if (b.distance !== undefined) return 1;
    // Otherwise, sort by name
    return (a.name || '').localeCompare(b.name || '');
  });
  
  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    setExpandedDistributor(prevId => prevId === id ? null : id);
  };
  
  // Handle distributor selection
  const handleDistributorClick = (distributor: Distributor) => {
    if (onSelectDistributor) {
      onSelectDistributor(distributor);
    }
    toggleExpanded(distributor.id);
  };
  
  // Check if scroll indicator should be shown
  useEffect(() => {
    const checkScroll = () => {
      if (listRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        setShowScrollIndicator(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 20);
      }
    };
    
    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', checkScroll);
      return () => listElement.removeEventListener('scroll', checkScroll);
    }
  }, [sortedDistributors, expandedDistributor]);
  
  // Get icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return <Fan size={20} className="text-blue-500" />;
      case 'Appliances': return <Building2 size={20} className="text-green-500" />;
      case 'Flooring': return <Layers size={20} className="text-orange-500" />;
      case 'Paint': return <Paintbrush size={20} className="text-pink-500" />;
      case 'Carpet': return <Waves size={20} className="text-purple-500" />;
      default: return <Building2 size={20} className="text-gray-500" />;
    }
  };
  
  // Check if any distributor has distance information
  const hasDistances = sortedDistributors.some(d => d.distance !== undefined);
  
  return (
    <div className="h-full flex flex-col relative">
      {showingNearMe && hasDistances && (
        <div className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20">
          <p className="text-sm text-blue-400 flex items-center">
            <Navigation size={14} className="mr-1.5" />
            Showing distributors sorted by distance
          </p>
        </div>
      )}
      
      <div 
        ref={listRef}
        className="h-full overflow-y-auto distributor-list"
      >
        {sortedDistributors.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No distributors found for your search.
          </div>
        ) : (
          sortedDistributors.map(distributor => (
            <div
              key={distributor.id}
              className="overflow-hidden border-b border-slate-800 last:border-b-0"
            >
              <button
                className="w-full px-5 py-3.5 flex justify-between items-start cursor-pointer hover:bg-slate-800/50 transition-colors text-left"
                onClick={() => handleDistributorClick(distributor)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(distributor.program)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base leading-tight text-white">{distributor.distributor}</h3>
                    <p className="text-slate-400 mt-1 text-sm">{distributor.address_city}, {distributor.address_state}</p>
                    {distributor.distance !== undefined && (
                      <div className="mt-1.5 flex items-center">
                        <Navigation size={12} className="text-blue-400 mr-1" />
                        <span className="text-blue-400 text-xs font-medium">
                          {formatDistance(distributor.distance)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronDown size={20} className={`text-slate-400 transition-transform ${expandedDistributor === distributor.id ? 'rotate-180' : ''}`} />
              </button>

              {expandedDistributor === distributor.id && (
                <div className="px-6 pb-5 pt-2 border-t border-slate-800 bg-slate-900">
                  <div className="mt-3">
                    <div className="flex">
                      <MapPin size={16} className="text-slate-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${distributor.address_line_1}, ${distributor.address_city}, ${distributor.address_state} ${distributor.postal_code}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-blue-400 transition-colors"
                        >
                          <p className="leading-snug">{distributor.address_line_1}</p>
                          {distributor.address_line_2 && (
                            <p className="leading-snug">{distributor.address_line_2}</p>
                          )}
                          <p className="leading-snug text-slate-400">
                            {distributor.address_city}, {distributor.address_state} {distributor.postal_code}
                          </p>
                        </a>
                      </div>
                    </div>

                    {distributor.contact_phone && (
                      <div className="mt-3 flex items-center">
                        <Phone size={16} className="text-slate-400 mr-2" />
                        <a href={`tel:${distributor.contact_phone}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                          {distributor.contact_phone}
                        </a>
                      </div>
                    )}

                    {distributor.store_number && (
                      <div className="mt-3 flex items-center text-slate-400">
                        <Store size={16} className="mr-2" />
                        <span>Store #{distributor.store_number}</span>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {distributor.fulfill_delivery && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Delivery Available
                        </span>
                      )}
                      {distributor.fulfill_pickup && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Pickup Available
                        </span>
                      )}
                    </div>

                    {distributor.distribution_center_manufacturers && distributor.distribution_center_manufacturers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs font-medium text-slate-400 mb-2">Available Manufacturers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {distributor.distribution_center_manufacturers.map((manufacturer, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300"
                            >
                              {manufacturer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Add extra space at the bottom to ensure the scroll indicator doesn't cover content */}
        <div className="h-16"></div>
      </div>
      
      {/* Subtle scroll indicator with gradient effect */}
      {showScrollIndicator && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="h-20 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400">More</span>
              <ChevronDownCircle size={18} className="text-slate-400 animate-gentle-bounce mt-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}