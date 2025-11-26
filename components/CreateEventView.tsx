import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Tag, Type, DollarSign, Image as ImageIcon, Upload, Loader2, X, Eye, CheckCircle2, Map as MapIcon, Crosshair, Users, Ticket } from 'lucide-react';
import { EventItem, EventDetails } from '../types';
import { EventCard } from './EventCard';
import { EventDetailsView } from './EventDetailsView';

interface CreateEventViewProps {
  onBack: () => void;
  onSubmit: (event: EventItem) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({ onBack, onSubmit }) => {
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    time: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    category: string;
    description: string;
    price: string;
    maxSeats: string;
    ticketPrice: string;
  }>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Music',
    description: '',
    price: 'Free',
    maxSeats: '50',
    ticketPrice: '0'
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<EventItem | null>(null);
  const [showFinalPreview, setShowFinalPreview] = useState(false);
  const [mapUrl, setMapUrl] = useState<string>('');
  
  // Map Picker State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const leafletMarker = useRef<any>(null);

  const categories = ['Music', 'Tech', 'Food & Drink', 'Arts', 'Sports', 'Other'];

  // Update map embed url based on coordinates or text
  useEffect(() => {
    if (formData.coordinates) {
        setMapUrl(`https://maps.google.com/maps?q=${formData.coordinates.lat},${formData.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
    } else if (formData.location.length > 3) {
        const encoded = encodeURIComponent(formData.location);
        setMapUrl(`https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`);
    } else {
        setMapUrl('');
    }
  }, [formData.location, formData.coordinates]);

  // Update preview object in real-time
  useEffect(() => {
      const priceVal = parseFloat(formData.ticketPrice) || 0;
      // CHANGED: Currency symbol to ₹
      const displayPrice = priceVal > 0 ? `₹${priceVal}` : 'Free';
      
      // Generate ISO date for counting down
      let isoDate = undefined;
      if (formData.date && formData.time) {
          try {
              isoDate = new Date(`${formData.date}T${formData.time}`).toISOString();
          } catch(e) {}
      }

      setPreviewItem({
          id: 'preview',
          title: formData.title || 'Event Title',
          date: formData.date ? `${formData.date} at ${formData.time}` : 'Date & Time',
          isoDate: isoDate,
          location: formData.location || 'Location',
          coordinates: formData.coordinates,
          description: formData.description || 'Description will appear here...',
          category: formData.category,
          imageUrl: imagePreview || 'https://picsum.photos/400/300',
          price: displayPrice,
          priceValue: priceVal,
          maxSeats: parseInt(formData.maxSeats) || 0,
          soldSeats: 0,
          isUserCreated: true
      });
  }, [formData, imagePreview]);

  // Initialize Leaflet when picker opens
  useEffect(() => {
      if (showMapPicker && mapRef.current && !leafletMap.current && window.L) {
          const L = window.L;
          
          // Default to New York if no geo or previous coord
          const defaultLat = 40.7128;
          const defaultLng = -74.0060;
          
          const startLat = formData.coordinates?.lat || defaultLat;
          const startLng = formData.coordinates?.lng || defaultLng;

          leafletMap.current = L.map(mapRef.current).setView([startLat, startLng], 13);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
          }).addTo(leafletMap.current);

          // Add marker if we have coords
          if (formData.coordinates) {
              leafletMarker.current = L.marker([startLat, startLng]).addTo(leafletMap.current);
          }

          // Map click handler
          leafletMap.current.on('click', (e: any) => {
              const { lat, lng } = e.latlng;
              
              if (leafletMarker.current) {
                  leafletMarker.current.setLatLng([lat, lng]);
              } else {
                  leafletMarker.current = L.marker([lat, lng]).addTo(leafletMap.current);
              }
              
              setFormData(prev => ({ ...prev, coordinates: { lat, lng } }));
          });

          // Try to get user location
          if (!formData.coordinates && 'geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition((pos) => {
                  const { latitude, longitude } = pos.coords;
                  leafletMap.current.setView([latitude, longitude], 15);
              });
          }
      }
      
      if (showMapPicker && leafletMap.current) {
          setTimeout(() => {
              leafletMap.current.invalidateSize();
          }, 100);
      }
  }, [showMapPicker]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const MAX_WIDTH = 800;
                  const MAX_HEIGHT = 600;
                  let width = img.width;
                  let height = img.height;
                  
                  if (width > height) {
                      if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                  } else {
                      if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  ctx?.drawImage(img, 0, 0, width, height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                  setImagePreview(dataUrl);
                  setIsUploading(false);
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowFinalPreview(true);
  };

  const handleFinalConfirm = () => {
    if (previewItem) {
        onSubmit({ 
            ...previewItem, 
            id: `user-${Date.now()}`,
            attendees: []
        });
    }
  };

  // Map Picker Modal
  if (showMapPicker) {
      return (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Pick Exact Location</h3>
                      <button onClick={() => setShowMapPicker(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                          <X size={20} className="text-slate-500" />
                      </button>
                  </div>
                  
                  <div className="flex-1 relative min-h-[400px]">
                       <div ref={mapRef} className="absolute inset-0 z-10" />
                  </div>

                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                      <div className="text-sm text-slate-500">
                          {formData.coordinates 
                             ? `${formData.coordinates.lat.toFixed(4)}, ${formData.coordinates.lng.toFixed(4)}` 
                             : 'No location selected'}
                      </div>
                      <button 
                        onClick={() => setShowMapPicker(false)}
                        disabled={!formData.coordinates}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                          Confirm Location
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // Render the final confirmation overlay reusing the EventDetailsView
  if (showFinalPreview && previewItem) {
      const previewDetails: EventDetails = {
          ...previewItem,
          fullAddress: formData.location,
          priceRange: previewItem.price,
          organizer: 'You (Host)',
          highlights: ['User Created', 'Community Event'],
          description: formData.description || 'No description provided.',
      };

      return (
          <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col animate-scale-in">
              <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
                  <EventDetailsView 
                      event={previewDetails}
                      hasReminder={false}
                      onBack={() => setShowFinalPreview(false)}
                      isLoading={false}
                      onPlanItinerary={() => {}}
                      onToggleReminder={() => {}}
                  />
              </div>
              
              <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 pb-safe z-[70] flex gap-3 shadow-2xl">
                   <button 
                      onClick={() => setShowFinalPreview(false)}
                      className="flex-1 py-3.5 px-4 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                   >
                       Back to Edit
                   </button>
                   <button 
                      onClick={handleFinalConfirm}
                      className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                   >
                       <CheckCircle2 size={20} />
                       Confirm & Post
                   </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen pb-safe animate-fade-up flex flex-col lg:flex-row">
      <div className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Post Event</h1>
      </div>

      <div className="flex-1 p-6 lg:p-12 lg:h-screen lg:overflow-y-auto no-scrollbar">
         <div className="hidden lg:flex items-center gap-4 mb-8">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Event</h1>
         </div>

        <form onSubmit={handleInitialSubmit} className="space-y-6 max-w-xl mx-auto lg:mx-0">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Basic Details</label>
            <div className="space-y-4">
                <div className="relative group">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                    required
                    type="text"
                    placeholder="Event Title"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                </div>
                
                <div className="space-y-2">
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                        required
                        type="text"
                        placeholder="Venue Name"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        />
                    </div>
                    
                    <button 
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className={`w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 font-medium transition-colors ${formData.coordinates ? 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 text-slate-500 hover:text-blue-500'}`}
                    >
                        {formData.coordinates ? (
                            <><CheckCircle2 size={18} /> Location Set</>
                        ) : (
                            <><Crosshair size={18} /> Point Exact Location on Map</>
                        )}
                    </button>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
               <label className="text-xs text-slate-500 font-medium ml-1">Date</label>
              <input required type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-1">
               <label className="text-xs text-slate-500 font-medium ml-1">Time</label>
               <input required type="time" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Ticketing & Capacity</label>
             <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        required
                        type="number"
                        placeholder="Max Seats"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.maxSeats}
                        onChange={e => setFormData({...formData, maxSeats: e.target.value})}
                    />
                </div>
                <div className="relative group">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        required
                        type="number"
                        placeholder="Price (₹)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pl-12 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={formData.ticketPrice}
                        onChange={e => setFormData({...formData, ticketPrice: e.target.value})}
                    />
                </div>
             </div>
             <p className="text-[10px] text-slate-500 ml-1">Enter 0 for free events.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Details</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map(cat => (
                <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${formData.category === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}
                >
                    {cat}
                </button>
                ))}
            </div>

            <textarea
                required
                placeholder="Describe your event... What makes it special?"
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Cover Image</label>
            <div className={`relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden ${imagePreview ? 'border-transparent' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>
                {imagePreview ? (
                    <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                            type="button" 
                            onClick={() => setImagePreview('')}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                         {isUploading ? <Loader2 className="animate-spin mb-2" /> : <ImageIcon size={32} className="mb-2" />}
                         <span className="text-sm font-medium">Click to upload image</span>
                         <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                        />
                    </div>
                )}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-8 transition-transform active:scale-[0.98]">
            Review & Publish <ArrowLeft className="rotate-180" size={20} />
          </button>
        </form>
      </div>

      {/* Desktop Preview Panel */}
      <div className="hidden lg:block w-[400px] xl:w-[480px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-8 h-screen sticky top-0 overflow-y-auto no-scrollbar">
         <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 pb-4 z-10 mb-4 flex items-center gap-2 text-slate-500 uppercase text-xs font-bold tracking-wider">
             <Eye size={14} /> Live Preview
         </div>
         {previewItem && (
             <div className="pointer-events-none transform scale-95 origin-top">
                 <EventCard 
                    event={previewItem} 
                    isSaved={false} 
                    hasReminder={false} 
                    onToggleSave={() => {}} 
                    onPlanItinerary={() => {}} 
                    onToggleReminder={() => {}} 
                    onReport={() => {}} 
                />
                
                {mapUrl && (
                     <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-48 opacity-80">
                         <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0} src={mapUrl} title="Map Preview" />
                     </div>
                )}
             </div>
         )}
      </div>
    </div>
  );
};