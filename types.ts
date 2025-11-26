export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  qrCodeData: string;
  status: 'active' | 'used';
  purchaseDate: number;
  seatNumber?: number;
  pricePaid: number;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // Display date string (e.g. "Friday, 7 PM")
  isoDate?: string; // ISO string for sorting (e.g. "2023-10-27T19:00:00")
  location: string;
  coordinates?: { lat: number; lng: number }; // Added for map support
  description: string;
  category?: string;
  imageUrl?: string;
  sourceUrl?: string;
  isUserCreated?: boolean;
  price?: string;
  
  // Ticketing Fields
  maxSeats?: number;
  soldSeats?: number;
  priceValue?: number; // Numeric price for calculation
  attendees?: string[]; // Array of User IDs
  creatorId?: string; // User ID of creator
}

export interface EventDetails extends EventItem {
  priceRange?: string;
  ageRestriction?: string;
  organizer?: string;
  fullAddress?: string;
  ticketUrl?: string;
  lineup?: string[];
  highlights?: string[];
}

export interface HistoryItem {
  id: string;
  type: 'search' | 'view' | 'itinerary';
  title: string;
  timestamp: number;
  data?: any;
}

export interface ItineraryItem {
  time: string;
  activity: string;
  description: string;
  icon: 'food' | 'activity' | 'travel' | 'event';
}

export interface Itinerary {
  title: string;
  items: ItineraryItem[];
  generatedAt?: number;
}

export type ViewState = 'home' | 'search' | 'saved' | 'itinerary' | 'details' | 'profile' | 'create';
export type Theme = 'light' | 'dark';

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface FilterOptions {
  date: 'all' | 'today' | 'weekend' | 'week' | 'next7days' | 'month';
  category: 'all' | 'music' | 'tech' | 'food' | 'arts' | 'sports';
}