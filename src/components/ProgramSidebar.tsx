import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Category } from '../models/types';
import { Building2, Fan, Layers, Paintbrush, Waves, Share2, X } from 'lucide-react';

interface ProgramSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onShareLink: () => void;
}

export default function ProgramSidebar({ isOpen, onToggle, onShareLink }: ProgramSidebarProps) {
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);

  const programs: { value: Category; label: string; path: string; icon: JSX.Element }[] = [
    { value: 'ALL', label: 'All Programs', path: '/map/all', icon: <Building2 size={16} /> },
    { value: 'HVAC', label: 'HVAC', path: '/map/hvac', icon: <Fan size={16} /> },
    { value: 'Appliances', label: 'Appliances', path: '/map/appliances', icon: <Building2 size={16} /> },
    { value: 'Flooring', label: 'Flooring', path: '/map/flooring', icon: <Layers size={16} /> },
    { value: 'Paint', label: 'Paint', path: '/map/paint', icon: <Paintbrush size={16} /> },
    { value: 'Carpet', label: 'Carpet', path: '/map/carpet', icon: <Waves size={16} /> },
  ];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        const toggleButton = document.querySelector('[data-drawer-toggle]');
        if (toggleButton && toggleButton.contains(event.target as Node)) {
          return; // Don't close if clicking the toggle button
        }
        if (isOpen) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onToggle}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-80 bg-slate-900 border-r border-slate-800 z-[9999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Programs
            </h3>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Program list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {programs.map((program) => {
                const isActive = location.pathname === program.path;

                return (
                  <NavLink
                    key={program.path}
                    to={program.path}
                    onClick={onToggle}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {program.icon}
                    <span>{program.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Share button at bottom */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={onShareLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
            >
              <Share2 size={16} />
              <span className="text-sm font-medium">Share This Map</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
