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
  date: string;
  isoDate?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  category?: string;
  imageUrl?: string;
  sourceUrl?: string;
  isUserCreated?: boolean;
  price?: string;
  maxSeats?: number;
  soldSeats?: number;
  priceValue?: number;
  attendees?: string[];
  creatorId?: string;
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