import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Clock, ExternalLink, Ticket, Users, Info, ShieldCheck, Share2, Bell, Check, Navigation, QrCode, Scan, Flag } from 'lucide-react';
import { EventDetails, User, Ticket as TicketType } from '../types';

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
    event, 
    currentUser,
    existingTicket,
    hasReminder, 
    onBack, 
    onPlanItinerary, 
    onToggleReminder, 
    onJoinEvent,
    onViewTicket,
    onScanTickets,
    onReport,
    isLoading 
}) => {
  const [justShared, setJustShared] = useState(false);

  const handleShare = async () => {
    if (!event) return;
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} happening at ${event.location} on ${event.date}!`,
      url: event.sourceUrl || window.location.href
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        setJustShared(true);
        setTimeout(() => setJustShared(false), 2000);
      }
    } catch (err) { console.error('Error sharing:', err); }
  };

  const openDirections = () => {
      if (!event) return;
      if (event.coordinates) window.open(`https://www.google.com/maps/search/?api=1&query=${event.coordinates.lat},${event.coordinates.lng}`, '_blank');
      else {
          const query = encodeURIComponent(event.fullAddress || event.location);
          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 animate-pulse">Gathering event intelligence...</p>
      </div>
    );
  }

  let mapEmbedUrl = "";
  if (event.coordinates) mapEmbedUrl = `https://maps.google.com/maps?q=${event.coordinates.lat},${event.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  else {
      const mapQuery = encodeURIComponent(event.fullAddress || event.location);
      mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  const isHost = currentUser && event.creatorId === currentUser.id;
  const isSoldOut = event.maxSeats ? (event.soldSeats || 0) >= event.maxSeats : false;
  const seatsLeft = event.maxSeats ? event.maxSeats - (event.soldSeats || 0) : null;

  return (
    <div className="min-h-screen pb-24 relative animate-fade-in bg-white dark:bg-slate-950">
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        <img src={event.imageUrl || 'https://picsum.photos/800/600'} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-gray-50 dark:to-slate-950"></div>
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
          <button onClick={onBack} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"><ArrowLeft size={24} /></button>
          <div className="flex gap-2">
             <button onClick={() => onToggleReminder(event)} className={`p-2 backdrop-blur-md rounded-full transition-colors ${hasReminder ? 'bg-yellow-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}><Bell size={24} fill={hasReminder ? "currentColor" : "none"} /></button>
              <button onClick={handleShare} className={`p-2 backdrop-blur-md rounded-full text-white transition-colors ${justShared ? 'bg-green-500' : 'bg-black/30 hover:bg-black/50'}`}>{justShared ? <Check size={24} /> : <Share2 size={24} />}</button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-10 animate-fade-up">
        <div className="flex justify-between items-end mb-4">
             <div className="flex gap-2">
                 <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-600 text-white shadow-lg">{event.category || 'Event'}</span>
                {event.isUserCreated && <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-purple-600 text-white shadow-lg">Community</span>}
             </div>
             {onReport && (
                <button 
                    onClick={() => onReport(event)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors mb-1"
                >
                    <Flag size={12} /> Report Issue
                </button>
             )}
        </div>
       
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{event.title}</h1>
        
        <div className="flex flex-col gap-3 mt-4 mb-6">
            <div className="flex items-center text-slate-600 dark:text-slate-300"><Calendar className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" /><span>{event.date}</span></div>
            <div className="flex items-center text-slate-600 dark:text-slate-300"><MapPin className="w-5 h-5 mr-3 text-red-500 dark:text-red-400" /><span>{event.fullAddress || event.location}</span></div>
            {event.organizer && <div className="flex items-center text-slate-600 dark:text-slate-300"><ShieldCheck className="w-5 h-5 mr-3 text-green-500 dark:text-green-400" /><span>Hosted by {event.organizer}</span></div>}
        </div>

        {/* HOST DASHBOARD - STATS ONLY */}
        {isHost && (
            <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 shadow-xl border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={18} className="text-green-400" /> Host Analytics</h3>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded">Owner</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{event.soldSeats || 0} / {event.maxSeats}</div>
                        <div className="text-[10px] uppercase text-slate-400">Sold</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-lg text-center">
                         <div className="text-2xl font-bold">${(event.soldSeats || 0) * (event.priceValue || 0)}</div>
                         <div className="text-[10px] uppercase text-slate-400">Revenue</div>
                    </div>
                </div>
            </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
            <button onClick={() => onPlanItinerary(event)} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><Clock size={18} /> Plan My Day</button>
            {event.sourceUrl && (
                <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><ExternalLink size={20} /></a>
            )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-slate-500 uppercase mb-1">Price</p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <Ticket size={16} className="text-yellow-500" />
                    {event.price || event.priceRange || "See details"}
                </div>
            </div>
            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-slate-500 uppercase mb-1">Capacity</p>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                    <Users size={16} className="text-purple-500" />
                    {event.maxSeats ? (
                        <span>{seatsLeft} / {event.maxSeats} left</span>
                    ) : (
                        event.ageRestriction || "Open"
                    )}
                </div>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">{event.description}</p>
        </div>

        {event.highlights && event.highlights.length > 0 && (
            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Highlights</h3>
                <ul className="space-y-2">{event.highlights.map((h, i) => <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />{h}</li>)}</ul>
            </div>
        )}

        <div className="mb-8">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Location</h3>
                <button onClick={openDirections} className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><Navigation size={14} /> Get Directions</button>
             </div>
             <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800 h-48 relative">
                 <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={mapEmbedUrl} className="w-full h-full opacity-90 hover:opacity-100 transition-opacity" title="Event Location"></iframe>
             </div>
             <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.fullAddress || event.location}</p>
        </div>
      </div>
      
      {/* Footer Actions: STRICT ROLE SEPARATION */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe z-20">
          {isHost ? (
               // HOST VIEW: ONLY SCAN
               <button 
                  onClick={onScanTickets}
                  className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Scan size={20} /> Scan Attendee Tickets
                </button>
          ) : existingTicket ? (
               // GUEST VIEW (Already Joined): VIEW TICKET
               <button 
                  onClick={() => onViewTicket && onViewTicket(existingTicket)}
                  className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <QrCode size={20} /> View My Ticket
                </button>
          ) : isSoldOut ? (
                // GUEST VIEW (Full): SOLD OUT
                <button disabled className="block w-full bg-slate-300 dark:bg-slate-800 text-slate-500 font-bold py-3 rounded-xl cursor-not-allowed">
                  Sold Out
                </button>
          ) : onJoinEvent ? (
              // GUEST VIEW (Available): BUY/JOIN
              <button 
                onClick={() => onJoinEvent(event)}
                className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                  {event.priceValue && event.priceValue > 0 ? `Buy Ticket - $${event.priceValue}` : 'Join Event (Free)'}
              </button>
          ) : event.ticketUrl && (
              // FALLBACK EXTERNAL URL
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                  Get Tickets
              </a>
          )}
      </div>
    </div>
  );
};