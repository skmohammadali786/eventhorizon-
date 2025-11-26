import React, { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { EventCard } from './components/EventCard';
import { ItineraryView } from './components/ItineraryView';
import { EventDetailsView } from './components/EventDetailsView';
import { ProfileView } from './components/ProfileView';
import { AuthOverlay } from './components/AuthOverlay';
import { FilterBar } from './components/FilterBar';
import { CreateEventView } from './components/CreateEventView';
import { SettingsOverlay } from './components/SettingsOverlay';
import { PaymentModal } from './components/PaymentModal';
import { TicketModal } from './components/TicketModal';
import { ScannerModal } from './components/ScannerModal';
import { searchEventsWithGemini, generateItineraryForEvent, getEventDetails } from './services/geminiService';
import { EventItem, ViewState, LoadingState, Itinerary, User, HistoryItem, FilterOptions, EventDetails, Theme, Ticket } from './types';
import { Search, Sparkles, AlertCircle, Compass, Plus, CheckCircle, Flame, Flag } from 'lucide-react';

const SUGGESTED_QUERIES = [
  "Tech meetups nearby",
  "Live jazz tonight",
  "Family outdoor activities",
  "Art gallery openings",
  "Indie rock concerts"
];

const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-2 z-[70] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <CheckCircle size={18} className="text-green-500" />
        <span className="font-medium text-sm">{message}</span>
    </div>
);

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [userEvents, setUserEvents] = useState<EventItem[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({ date: 'all', category: 'all' });
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toast, setToast] = useState({ msg: '', show: false });
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedEvents');
      const savedUser = localStorage.getItem('user');
      const savedHistory = localStorage.getItem('history');
      const savedUserEvents = localStorage.getItem('userEvents');
      const savedReminders = localStorage.getItem('reminders');
      const savedTickets = localStorage.getItem('tickets');
      const savedTheme = localStorage.getItem('theme') as Theme;

      if (saved) setSavedEvents(JSON.parse(saved));
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedUserEvents) setUserEvents(JSON.parse(savedUserEvents));
      if (savedReminders) setReminders(JSON.parse(savedReminders));
      if (savedTickets) setTickets(JSON.parse(savedTickets));
      
      if (savedTheme) setTheme(savedTheme);
      else setTheme('light');
    } catch (e) {
      console.error("Error loading local storage", e);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => { try { localStorage.setItem('savedEvents', JSON.stringify(savedEvents)); } catch(e) {} }, [savedEvents]);
  useEffect(() => { try { if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user'); } catch(e) {} }, [user]);
  useEffect(() => { try { localStorage.setItem('history', JSON.stringify(history)); } catch(e) {} }, [history]);
  useEffect(() => { try { localStorage.setItem('userEvents', JSON.stringify(userEvents)); } catch(e) {} }, [userEvents]);
  useEffect(() => { try { localStorage.setItem('reminders', JSON.stringify(reminders)); } catch(e) {} }, [reminders]);
  useEffect(() => { try { localStorage.setItem('tickets', JSON.stringify(tickets)); } catch(e) {} }, [tickets]);

  const showToast = (msg: string) => {
      setToast({ msg, show: true });
      setTimeout(() => setToast({ msg, show: false }), 2000);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = { ...item, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setView('search');
    setLoadingState(LoadingState.LOADING);
    setErrorMsg('');
    setEvents([]);
    addToHistory({ type: 'search', title: `Search: ${searchQuery}` });

    const normalizedQuery = searchQuery.toLowerCase();
    const localResults = userEvents.filter(ev => 
        ev.title.toLowerCase().includes(normalizedQuery) ||
        ev.location.toLowerCase().includes(normalizedQuery) ||
        (ev.category && ev.category.toLowerCase().includes(normalizedQuery))
    );
    
    const filteredLocal = localResults.filter(ev => {
         if (filters.category !== 'all' && ev.category !== filters.category) return false;
         if (filters.date !== 'all') {
             const evDate = ev.date.toLowerCase();
             if (filters.date === 'today' && !evDate.includes('today')) return false;
             if (filters.date === 'weekend' && !evDate.includes('weekend') && !evDate.includes('sat') && !evDate.includes('sun')) return false;
         }
         return true;
    });

    if (filteredLocal.length > 0) setEvents(filteredLocal);

    try {
      const aiResults = await searchEventsWithGemini(searchQuery, filters);
      setEvents(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newUnique = aiResults.filter(a => !existingIds.has(a.id));
          const combined = [...prev, ...newUnique];
          return combined.sort((a, b) => {
             if (a.isoDate && b.isoDate) return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
             return 0;
          });
      });
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      if (filteredLocal.length > 0) setLoadingState(LoadingState.SUCCESS);
      else {
          setLoadingState(LoadingState.ERROR);
          setErrorMsg("Could not fetch web results. Showing only local data if available.");
      }
    }
  };

  const handleCreateEvent = (newEvent: EventItem) => {
      // Add creator ID
      if (user) newEvent.creatorId = user.id;
      setUserEvents(prev => [newEvent, ...prev]);
      setView('home');
      showToast("Event Posted Successfully");
      setTimeout(() => handleEventClick(newEvent), 500);
  };

  const handleReportEvent = (event: EventItem) => {
      showToast("Event Reported. We will review it shortly.");
  };

  const handleEventClick = async (event: EventItem) => {
    // If it's a user event, find the fresh version from state to get latest seats/attendees
    const freshEvent = userEvents.find(e => e.id === event.id) || event;
    
    setSelectedEventDetails(freshEvent as EventDetails);
    setView('details');
    setDetailsLoading(true);
    addToHistory({ type: 'view', title: `Viewed: ${freshEvent.title}`, data: freshEvent });

    try {
        const richDetails = await getEventDetails(freshEvent);
        setSelectedEventDetails(richDetails);
    } catch (e) {
        console.error("Could not fetch details", e);
    } finally {
        setDetailsLoading(false);
    }
  };

  const handlePlanItinerary = async (event: EventItem) => {
    setSelectedEventDetails(event as EventDetails);
    setView('itinerary');
    setItineraryLoading(true);
    setItinerary(null);
    setErrorMsg('');
    
    try {
      const plan = await generateItineraryForEvent(event);
      if (plan && plan.items && plan.items.length > 0) {
        setItinerary(plan);
        addToHistory({ type: 'itinerary', title: `Plan: ${event.title}`, data: plan });
      } else throw new Error("Generated itinerary was empty");
    } catch (error) {
      setErrorMsg("Unable to generate a plan right now. Please try again.");
    } finally {
      setItineraryLoading(false);
    }
  };

  const handleToggleSave = (event: EventItem) => {
    if (!user) { setShowAuth(true); return; }
    setSavedEvents(prev => {
      const isAlreadySaved = prev.some(e => e.id === event.id);
      if (isAlreadySaved) {
          showToast("Event Removed from Saved");
          return prev.filter(e => e.id !== event.id);
      } else {
          showToast("Event Saved to Favorites");
          return [...prev, event];
      }
    });
  };

  const handleToggleReminder = async (event: EventItem) => {
    const hasReminder = reminders.includes(event.id);
    if (hasReminder) {
        setReminders(prev => prev.filter(id => id !== event.id));
        showToast("Reminder removed");
        return;
    }
    if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { showToast("Notifications blocked"); return; }
    }
    setReminders(prev => [...prev, event.id]);
    showToast("Reminder set successfully");
    if ('Notification' in window && Notification.permission === 'granted') {
        setTimeout(() => {
            new Notification(`Upcoming Event: ${event.title}`, { body: `Don't forget about ${event.title}`, icon: event.imageUrl });
        }, 5000);
    }
  };

  // Ticketing Logic
  const handleJoinEvent = (event: EventDetails) => {
      if (!user) { setShowAuth(true); return; }
      if (event.priceValue && event.priceValue > 0) {
          setShowPayment(true);
      } else {
          processTicketGeneration(event);
      }
  };

  const processTicketGeneration = (event: EventDetails) => {
      if (!user) return;
      
      const newTicket: Ticket = {
          id: `T-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          eventId: event.id,
          userId: user.id,
          userName: user.name,
          qrCodeData: JSON.stringify({ eid: event.id, uid: user.id, ts: Date.now() }),
          status: 'active',
          purchaseDate: Date.now(),
          pricePaid: event.priceValue || 0,
          seatNumber: (event.soldSeats || 0) + 1
      };

      setTickets(prev => [...prev, newTicket]);
      
      // Update Event Stats in Local Store
      setUserEvents(prev => prev.map(e => {
          if (e.id === event.id) {
              const updated = {
                  ...e,
                  soldSeats: (e.soldSeats || 0) + 1,
                  attendees: [...(e.attendees || []), user.id]
              };
              // Update currently viewing event details too
              setSelectedEventDetails(updated as EventDetails);
              return updated;
          }
          return e;
      }));

      setSelectedTicket(newTicket);
      setShowTicket(true);
      showToast("Ticket Confirmed!");
  };

  const handlePaymentSuccess = () => {
      setShowPayment(false);
      if (selectedEventDetails) processTicketGeneration(selectedEventDetails);
  };

  const handleScanSuccess = (decodedText: string) => {
      setShowScanner(false);
      try {
          // Simple validation - in real app would verify signature
          const data = JSON.parse(decodedText);
          if (data.eid === selectedEventDetails?.id) {
             showToast("Valid Ticket: Check-in Successful");
          } else {
             showToast("Invalid Ticket: Wrong Event");
          }
      } catch (e) {
          showToast("Invalid QR Code");
      }
  };

  const handleLogin = (name: string, email: string) => {
      setUser({ id: 'user-123', name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff` });
      setShowAuth(false);
      showToast("Welcome back!");
  };

  const handleHistoryClick = (item: HistoryItem) => {
      if (item.type === 'view' && item.data) handleEventClick(item.data);
      else if (item.type === 'itinerary' && item.data) { setItinerary(item.data); setView('itinerary'); }
      else if (item.type === 'search') { setSearchQuery(item.title.replace('Search: ', '')); setView('home'); }
  };

  const handleClearHistory = () => { setHistory([]); try { localStorage.removeItem('history'); } catch(e) {} showToast("History Cleared"); };
  const handleClearSaved = () => { setSavedEvents([]); try { localStorage.removeItem('savedEvents'); } catch(e) {} showToast("Saved Events Cleared"); };

  // Determine if user has ticket for selected event
  const existingTicket = selectedEventDetails && user ? tickets.find(t => t.eventId === selectedEventDetails.id && t.userId === user.id) : undefined;

  const renderHome = () => (
    <div className="pb-24 animate-blur-in">
      <div className="relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-200 to-white dark:via-slate-900 dark:to-slate-950 pt-20 pb-12 px-6 rounded-b-[3rem] border-b border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-start mb-6 animate-fade-up">
                <div><h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300 tracking-tight">EventHorizon</h1></div>
                {user && <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer hover:scale-105 transition-transform" alt="Profile" onClick={() => setView('profile')} />}
            </div>
          <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed max-w-xl animate-fade-up delay-100">Find the perfect moment. Plan the perfect day.</p>
          <form onSubmit={handleSearch} className="relative shadow-2xl shadow-blue-900/20 animate-scale-in delay-200 group">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="What's the plan?" className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors shadow-lg"><Compass size={20} /></button>
          </form>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-semibold animate-fade-up delay-300"><Flame size={18} className="text-orange-500" /><h2>Trending Searches</h2></div>
        <div className="flex flex-wrap gap-3 animate-fade-up delay-300">
            {SUGGESTED_QUERIES.map((q, i) => <button key={i} onClick={() => { setSearchQuery(q); }} className="bg-white/80 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm py-2.5 px-5 rounded-full border border-slate-200 dark:border-slate-800 transition-all active:scale-95 shadow-sm">{q}</button>)}
        </div>
        {userEvents.length > 0 && (
             <div className="mt-8 animate-fade-up delay-300">
                <h2 className="text-slate-800 dark:text-slate-200 font-semibold mb-4">Latest Community Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {userEvents.slice(0, 4).map(ev => (
                        <div key={ev.id} onClick={() => handleEventClick(ev)} className="cursor-pointer h-full">
                            <EventCard event={ev} isSaved={savedEvents.some(e => e.id === ev.id)} hasReminder={reminders.includes(ev.id)} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onReport={handleReportEvent} />
                        </div>
                    ))}
                </div>
             </div>
        )}
      </div>
    </div>
  );

  const renderEventList = (eventList: EventItem[], emptyMsg: string) => (
    <div className="pb-24 px-4 pt-4 max-w-7xl mx-auto animate-blur-in">
         {loadingState === LoadingState.SUCCESS && <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 px-2">Found {eventList.length} results</p>}
        {loadingState === LoadingState.LOADING && <div className="flex flex-col items-center justify-center py-20 space-y-4"><div className="relative"><div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><Sparkles size={16} className="text-blue-400 animate-pulse" /></div></div><p className="text-slate-500 dark:text-slate-400 text-sm tracking-wide">Scanning the horizon...</p></div>}
        {loadingState === LoadingState.ERROR && <div className="flex flex-col items-center justify-center py-20 text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-900/30 mx-4"><AlertCircle size={40} className="mb-3" /><p>{errorMsg}</p></div>}
        {loadingState === LoadingState.SUCCESS && eventList.length === 0 && <div className="text-center py-20 text-slate-500"><p>{emptyMsg}</p><button onClick={() => setView('create')} className="mt-4 text-blue-500 underline">Post an event yourself?</button></div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventList.map((event, index) => (
                <div key={event.id} onClick={() => handleEventClick(event)} className="cursor-pointer h-full relative group animate-slide-up-fade" style={{ animationDelay: `${index * 50}ms` }}>
                    {event.isUserCreated && <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-blue-600/90 text-white text-[10px] font-bold uppercase rounded shadow backdrop-blur">Community</div>}
                    <EventCard event={event} isSaved={savedEvents.some(e => e.id === event.id)} hasReminder={reminders.includes(event.id)} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onReport={handleReportEvent} />
                </div>
            ))}
        </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'home': return renderHome();
      case 'create': return <CreateEventView onBack={() => setView('home')} onSubmit={handleCreateEvent} />;
      case 'search': return <><div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 pt-safe animate-fade-in transition-colors duration-300"><div className="p-4 pb-0 max-w-3xl mx-auto"><form onSubmit={handleSearch} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500" /></form></div><FilterBar filters={filters} setFilters={(f) => { setFilters(f); if(searchQuery) handleSearch(); }} /></div>{renderEventList(events, "No events found matching your criteria.")}</>;
      case 'saved': return <><div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 p-6 pt-safe transition-colors duration-300"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Saved Events</h1></div>{renderEventList(savedEvents, "No saved events yet.")}</>;
      case 'profile': return <ProfileView user={user} history={history} savedEvents={savedEvents} createdEvents={userEvents} onLogout={() => setUser(null)} onLogin={() => setShowAuth(true)} onHistoryClick={handleHistoryClick} onCreateClick={() => { if (!user) setShowAuth(true); else setView('create'); }} onSettingsClick={() => setShowSettings(true)} />;
      case 'details': return <EventDetailsView event={selectedEventDetails} currentUser={user} existingTicket={existingTicket} hasReminder={selectedEventDetails ? reminders.includes(selectedEventDetails.id) : false} onBack={() => setView(history.length > 0 && history[0].type === 'search' ? 'search' : 'home')} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onJoinEvent={handleJoinEvent} onViewTicket={(t) => { setSelectedTicket(t); setShowTicket(true); }} onScanTickets={() => setShowScanner(true)} onReport={handleReportEvent} isLoading={detailsLoading} />;
      case 'itinerary': return <ItineraryView itinerary={itinerary} event={selectedEventDetails} onBack={() => setView('details')} isLoading={itineraryLoading} />;
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-300">
      <Toast message={toast.msg} visible={toast.show} />
      <div className="mx-auto min-h-screen relative">{renderContent()}</div>
      {view === 'home' && <button onClick={() => { if (!user) setShowAuth(true); else setView('create'); }} className="fixed bottom-20 right-6 z-40 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl shadow-blue-600/30 transition-transform hover:scale-105 active:scale-95 animate-scale-in" aria-label="Create Event"><Plus size={28} /></button>}
      {!['itinerary', 'details', 'create'].includes(view) && <BottomNav currentView={view} setView={setView} />}
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} onClearHistory={handleClearHistory} onClearSaved={handleClearSaved} toggleTheme={toggleTheme} currentTheme={theme} />}
      {showPayment && selectedEventDetails && <PaymentModal event={selectedEventDetails} onClose={() => setShowPayment(false)} onSuccess={handlePaymentSuccess} />}
      {showTicket && selectedTicket && selectedEventDetails && <TicketModal ticket={selectedTicket} event={selectedEventDetails} onClose={() => setShowTicket(false)} />}
      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScanSuccess={handleScanSuccess} />}
    </div>
  );
}
export default App;