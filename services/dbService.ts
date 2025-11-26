import { db } from './firebase';
import { collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, arrayUnion, increment, setDoc } from 'firebase/firestore';
import { EventItem, Ticket, User, HistoryItem } from '../types';

// Helper to remove undefined values which Firestore hates
const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj));
};

// --- EVENTS ---

export const saveEventToDb = async (event: EventItem): Promise<EventItem> => {
  if (db) {
     try {
        const cleanEvent = sanitizeForFirestore(event);
        const docRef = await addDoc(collection(db, 'events'), cleanEvent);
        console.log("✅ Event saved to Firebase with ID:", docRef.id);
        return { ...event, id: docRef.id };
     } catch (e: any) {
         console.error("❌ Firestore Error (saveEvent):", e);
         throw e;
     }
  }
  // Fallback
  const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
  const newEvent = { ...event, id: `local-${Date.now()}` };
  events.unshift(newEvent);
  localStorage.setItem('userEvents', JSON.stringify(events));
  return newEvent;
};

export const getEventsFromDb = async (): Promise<EventItem[]> => {
   if (db) {
      try {
        const q = query(collection(db, 'events')); 
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as EventItem));
        return events.sort((a, b) => {
            if (a.isoDate && b.isoDate) return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
            return 0;
        });
      } catch (e) {
          console.error("❌ Firestore Error (getEvents):", e);
          return [];
      }
   }
   return JSON.parse(localStorage.getItem('userEvents') || '[]');
};

export const getEventById = async (eventId: string): Promise<EventItem | null> => {
    if (db) {
        try {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { ...docSnap.data(), id: docSnap.id } as EventItem;
            }
        } catch (e) {
            console.error("Error fetching event by ID:", e);
        }
    }
    return null;
};

export const updateEventStats = async (eventId: string, userId: string, priceValue: number) => {
    if (db) {
        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                attendees: arrayUnion(userId),
                soldSeats: increment(1)
            });
            return;
        } catch (e) {
            console.error("Firestore update error:", e);
        }
    }
    // Fallback Local
    const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
    const updatedEvents = events.map((e: EventItem) => {
        if (e.id === eventId) {
            return {
                ...e,
                soldSeats: (e.soldSeats || 0) + 1,
                attendees: [...(e.attendees || []), userId]
            };
        }
        return e;
    });
    localStorage.setItem('userEvents', JSON.stringify(updatedEvents));
};

export const updateEventCapacity = async (eventId: string, newMaxSeats: number) => {
    if (db) {
        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, { maxSeats: newMaxSeats });
            return true;
        } catch(e) { console.error(e); return false; }
    }
    return false;
};

// --- TICKETS ---

export const saveTicketToDb = async (ticket: Ticket): Promise<Ticket> => {
    if (db) {
        try {
            const cleanTicket = sanitizeForFirestore(ticket);
            const docRef = await addDoc(collection(db, 'tickets'), cleanTicket);
            return { ...ticket, id: docRef.id };
        } catch (e) { console.error(e); throw e; }
    }
    // Fallback
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    tickets.push(ticket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    return ticket;
};

export const getUserTicketsFromDb = async (userId: string): Promise<Ticket[]> => {
    if (db) {
        try {
            const q = query(collection(db, 'tickets'), where('userId', '==', userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Ticket));
        } catch (e) { return []; }
    }
    const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    return tickets.filter((t: Ticket) => t.userId === userId);
};

export const getEventTickets = async (eventId: string): Promise<Ticket[]> => {
    if (db) {
        try {
            const q = query(collection(db, 'tickets'), where('eventId', '==', eventId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Ticket));
        } catch(e) { return []; }
    }
    return [];
};

/**
 * PHASE 1: Verify Ticket (Read-Only)
 * Checks if the ticket exists and what its current status is.
 * Does NOT update the database.
 */
export const verifyTicket = async (ticketId: string): Promise<{ success: boolean; ticket?: Ticket; message?: string }> => {
    if (db) {
        try {
            // Support scanning by Ticket ID (doc ID) OR internal ID field
            let ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
            
            // If not found by Doc ID, search by the legacy 'id' field (temp ID)
            if (!ticketDoc.exists()) {
                const q = query(collection(db, 'tickets'), where('id', '==', ticketId));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    ticketDoc = snap.docs[0];
                }
            }

            if (!ticketDoc.exists()) return { success: false, message: "Ticket not found in database." };

            const data = ticketDoc.data() as Ticket;
            // Return the ticket regardless of status so UI can decide what to show
            return { success: true, ticket: { ...data, id: ticketDoc.id } }; 

        } catch (e: any) {
            return { success: false, message: e.message };
        }
    }
    return { success: false, message: "Offline mode not supported for verification." };
};

/**
 * PHASE 2: Confirm Entry (Write)
 * Actually updates the ticket status to 'used'.
 */
export const confirmTicketEntry = async (ticketId: string): Promise<{ success: boolean; message?: string }> => {
    if (db) {
        try {
             // We assume ticketId is the Firestore Doc ID because verifyTicket would have resolved it
             const ticketRef = doc(db, 'tickets', ticketId);
             
             await updateDoc(ticketRef, { 
                status: 'used',
                redeemedAt: Date.now()
            });
            
            return { success: true };
        } catch (e: any) {
            console.error("Confirm entry error", e);
            return { success: false, message: "Failed to update ticket status." };
        }
    }
    return { success: false, message: "Offline mode." };
};


// --- PREFERENCES ---

export const syncUserPreferences = async (userId: string, data: { history?: HistoryItem[], savedEvents?: EventItem[], reminders?: string[] }) => {
    if (db) {
        try {
            // CRITICAL: Firestore throws error if data contains 'undefined'.
            // We must strip undefined values before saving.
            const cleanData = sanitizeForFirestore(data);
            await setDoc(doc(db, "users", userId), cleanData, { merge: true });
        } catch (e) { 
            console.error("Sync error - Check Firestore permissions:", e); 
        }
    }
};

export const getUserPreferences = async (userId: string) => {
    if (db) {
        try {
            const snap = await getDoc(doc(db, "users", userId));
            if (snap.exists()) return snap.data();
        } catch (e) { console.error("Fetch prefs error", e); }
    }
    return null;
};