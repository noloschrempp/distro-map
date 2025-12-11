import React, { useState, useRef, useEffect } from 'react';
import { Category } from '../models/types';
import { ChevronDown, Filter, Building2, Fan, Layers, Paintbrush, Waves, Check, X } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const CATEGORY_OPTIONS: { value: Category; label: string; icon: JSX.Element; color: string }[] = [
  { value: 'HVAC', label: 'HVAC', icon: <Fan size={14} />, color: 'text-blue-400' },
  { value: 'Appliances', label: 'Appliances', icon: <Building2 size={14} />, color: 'text-green-400' },
  { value: 'Flooring', label: 'Flooring', icon: <Layers size={14} />, color: 'text-orange-400' },
  { value: 'Paint', label: 'Paint', icon: <Paintbrush size={14} />, color: 'text-pink-400' },
  { value: 'Carpet', label: 'Carpet', icon: <Waves size={14} />, color: 'text-purple-400' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoriesChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleToggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      // Remove category
      const newCategories = selectedCategories.filter(c => c !== category);
      onCategoriesChange(newCategories.length === 0 ? ['ALL'] : newCategories);
    } else {
      // Add category (remove 'ALL' if it exists)
      const newCategories = selectedCategories.filter(c => c !== 'ALL');
      onCategoriesChange([...newCategories, category]);
    }
  };

  const handleSelectAll = () => {
    onCategoriesChange(['ALL']);
  };

  const isAllSelected = selectedCategories.includes('ALL') || selectedCategories.length === 0;
  const activeCount = isAllSelected ? 0 : selectedCategories.length;

  // Get display text
  const getDisplayText = () => {
    if (isAllSelected) {
      return 'All Programs';
    }
    if (selectedCategories.length === 1) {
      const category = CATEGORY_OPTIONS.find(opt => opt.value === selectedCategories[0]);
      return category?.label || 'Programs';
    }
    return `${selectedCategories.length} Programs`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200 ${
          activeCount > 0
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Filter size={14} className="flex-shrink-0" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        {activeCount > 0 && (
          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto p-2">
            {/* All Programs Option */}
            <button
              onClick={handleSelectAll}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                isAllSelected
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                  isAllSelected
                    ? 'bg-blue-500'
                    : 'border-2 border-slate-600'
                }`}
              >
                {isAllSelected && <Check size={12} className="text-white" />}
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Building2 size={14} className="text-slate-400" />
                <span className="font-medium">All Programs</span>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-slate-700 my-1"></div>

            {/* Individual Program Options */}
            {CATEGORY_OPTIONS.map((option) => {
              const isSelected = selectedCategories.includes(option.value);

              return (
                <button
                  key={option.value}
                  onClick={() => handleToggleCategory(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-500'
                        : 'border-2 border-slate-600'
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className={option.color}>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Programs Pills */}
      {!isAllSelected && selectedCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCategories.map(category => {
            const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
            if (!option) return null;

            return (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30"
              >
                <span className={option.color}>{option.icon}</span>
                {option.label}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleCategory(category);
                  }}
                  className="ml-1 p-0.5 hover:bg-blue-500/30 rounded-full transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
