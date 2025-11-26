import React, { useState } from 'react';
import { User, HistoryItem, EventItem } from '../types';
import { LogOut, Clock, Calendar, Settings, ChevronRight, Users, PlusCircle, LayoutGrid, Bookmark, Activity, Ticket } from 'lucide-react';

interface ProfileViewProps {
  user: User | null;
  history: HistoryItem[];
  savedEvents: EventItem[];
  createdEvents?: EventItem[];
  attendingEvents?: EventItem[];
  onLogout: () => void;
  onLogin: () => void;
  onHistoryClick: (item: HistoryItem) => void;
  onCreateClick?: () => void;
  onSettingsClick?: () => void;
  onEventClick?: (event: EventItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  history, 
  savedEvents, 
  createdEvents = [], 
  attendingEvents = [],
  onLogout, 
  onLogin, 
  onHistoryClick, 
  onCreateClick,
  onSettingsClick,
  onEventClick
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'saved' | 'history'>('events');
  const [eventType, setEventType] = useState<'attending' | 'hosting'>('attending');

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center pb-24 animate-blur-in">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700 shadow-xl">
            <Users size={40} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">Log in to post events, sync your saved items, and manage your history.</p>
        <button 
            onClick={onLogin}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
            Log In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 animate-blur-in">
      {/* Header Banner */}
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <button 
                onClick={onSettingsClick}
                className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-colors"
            >
                <Settings size={20} />
            </button>
      </div>

      <div className="px-6 -mt-12 mb-6">
        <div className="flex justify-between items-end mb-4">
             <div className="relative">
                 <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-24 h-24 rounded-full border-4 border-gray-50 dark:border-slate-950 bg-slate-800 object-cover"
                />
             </div>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{attendingEvents.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Tickets</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{createdEvents.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Posted</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{savedEvents.length}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Saved</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mb-6">
          <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('events')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <LayoutGrid size={16} /> My Events
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'saved' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <Bookmark size={16} /> Saved
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  <Activity size={16} /> History
              </button>
          </div>
      </div>

      <div className="px-6 min-h-[300px]">
        {activeTab === 'events' && (
            <div className="animate-slide-up-fade">
                {/* Sub-tabs for Events */}
                <div className="flex gap-4 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button 
                        onClick={() => setEventType('attending')} 
                        className={`text-sm font-semibold pb-1 border-b-2 transition-all ${eventType === 'attending' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}
                    >
                        Attending ({attendingEvents.length})
                    </button>
                    <button 
                        onClick={() => setEventType('hosting')} 
                        className={`text-sm font-semibold pb-1 border-b-2 transition-all ${eventType === 'hosting' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}
                    >
                        Hosting ({createdEvents.length})
                    </button>
                </div>

                {eventType === 'attending' && (
                    <div className="space-y-4">
                        {attendingEvents.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                                <Ticket className="mx-auto text-slate-400 mb-2" size={24} />
                                <p className="text-sm text-slate-500">You haven't joined any events yet.</p>
                            </div>
                        ) : (
                            attendingEvents.map(event => (
                                <div key={event.id} onClick={() => onEventClick && onEventClick(event)} className="bg-white dark:bg-slate-800 rounded-xl p-3 flex gap-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                                    <img src={event.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-slate-200" alt={event.title} />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{event.title}</h4>
                                        <p className="text-sm text-slate-500 mb-2">{event.date}</p>
                                        <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-md font-medium">Ticket Confirmed</span>
                                    </div>
                                    <div className="flex items-center justify-center pr-2 text-slate-400">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {eventType === 'hosting' && (
                    <div className="space-y-4">
                         {createdEvents.length === 0 ? (
                             <button 
                                onClick={onCreateClick}
                                className="w-full py-10 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 flex flex-col items-center justify-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                            >
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                     <PlusCircle size={24} className="text-blue-500" />
                                </div>
                                <span className="font-medium text-sm">Post your first event</span>
                            </button>
                        ) : (
                            <>
                                {createdEvents.map(event => (
                                   <div key={event.id} onClick={() => onEventClick && onEventClick(event)} className="bg-white dark:bg-slate-800 rounded-xl p-3 flex gap-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                                       <img src={event.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-slate-200" alt={event.title} />
                                       <div className="flex-1 min-w-0">
                                           <h4 className="font-bold text-slate-900 dark:text-white truncate">{event.title}</h4>
                                           <p className="text-sm text-slate-500 mb-2">{event.date}</p>
                                           <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-medium">Published</span>
                                       </div>
                                       <div className="flex items-center justify-center pr-2 text-slate-400">
                                            <ChevronRight size={20} />
                                        </div>
                                   </div>
                                ))}
                                 <button 
                                    onClick={onCreateClick}
                                    className="w-full py-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl border border-dashed border-blue-200 dark:border-blue-900/30 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    + Post New Event
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'saved' && (
             <div className="space-y-4 animate-slide-up-fade">
                 {savedEvents.length === 0 ? (
                     <div className="text-center py-12 text-slate-500 dark:text-slate-400">No saved events yet.</div>
                 ) : (
                      savedEvents.map(event => (
                           <div key={event.id} onClick={() => onEventClick && onEventClick(event)} className="bg-white dark:bg-slate-800 rounded-xl p-3 flex gap-4 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
                               <img src={event.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-slate-200" alt={event.title} />
                               <div className="flex-1 min-w-0">
                                   <h4 className="font-bold text-slate-900 dark:text-white truncate">{event.title}</h4>
                                   <p className="text-sm text-slate-500 mb-2">{event.date}</p>
                               </div>
                               <div className="flex items-center justify-center pr-2 text-slate-400">
                                    <ChevronRight size={20} />
                                </div>
                           </div>
                      ))
                 )}
             </div>
        )}

        {activeTab === 'history' && (
             <div className="space-y-3 animate-slide-up-fade">
                {history.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">No activity yet.</div>
                ) : (
                    history.slice(0, 15).map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => onHistoryClick(item)}
                            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-left group shadow-sm"
                        >
                            <div className={`p-2 rounded-lg ${item.type === 'itinerary' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                {item.type === 'itinerary' ? <Calendar size={18} /> : <Clock size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-slate-900 dark:text-slate-200 font-medium truncate">{item.title}</h4>
                                <p className="text-xs text-slate-500">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                    ))
                )}
             </div>
        )}

      </div>
      
      <div className="px-6 mt-8">
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-red-500 py-3 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm font-medium"
        >
            <LogOut size={16} />
            Sign Out
        </button>
      </div>
    </div>
  );
};