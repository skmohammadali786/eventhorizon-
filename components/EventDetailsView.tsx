import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, ExternalLink, Ticket, Users, Share2, Bell, Check, Navigation, QrCode, Scan, Flag, Search, Edit2, Save } from 'lucide-react';
import { EventDetails, User, Ticket as TicketType } from '../types';
import { getEventTickets, updateEventCapacity, getEventById } from '../services/dbService';

interface EventDetailsViewProps {
  event: EventDetails | null;
  currentUser?: User | null;
  existingTicket?: TicketType;
  hasReminder: boolean;
  isLoading: boolean;
  onBack: () => void;
  onPlanItinerary: (event: EventDetails) => void;
  onToggleReminder: (event: EventDetails) => void;
  onJoinEvent?: (event: EventDetails) => void;
  onViewTicket?: (ticket: TicketType) => void;
  onScanTickets?: () => void;
  onReport?: (event: EventDetails) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({ 
    event, currentUser, existingTicket, hasReminder, onBack, onPlanItinerary, 
    onToggleReminder, onJoinEvent, onViewTicket, onScanTickets, onReport, isLoading 
}) => {
  const [justShared, setJustShared] = useState(false);
  const [activeHostTab, setActiveHostTab] = useState<'stats' | 'attendees'>('stats');
  const [attendees, setAttendees] = useState<TicketType[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [timeLeft, setTimeLeft] = useState<{d:number, h:number, m:number, s:number} | null>(null);
  
  // Capacity Editing & Real-time Stats
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState(event?.maxSeats?.toString() || '0');
  const [dynamicMaxSeats, setDynamicMaxSeats] = useState(event?.maxSeats || 0);
  const [dynamicSoldSeats, setDynamicSoldSeats] = useState(event?.soldSeats || 0);

  // Initialize with prop data
  useEffect(() => {
    if (event) {
        setDynamicMaxSeats(event.maxSeats || 0);
        setDynamicSoldSeats(event.soldSeats || 0);
        setNewCapacity(event.maxSeats?.toString() || '0');
    }
  }, [event]);

  // FETCH FRESH DATA ON MOUNT
  // This ensures that if capacity/sales changed in backend, we see it immediately.
  useEffect(() => {
      if (event?.id) {
          getEventById(event.id).then(freshEvent => {
              if (freshEvent) {
                  setDynamicMaxSeats(freshEvent.maxSeats || 0);
                  setDynamicSoldSeats(freshEvent.soldSeats || 0);
                  setNewCapacity(freshEvent.maxSeats?.toString() || '0');
              }
          });
      }
  }, [event?.id]);

  useEffect(() => {
      if (activeHostTab === 'attendees' && event) {
          setLoadingAttendees(true);
          getEventTickets(event.id).then(tickets => {
              setAttendees(tickets);
              setLoadingAttendees(false);
          });
      }
  }, [activeHostTab, event]);

  useEffect(() => {
      if (existingTicket && event?.isoDate) {
          const target = new Date(event.isoDate).getTime();
          
          const updateTimer = () => {
              const now = new Date().getTime();
              const diff = target - now;
              
              if (diff <= 0) {
                  setTimeLeft(null); 
              } else {
                  setTimeLeft({
                      d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                      h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                      m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                      s: Math.floor((diff % (1000 * 60)) / 1000),
                  });
              }
          };
          
          updateTimer();
          const timer = setInterval(updateTimer, 1000);
          return () => clearInterval(timer);
      }
  }, [existingTicket, event]);

  const handleUpdateCapacity = async () => {
      if (!event) return;
      const num = parseInt(newCapacity);
      if (num > 0) {
         await updateEventCapacity(event.id, num);
         setIsEditingCapacity(false);
         setDynamicMaxSeats(num); // Update local UI immediately
      }
  };

  const handleShare = async () => {
    if (!event) return;
    let shareUrl = window.location.href;
    if (!shareUrl.startsWith('http')) shareUrl = 'https://eventhorizon.app';
    if (event.sourceUrl) shareUrl = event.sourceUrl;

    const shareData = { title: event.title, text: `Check out ${event.title}!`, url: shareUrl };
    try {
      if (navigator.share && navigator.canShare(shareData)) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        setJustShared(true); setTimeout(() => setJustShared(false), 2000);
      }
    } catch (err) {}
  };

  if (isLoading || !event) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  const isHost = currentUser && event.creatorId === currentUser.id;
  const isSoldOut = dynamicMaxSeats ? dynamicSoldSeats >= dynamicMaxSeats : false;

  const filteredAttendees = attendees.filter(t => t.userName.toLowerCase().includes(attendeeSearch.toLowerCase()));

  return (
    <div className="min-h-screen pb-24 relative animate-fade-in bg-white dark:bg-slate-950">
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-gray-50 dark:to-slate-950"></div>
        <div className="absolute top-4 left-4 z-10"><button onClick={onBack} className="p-2 bg-black/30 rounded-full text-white"><ArrowLeft size={24} /></button></div>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
             <button onClick={() => onToggleReminder(event)} className={`p-2 rounded-full ${hasReminder ? 'bg-yellow-500 text-white' : 'bg-black/30 text-white'}`}><Bell size={24} /></button>
             <button onClick={handleShare} className={`p-2 rounded-full text-white ${justShared ? 'bg-green-500' : 'bg-black/30'}`}>{justShared ? <Check size={24} /> : <Share2 size={24} />}</button>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-10 animate-fade-up">
        <div className="flex justify-between items-end mb-4">
             <span className="px-3 py-1 text-xs font-bold uppercase rounded-lg bg-blue-600 text-white shadow-lg">{event.category}</span>
             {onReport && <button onClick={() => onReport(event)} className="text-xs text-slate-500 hover:text-red-500 flex gap-1"><Flag size={12} /> Report</button>}
        </div>
       
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{event.title}</h1>
        <div className="flex flex-col gap-3 mt-4 mb-6 text-slate-600 dark:text-slate-300">
            <div className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-blue-500" /><span>{event.date}</span></div>
            <div className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-red-500" /><span>{event.fullAddress || event.location}</span></div>
        </div>

        {/* COUNTDOWN WIDGET (Only for Ticket Holders) */}
        {existingTicket && timeLeft && (
            <div className="mb-8 p-4 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white shadow-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-3 text-blue-400 text-sm font-bold uppercase tracking-wider">
                    <Clock size={16} /> Event Starts In
                </div>
                <div className="flex justify-between text-center px-2">
                    <div><div className="text-3xl font-bold">{timeLeft.d}</div><div className="text-[10px] text-slate-400 uppercase">Days</div></div>
                    <div className="text-2xl text-slate-600">:</div>
                    <div><div className="text-3xl font-bold">{timeLeft.h}</div><div className="text-[10px] text-slate-400 uppercase">Hours</div></div>
                    <div className="text-2xl text-slate-600">:</div>
                    <div><div className="text-3xl font-bold">{timeLeft.m}</div><div className="text-[10px] text-slate-400 uppercase">Mins</div></div>
                    <div className="text-2xl text-slate-600">:</div>
                    <div><div className="text-3xl font-bold">{timeLeft.s}</div><div className="text-[10px] text-slate-400 uppercase">Secs</div></div>
                </div>
            </div>
        )}

        {/* HOST DASHBOARD */}
        {isHost && (
            <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 shadow-xl border border-slate-700">
                <div className="flex gap-4 border-b border-slate-700 pb-3 mb-4">
                    <button onClick={() => setActiveHostTab('stats')} className={`text-sm font-bold pb-1 ${activeHostTab === 'stats' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Analytics</button>
                    <button onClick={() => setActiveHostTab('attendees')} className={`text-sm font-bold pb-1 ${activeHostTab === 'attendees' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}>Attendees</button>
                </div>
                
                {activeHostTab === 'stats' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold">{dynamicSoldSeats} / {dynamicMaxSeats}</div>
                            <div className="text-[10px] uppercase text-slate-400">Seats Sold</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-lg text-center">
                             {/* CHANGED: Currency symbol to ₹ */}
                             <div className="text-2xl font-bold">₹{dynamicSoldSeats * (event.priceValue || 0)}</div>
                             <div className="text-[10px] uppercase text-slate-400">Revenue</div>
                        </div>
                        <div className="col-span-2 bg-slate-800 p-3 rounded-lg flex items-center justify-between">
                             <span className="text-xs uppercase text-slate-400">Max Capacity</span>
                             {isEditingCapacity ? (
                                 <div className="flex gap-2">
                                     <input type="number" className="w-20 bg-slate-900 rounded p-1 text-right text-sm" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
                                     <button onClick={handleUpdateCapacity} className="p-1 bg-green-600 rounded"><Save size={14} /></button>
                                 </div>
                             ) : (
                                 <div className="flex gap-2 items-center">
                                     <span className="font-bold">{dynamicMaxSeats}</span>
                                     <button onClick={() => setIsEditingCapacity(true)} className="p-1 hover:bg-slate-700 rounded"><Edit2 size={12} /></button>
                                 </div>
                             )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input type="text" placeholder="Search guest..." value={attendeeSearch} onChange={e => setAttendeeSearch(e.target.value)} className="w-full bg-slate-800 rounded-lg py-2 pl-8 pr-3 text-sm text-white focus:outline-none" />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {loadingAttendees ? <p className="text-center text-xs text-slate-500">Loading list...</p> : 
                             filteredAttendees.length === 0 ? <p className="text-center text-xs text-slate-500">No attendees found.</p> :
                             filteredAttendees.map(t => (
                                <div key={t.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${t.status === 'used' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                        <span className="text-sm font-medium">{t.userName}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{t.status === 'used' ? 'Checked In' : 'Registered'}</span>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="flex gap-3 mb-8">
            <button onClick={() => onPlanItinerary(event)} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2"><Clock size={18} /> Plan My Day</button>
            {event.sourceUrl && <a href={event.sourceUrl} target="_blank" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"><ExternalLink size={20} /></a>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-slate-500 uppercase mb-1">Price</p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium"><Ticket size={16} className="text-yellow-500" />{event.price || "See details"}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-slate-500 uppercase mb-1">Capacity</p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium"><Users size={16} className="text-purple-500" />{dynamicMaxSeats ? `${dynamicMaxSeats - dynamicSoldSeats} / ${dynamicMaxSeats} left` : "Open"}</div>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">{event.description}</p>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-20">
          {isHost ? (
               <button onClick={onScanTickets} className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                  <Scan size={20} /> Scan Attendee Tickets
                </button>
          ) : existingTicket ? (
               <button onClick={() => onViewTicket && onViewTicket(existingTicket)} className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                  <QrCode size={20} /> View My Ticket
                </button>
          ) : isSoldOut ? (
                <button disabled className="block w-full bg-slate-300 text-slate-500 font-bold py-3 rounded-xl cursor-not-allowed">Sold Out</button>
          ) : onJoinEvent && (
              <button onClick={() => onJoinEvent(event)} className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg">
                  {/* CHANGED: Currency symbol to ₹ */}
                  {event.priceValue ? `Buy Ticket - ₹${event.priceValue}` : 'Join Event (Free)'}
              </button>
          )}
      </div>
    </div>
  );
};