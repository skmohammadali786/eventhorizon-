
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
import { saveEventToDb, getEventsFromDb, saveTicketToDb, getUserTicketsFromDb, updateEventStats, verifyTicket, confirmTicketEntry, syncUserPreferences, getUserPreferences } from './services/dbService';
import { logoutUser } from './services/authService';
import { EventItem, ViewState, LoadingState, Itinerary, User, HistoryItem, FilterOptions, EventDetails, Theme, Ticket } from './types';
import { Search, Sparkles, AlertCircle, Compass, Plus, CheckCircle, Flame, Heart } from 'lucide-react';

const SUGGESTED_QUERIES = ["Tech meetups", "Live jazz", "Family activities", "Art gallery", "Indie rock"];
const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-[70] transition-all ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2"><CheckCircle size={18} className="text-green-500" /><span>{message}</span></div>
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
      const savedUser = localStorage.getItem('user');
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedUser) {
          const u = JSON.parse(savedUser);
          setUser(u);
          refreshTickets(u.id);
          // Sync Preferences from Cloud
          getUserPreferences(u.id).then(prefs => {
              if (prefs) {
                  if (prefs.history) setHistory(prefs.history);
                  if (prefs.savedEvents) setSavedEvents(prefs.savedEvents);
                  if (prefs.reminders) setReminders(prefs.reminders);
              }
          });
      }
      if (savedTheme) setTheme(savedTheme);
      refreshEvents();
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (user) {
        syncUserPreferences(user.id, { history, savedEvents, reminders });
    }
  }, [history, savedEvents, reminders, user]);

  const refreshEvents = async () => { setUserEvents(await getEventsFromDb()); };
  const refreshTickets = async (userId: string) => { setTickets(await getUserTicketsFromDb(userId)); };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showToast = (msg: string) => { setToast({ msg, show: true }); setTimeout(() => setToast({ msg, show: false }), 2000); };
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
    setEvents([]);
    addToHistory({ type: 'search', title: `Search: ${searchQuery}` });
    
    try {
      // 1. Local Search (Database Events)
      const lowerQuery = searchQuery.toLowerCase();
      const localResults = userEvents.filter(e => 
          e.title.toLowerCase().includes(lowerQuery) || 
          e.location.toLowerCase().includes(lowerQuery) || 
          (e.category && e.category.toLowerCase().includes(lowerQuery))
      );

      // 2. AI Search (Web Events)
      let aiResults: EventItem[] = [];
      try {
          aiResults = await searchEventsWithGemini(searchQuery, filters);
      } catch (err) {
          console.error("AI search failed, showing local only");
      }

      // 3. Combine Results
      const combinedResults = [...localResults, ...aiResults];
      
      if (combinedResults.length === 0) {
          setErrorMsg("No events found.");
          setLoadingState(LoadingState.ERROR);
      } else {
          setEvents(combinedResults);
          setLoadingState(LoadingState.SUCCESS);
      }
    } catch (error) {
      setLoadingState(LoadingState.ERROR);
      setErrorMsg("Error fetching results.");
    }
  };

  const handleCreateEvent = async (newEvent: EventItem) => {
      if (user) newEvent.creatorId = user.id;
      try {
          const savedEvent = await saveEventToDb(newEvent);
          setUserEvents(prev => [savedEvent, ...prev]);
          setView('home');
          showToast("Event Posted!");
      } catch (e) { showToast("Failed to post event"); }
  };

  const handleEventClick = async (event: EventItem) => {
    const freshEvent = userEvents.find(e => e.id === event.id) || event;
    setSelectedEventDetails(freshEvent as EventDetails);
    setView('details');
    setDetailsLoading(true);
    addToHistory({ type: 'view', title: `Viewed: ${freshEvent.title}`, data: freshEvent });
    try {
        const richDetails = await getEventDetails(freshEvent);
        setSelectedEventDetails(richDetails);
    } catch (e) {} finally { setDetailsLoading(false); }
  };

  const handlePlanItinerary = async (event: EventItem) => {
    setSelectedEventDetails(event as EventDetails);
    setView('itinerary');
    setItineraryLoading(true);
    
    // Determine Role: Host or Attendee
    const isHost = user && user.id === event.creatorId;
    const role = isHost ? 'host' : 'attendee';

    try {
      const plan = await generateItineraryForEvent(event, role);
      setItinerary(plan);
      addToHistory({ type: 'itinerary', title: `Plan (${role}): ${event.title}`, data: plan });
    } catch (error) { setErrorMsg("Itinerary generation failed."); } finally { setItineraryLoading(false); }
  };

  const handleToggleSave = (event: EventItem) => {
    if (!user) { setShowAuth(true); return; }
    setSavedEvents(prev => {
      const exists = prev.some(e => e.id === event.id);
      showToast(exists ? "Removed from Saved" : "Saved to Favorites");
      return exists ? prev.filter(e => e.id !== event.id) : [...prev, event];
    });
  };

  const handleToggleReminder = (event: EventItem) => {
      setReminders(prev => prev.includes(event.id) ? prev.filter(id => id !== event.id) : [...prev, event.id]);
      showToast("Reminder updated");
  };

  const handleJoinEvent = (event: EventDetails) => {
      if (!user) { setShowAuth(true); return; }
      if (event.priceValue && event.priceValue > 0) setShowPayment(true);
      else processTicketGeneration(event);
  };

  const processTicketGeneration = async (event: EventDetails) => {
      if (!user) return;

      let finalEventId = event.id;
      
      // CRITICAL: Ensure event is saved to DB first so it appears in "Attending" list
      const existsInDb = userEvents.some(e => e.id === event.id);
      
      if (!existsInDb) {
          try {
              const savedEvent = await saveEventToDb(event);
              finalEventId = savedEvent.id;
              setUserEvents(prev => [savedEvent, ...prev]);
          } catch(e) {
              console.error("Failed to save event before ticketing", e);
              showToast("Error initializing event");
              return;
          }
      }

      const newTicket: Ticket = {
          id: `T-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, // Temp ID, will be replaced by DB ID
          eventId: finalEventId, 
          userId: user.id,
          userName: user.name,
          qrCodeData: '{}', // Placeholder, TicketModal generates the real data from DB ID
          status: 'active', 
          purchaseDate: Date.now(),
          pricePaid: event.priceValue || 0, 
          seatNumber: (event.soldSeats || 0) + 1
      };
      try {
          // This saves to Firestore and returns the object with the REAL Firestore ID
          const savedTicket = await saveTicketToDb(newTicket);
          
          await updateEventStats(finalEventId, user.id, event.priceValue || 0);
          setTickets(prev => [...prev, savedTicket]);
          setSelectedTicket(savedTicket);
          setShowTicket(true);
          showToast("Ticket Confirmed!");
      } catch (e) { showToast("Error booking ticket"); }
  };

  // STEP 1: Verify the scanned code (Read-only)
  const handleScanSuccess = async (decodedText: string) => {
      let ticketId = decodedText;
      try {
          const data = JSON.parse(decodedText);
          if (data.id) ticketId = data.id; 
      } catch(e) {
          // If scanning fails to parse JSON, it might be raw ID or invalid
      }

      // Call verify instead of redeem
      const result = await verifyTicket(ticketId);
      
      if (result.success && result.ticket) {
          return { valid: true, ticket: result.ticket };
      } else {
          return { valid: false, message: result.message || "Invalid Ticket" };
      }
  };

  // STEP 2: Confirm Entry (Write)
  const handleConfirmCheckIn = async (ticketId: string) => {
      const result = await confirmTicketEntry(ticketId);
      return result.success;
  };

  const handleLogin = async (newUser: User) => {
      // 1. Fetch Data First (Preferences & Tickets)
      try {
          const prefs = await getUserPreferences(newUser.id);
          const userTickets = await getUserTicketsFromDb(newUser.id);

          if (prefs) {
              setHistory(prefs.history || []);
              setSavedEvents(prefs.savedEvents || []);
              setReminders(prefs.reminders || []);
          } else {
              setHistory([]);
              setSavedEvents([]);
              setReminders([]);
          }
          setTickets(userTickets);
      } catch (e) {
          console.error("Error syncing login data", e);
      }

      // 2. Set User State and Close Auth
      setUser(newUser); 
      setShowAuth(false); 
      showToast(`Welcome ${newUser.name}`);
      localStorage.setItem('user', JSON.stringify(newUser));
  };
  
  const handleLogout = async () => {
      await logoutUser();
      setUser(null); setHistory([]); setSavedEvents([]); setReminders([]); setTickets([]);
      localStorage.removeItem('user'); setView('home');
      showToast("Logged out");
  };

  // Filter events based on Tickets held
  const attendingEvents = userEvents.filter(ev => tickets.some(t => t.eventId === ev.id));

  const renderContent = () => {
    switch (view) {
      case 'home': return (
        <div className="pb-24 animate-blur-in">
           <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 pt-20 pb-12 px-6 rounded-b-[3rem] text-white shadow-xl">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none rounded-b-[3rem]"></div>
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                       <h1 className="text-4xl font-extrabold tracking-tight">
                           EventHorizon
                       </h1>
                       {user && <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform" onClick={() => setView('profile')} />}
                   </div>
                   <p className="text-indigo-100 text-lg mb-8 font-light">Find the perfect moment.</p>
                   <form onSubmit={handleSearch} className="relative group"><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="What's the plan?" className="w-full pl-12 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200 focus:outline-none focus:bg-white/20 transition-all" /><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200" /></form>
               </div>
           </div>
           <div className="px-6 mt-8">
               <div className="flex flex-wrap gap-2 mb-8">{SUGGESTED_QUERIES.map(q => <button key={q} onClick={() => setSearchQuery(q)} className="bg-slate-100 dark:bg-slate-800 text-xs px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{q}</button>)}</div>
               {userEvents.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{userEvents.slice(0, 4).map(ev => <div key={ev.id} onClick={() => handleEventClick(ev)}><EventCard event={ev} isSaved={savedEvents.some(e => e.id === ev.id)} hasReminder={reminders.includes(ev.id)} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onReport={() => showToast("Reported")} /></div>)}</div>}
           </div>
        </div>
      );
      case 'search': return <><div className="sticky top-0 z-30 bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800"><form onSubmit={handleSearch} className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" /><input className="w-full bg-slate-100 dark:bg-slate-800 pl-10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></form><FilterBar filters={filters} setFilters={setFilters} /></div><div className="p-4 grid gap-4">{loadingState === LoadingState.LOADING ? <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> : events.map(e => <div key={e.id} onClick={() => handleEventClick(e)}><EventCard event={e} isSaved={savedEvents.some(s => s.id === e.id)} hasReminder={false} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onReport={() => {}} /></div>)}</div></>;
      
      case 'saved': return (
        <div className="min-h-screen pb-24 px-4 pt-6 animate-fade-in">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Saved Events</h1>
           {savedEvents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                   <Heart size={48} className="mb-4 opacity-20" />
                   <p>No events saved yet.</p>
               </div>
           ) : (
               <div className="grid gap-4">
                   {savedEvents.map(e => (
                       <div key={e.id} onClick={() => handleEventClick(e)}>
                           <EventCard 
                               event={e} 
                               isSaved={true} 
                               hasReminder={reminders.includes(e.id)} 
                               onToggleSave={handleToggleSave} 
                               onPlanItinerary={handlePlanItinerary} 
                               onToggleReminder={handleToggleReminder} 
                               onReport={() => showToast("Reported")} 
                           />
                       </div>
                   ))}
               </div>
           )}
        </div>
      );

      case 'profile': return <ProfileView user={user} history={history} savedEvents={savedEvents} createdEvents={userEvents.filter(e => e.creatorId === user?.id)} attendingEvents={attendingEvents} onLogout={handleLogout} onLogin={() => setShowAuth(true)} onEventClick={handleEventClick} onHistoryClick={item => item.data && handleEventClick(item.data)} onCreateClick={() => setView('create')} onSettingsClick={() => setShowSettings(true)} />;
      case 'details': return <EventDetailsView event={selectedEventDetails} currentUser={user} existingTicket={tickets.find(t => t.eventId === selectedEventDetails?.id)} hasReminder={false} isLoading={detailsLoading} onBack={() => setView('home')} onPlanItinerary={handlePlanItinerary} onToggleReminder={handleToggleReminder} onJoinEvent={handleJoinEvent} onViewTicket={t => { setSelectedTicket(t); setShowTicket(true); }} onScanTickets={() => setShowScanner(true)} onReport={() => showToast("Reported")} />;
      case 'create': return <CreateEventView onBack={() => setView('home')} onSubmit={handleCreateEvent} />;
      case 'itinerary': return <ItineraryView itinerary={itinerary} event={selectedEventDetails} onBack={() => setView('details')} isLoading={itineraryLoading} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Toast message={toast.msg} visible={toast.show} />
      {renderContent()}
      {view === 'home' && <button onClick={() => user ? setView('create') : setShowAuth(true)} className="fixed bottom-20 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl z-40 transition-transform active:scale-95"><Plus size={28} /></button>}
      {!['itinerary','details','create'].includes(view) && <BottomNav currentView={view} setView={setView} />}
      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} onLogin={handleLogin} />}
      {showSettings && <SettingsOverlay onClose={() => setShowSettings(false)} onClearHistory={() => setHistory([])} onClearSaved={() => setSavedEvents([])} toggleTheme={toggleTheme} currentTheme={theme} />}
      {showPayment && selectedEventDetails && <PaymentModal event={selectedEventDetails} onClose={() => setShowPayment(false)} onSuccess={() => { setShowPayment(false); if(selectedEventDetails) processTicketGeneration(selectedEventDetails); }} />}
      {showTicket && selectedTicket && selectedEventDetails && <TicketModal ticket={selectedTicket} event={selectedEventDetails} onClose={() => setShowTicket(false)} />}
      
      {showScanner && (
          <ScannerModal 
            onClose={() => setShowScanner(false)} 
            onScanSuccess={handleScanSuccess} 
            onConfirmEntry={handleConfirmCheckIn}
          />
      )}
    </div>
  );
}
export default App;
