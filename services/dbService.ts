import { db } from './firebase';
import { collection, addDoc, getDocs, getDoc, query, where, doc, updateDoc, arrayUnion, increment, setDoc } from 'firebase/firestore';
import { EventItem, Ticket, User, HistoryItem } from '../types';

const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj));
};

export const saveEventToDb = async (event: EventItem): Promise<EventItem> => {
  if (db) {
     try {
        const cleanEvent = sanitizeForFirestore(event);
        const docRef = await addDoc(collection(db, 'events'), cleanEvent);
        return { ...event, id: docRef.id };
     } catch (e: any) { console.error(e); throw e; }
  }
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
        return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as EventItem));
      } catch (e) { return []; }
   }
   return JSON.parse(localStorage.getItem('userEvents') || '[]');
};

export const getEventById = async (eventId: string): Promise<EventItem | null> => {
    if (db) {
        try {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return { ...docSnap.data(), id: docSnap.id } as EventItem;
        } catch (e) { console.error(e); }
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
        } catch (e) { console.error(e); }
    }
};

export const updateEventCapacity = async (eventId: string, newMaxSeats: number) => {
    if (db) {
        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, { maxSeats: newMaxSeats });
            return true;
        } catch(e) { return false; }
    }
    return false;
};

export const saveTicketToDb = async (ticket: Ticket): Promise<Ticket> => {
    if (db) {
        try {
            const cleanTicket = sanitizeForFirestore(ticket);
            const docRef = await addDoc(collection(db, 'tickets'), cleanTicket);
            return { ...ticket, id: docRef.id };
        } catch (e) { throw e; }
    }
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
    return [];
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

export const verifyTicket = async (ticketId: string): Promise<{ success: boolean; ticket?: Ticket; message?: string }> => {
    if (db) {
        try {
            let ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
            if (!ticketDoc.exists()) {
                const q = query(collection(db, 'tickets'), where('id', '==', ticketId));
                const snap = await getDocs(q);
                if (!snap.empty) ticketDoc = snap.docs[0];
            }

            if (!ticketDoc.exists()) return { success: false, message: "Ticket not found in database." };
            const data = ticketDoc.data() as Ticket;
            return { success: true, ticket: { ...data, id: ticketDoc.id } }; 
        } catch (e: any) { return { success: false, message: e.message }; }
    }
    return { success: false, message: "Offline mode." };
};

export const confirmTicketEntry = async (ticketId: string): Promise<{ success: boolean; message?: string }> => {
    if (db) {
        try {
             const ticketRef = doc(db, 'tickets', ticketId);
             await updateDoc(ticketRef, { status: 'used', redeemedAt: Date.now() });
             return { success: true };
        } catch (e: any) { return { success: false, message: "Failed to update ticket status." }; }
    }
    return { success: false, message: "Offline mode." };
};

export const syncUserPreferences = async (userId: string, data: { history?: HistoryItem[], savedEvents?: EventItem[], reminders?: string[] }) => {
    if (db) {
        try {
            const cleanData = sanitizeForFirestore(data);
            await setDoc(doc(db, "users", userId), cleanData, { merge: true });
        } catch (e) { console.error(e); }
    }
};

export const getUserPreferences = async (userId: string) => {
    if (db) {
        try {
            const snap = await getDoc(doc(db, "users", userId));
            if (snap.exists()) return snap.data();
        } catch (e) { console.error(e); }
    }
    return null;
};