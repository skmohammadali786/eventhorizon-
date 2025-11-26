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
import { Search, Plus, CheckCircle } from 'lucide-react';

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
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
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
    const savedUser = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        refreshTickets(u.id);
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
  }, []);

  useEffect(() => {
    if (user) syncUserPreferences(user.id, { history, savedEvents, reminders });
  }, [history, savedEvents, reminders, user]);

  const refreshEvents = async () => { setUserEvents(await getEventsFromDb()); };
  const refreshTickets = async (userId: string) => { setTickets(await getUserTicketsFromDb(userId)); };

  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const showToast = (msg: string) => { setToast({ msg, show: true }); setTimeout(() => setToast({ msg, show: false }), 2000); };
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setView('search'); setLoadingState(LoadingState.LOADING); setEvents([]);
    const local = userEvents.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const ai = await searchEventsWithGemini(searchQuery, filters);
    setEvents([...local, ...ai]);
    setLoadingState(LoadingState.SUCCESS);
  };

  const handleCreateEvent = async (newEvent: EventItem) => {
      if (user) newEvent.creatorId = user.id;
      await saveEventToDb(newEvent);
      await refreshEvents();
      setView('home'); showToast("Event Posted!");
  };

  const handleEventClick = async (event: EventItem) => {
    setSelectedEventDetails(event); setView('details');
    const details = await getEventDetails(event);
    setSelectedEventDetails(details);
  };

  const handlePlanItinerary = async (event: EventItem) => {
    setView('itinerary');
    const role = (user && user.id === event.creatorId) ? 'host' : 'attendee';
    setItinerary(await generateItineraryForEvent(event, role));
  };

  const handleToggleSave = (event: EventItem) => {
    if (!user) return setShowAuth(true);
    setSavedEvents(prev => prev.some(e => e.id === event.id) ? prev.filter(e => e.id !== event.id) : [...prev, event]);
  };

  const handleJoinEvent = (event: EventDetails) => {
      if (!user) return setShowAuth(true);
      if (event.priceValue && event.priceValue > 0) setShowPayment(true);
      else processTicketGeneration(event);
  };

  const processTicketGeneration = async (event: EventDetails) => {
      if (!user) return;
      let eventId = event.id;
      // Ensure event exists in DB first
      const exists = userEvents.some(e => e.id === eventId);
      if (!exists) {
          const saved = await saveEventToDb(event);
          eventId = saved.id;
          setUserEvents(prev => [saved, ...prev]);
      }
      const ticket: Ticket = {
          id: '', eventId, userId: user.id, userName: user.name, qrCodeData: '', status: 'active',
          purchaseDate: Date.now(), pricePaid: event.priceValue || 0
      };
      const savedTicket = await saveTicketToDb(ticket);
      await updateEventStats(eventId, user.id, event.priceValue || 0);
      setTickets(prev => [...prev, savedTicket]);
      setSelectedTicket(savedTicket); setShowTicket(true); showToast("Ticket Confirmed!");
  };

  const handleScanSuccess = async (text: string) => {
      let id = text;
      try { id = JSON.parse(text).id; } catch(e) {}
      return await verifyTicket(id);
  };

  const handleConfirmCheckIn = async (id: string) => {
      const res = await confirmTicketEntry(id);
      return res.success;
  };

  const handleLogin = async (newUser: User) => {
      const prefs = await getUserPreferences(newUser.id);
      if (prefs) {
          if (prefs.history) setHistory(prefs.history);
          if (prefs.savedEvents) setSavedEvents(prefs.savedEvents);
      }
      await refreshTickets(newUser.id);
      setUser(newUser); setShowAuth(false); localStorage.setItem('user', JSON.stringify(newUser));
  };
  
  const handleLogout = async () => {
      await logoutUser();
      setUser(null); setHistory([]); setSavedEvents([]); setTickets([]);
      localStorage.removeItem('user'); setView('home');
  };

  const attendingEvents = userEvents.filter(ev => tickets.some(t => t.eventId === ev.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Toast message={toast.msg} visible={toast.show} />
      {view === 'home' && (
        <div className="pb-24 animate-blur-in">
           <div className="bg-gradient-to-br from-indigo-600 to-purple-700 pt-20 pb-12 px-6 rounded-b-[3rem] text-white shadow-xl">
               <h1 className="text-4xl font-extrabold mb-2">EventHorizon</h1>
               <p className="text-indigo-100 mb-8">Find the perfect moment.</p>
               <form onSubmit={handleSearch} className="relative"><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-12 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-indigo-200" /><Search className="absolute left-4 top-4 text-indigo-200" /></form>
           </div>
           <div className="px-6 mt-8 grid gap-4">
               {userEvents.map(ev => <EventCard key={ev.id} event={ev} isSaved={savedEvents.some(e=>e.id===ev.id)} hasReminder={reminders.includes(ev.id)} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={()=>{}} onReport={()=>{}} />)}
           </div>
        </div>
      )}
      {view === 'search' && <div className="p-4 grid gap-4"><FilterBar filters={filters} setFilters={setFilters} />{loadingState===LoadingState.LOADING?<div className="text-center p-10">Loading...</div>:events.map(e=><EventCard key={e.id} event={e} isSaved={savedEvents.some(s=>s.id===e.id)} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={()=>{}} onReport={()=>{}} />)}</div>}
      {view === 'saved' && <div className="p-4 grid gap-4">{savedEvents.map(e=><EventCard key={e.id} event={e} isSaved={true} onToggleSave={handleToggleSave} onPlanItinerary={handlePlanItinerary} onToggleReminder={()=>{}} onReport={()=>{}} />)}</div>}
      {view === 'profile' && <ProfileView user={user} history={history} savedEvents={savedEvents} createdEvents={userEvents.filter(e=>e.creatorId===user?.id)} attendingEvents={attendingEvents} onLogout={handleLogout} onLogin={()=>setShowAuth(true)} onEventClick={handleEventClick} onHistoryClick={()=>{}} onCreateClick={()=>setView('create')} onSettingsClick={()=>setShowSettings(true)} />}
      {view === 'details' && <EventDetailsView event={selectedEventDetails} currentUser={user} existingTicket={tickets.find(t=>t.eventId===selectedEventDetails?.id)} hasReminder={false} isLoading={false} onBack={()=>setView('home')} onPlanItinerary={handlePlanItinerary} onToggleReminder={()=>{}} onJoinEvent={handleJoinEvent} onViewTicket={t=>{setSelectedTicket(t);setShowTicket(true)}} onScanTickets={()=>setShowScanner(true)} />}
      {view === 'create' && <CreateEventView onBack={()=>setView('home')} onSubmit={handleCreateEvent} />}
      {view === 'itinerary' && <ItineraryView itinerary={itinerary} event={selectedEventDetails} onBack={()=>setView('details')} isLoading={!itinerary} />}

      {user && view === 'home' && <button onClick={()=>setView('create')} className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl z-50"><Plus /></button>}
      {!['itinerary','details','create'].includes(view) && <BottomNav currentView={view} setView={setView} />}
      
      {showAuth && <AuthOverlay onClose={()=>setShowAuth(false)} onLogin={handleLogin} />}
      {showSettings && <SettingsOverlay onClose={()=>setShowSettings(false)} onClearHistory={()=>setHistory([])} onClearSaved={()=>setSavedEvents([])} toggleTheme={toggleTheme} currentTheme={theme} />}
      {showPayment && selectedEventDetails && <PaymentModal event={selectedEventDetails} onClose={()=>setShowPayment(false)} onSuccess={()=>{setShowPayment(false);processTicketGeneration(selectedEventDetails!)}} />}
      {showTicket && selectedTicket && selectedEventDetails && <TicketModal ticket={selectedTicket} event={selectedEventDetails} onClose={()=>setShowTicket(false)} />}
      {showScanner && <ScannerModal onClose={()=>setShowScanner(false)} onScanSuccess={handleScanSuccess} onConfirmEntry={handleConfirmCheckIn} />}
    </div>
  );
}
export default App;