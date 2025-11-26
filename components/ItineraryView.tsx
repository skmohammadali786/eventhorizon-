import React from 'react';
import { ArrowLeft, Clock, MapPin, Coffee, Utensils, Ticket, Train } from 'lucide-react';
import { Itinerary, ItineraryItem, EventItem } from '../types';

interface ItineraryViewProps {
  itinerary: Itinerary | null;
  event: EventItem | null;
  onBack: () => void;
  isLoading: boolean;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'food': return <Utensils size={18} />;
    case 'travel': return <Train size={18} />;
    case 'event': return <Ticket size={18} />;
    default: return <Coffee size={18} />;
  }
};

const getIconColor = (type: string) => {
    switch (type) {
      case 'food': return 'bg-orange-500';
      case 'travel': return 'bg-blue-500';
      case 'event': return 'bg-purple-500';
      default: return 'bg-green-500';
    }
  };

export const ItineraryView: React.FC<ItineraryViewProps> = ({ itinerary, event, onBack, isLoading }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-blur-in">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Designing your day...</h2>
        <p className="text-slate-500 dark:text-slate-400">Curating the best experience around {event?.title}.</p>
      </div>
    );
  }

  if (!itinerary || !event) return null;

  return (
    <div className="min-h-screen pb-20 animate-blur-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Your Itinerary</h1>
          <span className="text-xs text-slate-500 dark:text-slate-400">Based on {event.title}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-6 mb-8 border border-indigo-200 dark:border-indigo-500/30 shadow-xl animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{itinerary.title}</h2>
          <div className="flex items-center text-indigo-100 dark:text-indigo-200 text-sm">
            <MapPin size={16} className="mr-1" />
            {event.location}
          </div>
        </div>

        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-6 space-y-8 md:space-y-12 animate-fade-up delay-100">
          {itinerary.items.map((item: ItineraryItem, idx: number) => (
            <div key={idx} className="relative pl-8 md:pl-10">
              {/* Timeline Dot */}
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${getIconColor(item.icon)} ring-4 ring-white dark:ring-slate-900`} />
              
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-mono bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded w-fit sm:mt-1">
                  <Clock size={14} className="mr-1" />
                  {item.time}
                </div>
                
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex-1 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`p-1.5 rounded-lg ${getIconColor(item.icon)} text-white`}>
                        {getIcon(item.icon)}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.activity}</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};