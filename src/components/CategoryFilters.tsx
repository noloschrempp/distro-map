import { useRef, useEffect, useState } from 'react';
import { Category } from '../models/types';
import { Building2, Fan, Layers, Paintbrush, Waves, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFiltersProps {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
}

export default function CategoryFilters({ selectedCategory, setSelectedCategory }: CategoryFiltersProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const categories: { value: Category; label: string; icon: JSX.Element }[] = [
    { value: 'ALL', label: 'All', icon: <Building2 size={16} /> },
    { value: 'Appliances', label: 'Appliances', icon: <Building2 size={16} /> },
    { value: 'HVAC', label: 'HVAC', icon: <Fan size={16} /> },
    { value: 'Flooring', label: 'Flooring', icon: <Layers size={16} /> },
    { value: 'Paint', label: 'Paint', icon: <Paintbrush size={16} /> },
    { value: 'Carpet', label: 'Carpet', icon: <Waves size={16} /> },
  ];

  // Check if scroll buttons should be shown
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      // Check on window resize
      window.addEventListener('resize', checkScroll);

      return () => {
        scrollContainer.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  // Scroll functions
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; // Adjust scroll amount as needed
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Left scroll button */}
      {showLeftScroll && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-r from-slate-900 via-slate-900 to-transparent"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center gap-2 px-1">
          {categories.map((category) => (
            <button
              key={category.value}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 min-w-[100px] ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.icon}
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right scroll button */}
      {showRightScroll && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 h-full px-2 flex items-center justify-center bg-gradient-to-l from-slate-900 via-slate-900 to-transparent"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
}