import { useState, useEffect, useMemo, useRef } from 'react';
import { Distributor } from '../models/types';
import { Users, X, Check, Search } from 'lucide-react';

interface PartnerFilterProps {
  distributors: Distributor[]; // All distributors for options
  filteredDistributors: Distributor[]; // Currently filtered distributors for counts
  selectedPartners: string[];
  onFilterChange: (partners: string[]) => void;
}

export default function PartnerFilter({
  distributors,
  selectedPartners,
  onFilterChange
}: PartnerFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique partner names and their total location counts from all distributors
  const { allPartnerNames, totalPartnerCounts } = useMemo(() => {
    const names = new Set<string>();
    const counts = new Map<string, number>();

    distributors.forEach(d => {
      if (d.partner) {
        names.add(d.partner);
        counts.set(d.partner, (counts.get(d.partner) || 0) + 1);
      }
    });

    return {
      allPartnerNames: Array.from(names).sort(),
      totalPartnerCounts: counts
    };
  }, [distributors]);

  // Filter partner names based on search
  const filteredNames = useMemo(() => {
    if (!searchQuery) return allPartnerNames;
    const query = searchQuery.toLowerCase();
    return allPartnerNames.filter(name =>
      name.toLowerCase().includes(query)
    );
  }, [allPartnerNames, searchQuery]);

  // Handle partner selection
  const togglePartner = (partner: string) => {
    if (selectedPartners.includes(partner)) {
      onFilterChange(selectedPartners.filter(p => p !== partner));
    } else {
      onFilterChange([...selectedPartners, partner]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    onFilterChange([]);
    setSearchQuery('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 ${
          selectedPartners.length > 0
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span className="text-sm">
            {selectedPartners.length === 0
              ? 'Filter by Partner'
              : `${selectedPartners.length} Selected`}
          </span>
        </div>
        {selectedPartners.length > 0 && (
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {selectedPartners.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50">
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search partners..."
                className="w-full pl-9 pr-4 py-2 border border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900 text-white placeholder-slate-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredNames.map(partner => (
              <button
                key={partner}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePartner(partner);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  selectedPartners.includes(partner)
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                  selectedPartners.includes(partner)
                    ? 'bg-blue-500'
                    : 'border-2 border-slate-600'
                }`}>
                  {selectedPartners.includes(partner) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="flex-grow text-left truncate">{partner}</span>
                <span className="text-slate-500 text-xs tabular-nums">
                  {totalPartnerCounts.get(partner) || 0}
                </span>
              </button>
            ))}

            {filteredNames.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No partners found
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearFilters();
              }}
              className="w-full px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <X size={12} />
              Clear
            </button>
          </div>
        </div>
      )}

      {selectedPartners.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPartners.map(partner => (
            <span
              key={partner}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
            >
              {partner}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePartner(partner);
                }}
                className="ml-1 p-0.5 hover:bg-blue-500/30 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
