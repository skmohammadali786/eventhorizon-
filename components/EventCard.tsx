import React, { useState } from 'react';
import { Calendar, MapPin, ExternalLink, Map, Heart, Bell, Flag, Sparkles, Share2, Check } from 'lucide-react';
import { EventItem } from '../types';

interface EventCardProps {
  event: EventItem;
  isSaved?: boolean;
  hasReminder?: boolean;
  onToggleSave: (event: EventItem) => void;
  onPlanItinerary: (event: EventItem) => void;
  onToggleReminder: (event: EventItem) => void;
  onReport: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  isSaved = false, 
  hasReminder = false, 
  onToggleSave, 
  onPlanItinerary, 
  onToggleReminder,
  onReport
}) => {
  const [justShared, setJustShared] = useState(false);

  // Parsing date for the badge if possible
  const dateObj = event.isoDate ? new Date(event.isoDate) : new Date();
  const month = dateObj.toLocaleString('default', { month: 'short' });
  const day = dateObj.getDate();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} happening at ${event.location} on ${event.date}!`,
      url: event.sourceUrl || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        setJustShared(true);
        setTimeout(() => setJustShared(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-lg dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative pointer-events-auto">
       {/* Image Section */}
       <div className="relative h-48 overflow-hidden pointer-events-none">
          <img 
            src={event.imageUrl || 'https://picsum.photos/400/300'} 
            alt={event.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
          
          {/* Floating Date Badge */}
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-2 text-center min-w-[3.5rem] shadow-sm ring-1 ring-black/5">
             <div className="text-xs font-bold text-red-500 uppercase tracking-wider">{month}</div>
             <div className="text-xl font-bold text-slate-900 dark:text-white leading-none mt-0.5">{day}</div>
          </div>

          {/* Category Badge */}
           <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md rounded-md border border-white/10 shadow-sm">
                {event.category || 'Event'}
              </span>
           </div>
       </div>

       {/* Content */}
       <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-3">
            <MapPin size={14} className="mr-1.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
             {event.description}
          </p>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto pointer-events-auto">
             <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleSave(event); }}
                  className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  title="Save"
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleReminder(event); }}
                  className={`p-2 rounded-full transition-colors ${hasReminder ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  title="Remind"
                >
                  <Bell size={18} fill={hasReminder ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={handleShare}
                  className={`p-2 rounded-full transition-colors ${justShared ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 hover:text-green-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  title="Share"
                >
                  {justShared ? <Check size={18} /> : <Share2 size={18} />}
                </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); onReport(event); }}
                  className="p-2 rounded-full text-slate-400 hover:text-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="Report"
                >
                  <Flag size={18} />
                </button>
             </div>

             <button 
                onClick={(e) => { e.stopPropagation(); onPlanItinerary(event); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500"
             >
                <Sparkles size={14} /> Plan Day
             </button>
          </div>
       </div>
    </div>
  );
};