import { useState, useEffect, useMemo, useRef } from 'react';
import { Distributor, Category } from '../models/types';
import { Filter, X, Check, Search } from 'lucide-react';

interface DistributorFilterProps {
  distributors: Distributor[]; // All distributors for options
  filteredDistributors: Distributor[]; // Currently filtered distributors for counts
  selectedDistributors: string[];
  onFilterChange: (distributors: string[]) => void;
  currentProgram?: Category; // Current program filter
}

export default function DistributorFilter({
  distributors,
  selectedDistributors,
  onFilterChange,
  currentProgram = 'ALL'
}: DistributorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique distributor names and their total location counts from program-filtered distributors
  const { allDistributorNames, totalDistributorCounts } = useMemo(() => {
    const names = new Set<string>();
    const counts = new Map<string, number>();

    // Filter distributors by current program first
    const programFilteredDistributors = currentProgram === 'ALL'
      ? distributors
      : distributors.filter(d => d.program === currentProgram);

    programFilteredDistributors.forEach(d => {
      if (d.distributor) {
        names.add(d.distributor);
        counts.set(d.distributor, (counts.get(d.distributor) || 0) + 1);
      }
    });

    return {
      allDistributorNames: Array.from(names).sort(),
      totalDistributorCounts: counts
    };
  }, [distributors, currentProgram]);

  // Auto-clear invalid selections when program filter changes
  useEffect(() => {
    if (selectedDistributors.length === 0) return;

    // Check if any selected distributors are no longer in the available list
    const invalidSelections = selectedDistributors.filter(
      selected => !allDistributorNames.includes(selected)
    );

    // If there are invalid selections, remove them
    if (invalidSelections.length > 0) {
      const validSelections = selectedDistributors.filter(
        selected => allDistributorNames.includes(selected)
      );
      onFilterChange(validSelections);
    }
  }, [allDistributorNames, selectedDistributors, onFilterChange]);

  // Filter distributor names based on search
  const filteredNames = useMemo(() => {
    if (!searchQuery) return allDistributorNames;
    const query = searchQuery.toLowerCase();
    return allDistributorNames.filter(name => 
      name.toLowerCase().includes(query)
    );
  }, [allDistributorNames, searchQuery]);

  // Handle distributor selection
  const toggleDistributor = (distributor: string) => {
    if (selectedDistributors.includes(distributor)) {
      onFilterChange(selectedDistributors.filter(d => d !== distributor));
    } else {
      onFilterChange([...selectedDistributors, distributor]);
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
          selectedDistributors.length > 0
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Filter size={14} />
          <span className="text-sm">
            {selectedDistributors.length === 0
              ? 'Distributor'
              : `${selectedDistributors.length} Selected`}
          </span>
        </div>
        {selectedDistributors.length > 0 && (
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {selectedDistributors.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 border border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-slate-900 text-white placeholder-slate-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredNames.map(distributor => (
              <button
                key={distributor}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleDistributor(distributor);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  selectedDistributors.includes(distributor)
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                  selectedDistributors.includes(distributor)
                    ? 'bg-blue-500'
                    : 'border-2 border-slate-600'
                }`}>
                  {selectedDistributors.includes(distributor) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="flex-grow text-left truncate">{distributor}</span>
                <span className="text-slate-500 text-xs tabular-nums">
                  {totalDistributorCounts.get(distributor) || 0}
                </span>
              </button>
            ))}

            {filteredNames.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No distributors found
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

      {selectedDistributors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedDistributors.map(distributor => (
            <span
              key={distributor}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
            >
              {distributor}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleDistributor(distributor);
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