import { ChangeEvent, useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2 } from 'lucide-react';
import { Property } from '../models/types';
import { clientProperties } from '../data/properties';
import { mockDistributors } from '../data/distributors';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

interface SearchResult {
  type: 'property' | 'distributor' | 'city';
  title: string;
  subtitle: string;
  id?: string;
  lat?: number;
  lon?: number;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input change
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
    
    if (value.length >= 2) {
      const results: SearchResult[] = [];
      const searchLower = value.toLowerCase();
      
      // Search properties
      clientProperties.forEach(property => {
        if (
          property.name.toLowerCase().includes(searchLower) ||
          property.address_city.toLowerCase().includes(searchLower) ||
          property.address_state.toLowerCase().includes(searchLower)
        ) {
          results.push({
            type: 'property',
            title: property.name,
            subtitle: `${property.address_city}, ${property.address_state}`,
            id: property.id,
            lat: property.location_lat,
            lon: property.location_lon
          });
        }
      });
      
      // Search distributors
      mockDistributors.forEach(distributor => {
        if (
          distributor.name.toLowerCase().includes(searchLower) ||
          distributor.distributor.toLowerCase().includes(searchLower)
        ) {
          results.push({
            type: 'distributor',
            title: distributor.distributor,
            subtitle: `${distributor.address_city}, ${distributor.address_state}`,
            id: distributor.id,
            lat: distributor.location_lat,
            lon: distributor.location_lon
          });
        }
      });
      
      // Search unique cities
      const cities = new Set<string>();
      mockDistributors.forEach(distributor => {
        const cityState = `${distributor.address_city}, ${distributor.address_state}`;
        if (
          !cities.has(cityState) &&
          (distributor.address_city.toLowerCase().includes(searchLower) ||
           distributor.address_state.toLowerCase().includes(searchLower))
        ) {
          cities.add(cityState);
          results.push({
            type: 'city',
            title: cityState,
            subtitle: `${distributor.postal_code}`,
            lat: distributor.location_lat,
            lon: distributor.location_lon
          });
        }
      });
      
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Handle clicking outside of search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    setSearchTerm(result.title);
    setShowResults(false);
    onSearch(result.title);

    // If coordinates are available, center the map (you'll need to implement this)
    if (result.lat && result.lon) {
      // Emit an event or call a callback to center the map
      window.dispatchEvent(new CustomEvent('centerMap', {
        detail: { lat: result.lat, lon: result.lon }
      }));
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500" />
        </div>
        <input
          type="text"
          className="w-full h-10 pl-10 pr-4 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-800 text-white placeholder-slate-500 text-sm transition-all duration-200"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-h-96 overflow-y-auto z-50">
          {searchResults.map((result, index) => (
            <button
              key={`${result.type}-${index}`}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-start gap-3 border-b border-slate-700 last:border-b-0 transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <div className="mt-0.5">
                {result.type === 'property' && (
                  <Building2 size={16} className="text-blue-400" />
                )}
                {result.type === 'distributor' && (
                  <MapPin size={16} className="text-cyan-400" />
                )}
                {result.type === 'city' && (
                  <MapPin size={16} className="text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{result.title}</div>
                <div className="text-xs text-slate-400">{result.subtitle}</div>
                <div className="text-xs text-slate-500 mt-0.5 capitalize">
                  {result.type}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}