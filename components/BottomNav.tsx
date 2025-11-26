import React from 'react';
import { Home, Search, Heart, User } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'saved', icon: Heart, label: 'Saved' },
    { id: 'profile', icon: User, label: 'Account' },
  ] as const;

  // Map sub-views to main nav items for active state
  const activeMap: Record<string, string> = {
    'home': 'home',
    'search': 'search',
    'details': 'search',
    'itinerary': 'search',
    'saved': 'saved',
    'profile': 'profile'
  };

  const activeTab = activeMap[currentView] || 'home';

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-40 transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
              activeTab === item.id 
                ? 'text-blue-600 dark:text-blue-500 scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};