import React from 'react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const dates = [
    { id: 'all', label: 'Any Date' },
    { id: 'today', label: 'Today' },
    { id: 'weekend', label: 'This Weekend' },
    { id: 'next7days', label: 'Next 7 Days' },
    { id: 'month', label: 'This Month' },
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'music', label: 'Music' },
    { id: 'tech', label: 'Tech' },
    { id: 'food', label: 'Food & Drink' },
    { id: 'arts', label: 'Arts' },
    { id: 'sports', label: 'Sports' },
  ];

  const updateDate = (d: any) => setFilters({ ...filters, date: d });
  const updateCat = (c: any) => setFilters({ ...filters, category: c });

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-4 space-y-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-[72px] z-20 border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
      <div className="flex px-4 gap-2">
        {dates.map((d) => (
          <button
            key={d.id}
            onClick={() => updateDate(d.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filters.date === d.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex px-4 gap-2">
         {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => updateCat(c.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filters.category === c.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
};