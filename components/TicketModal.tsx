import React, { useEffect, useRef } from 'react';
import { X, Calendar, MapPin, Download } from 'lucide-react';
import { Ticket, EventItem } from '../types';

interface TicketModalProps {
  ticket: Ticket;
  event: EventItem;
  onClose: () => void;
}

declare global {
  interface Window {
    QRCode: any;
  }
}

export const TicketModal: React.FC<TicketModalProps> = ({ ticket, event, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
        qrRef.current.innerHTML = '';
        try {
             // Safe access to CorrectLevel
             const correctLevel = window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2;

             new window.QRCode(qrRef.current, {
                text: ticket.qrCodeData,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : correctLevel
            });
        } catch (e) {
            console.error("QR Code generation error:", e);
        }
    }
  }, [ticket]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-scale-in">
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white z-10 transition-colors"
        >
            <X size={20} />
        </button>

        {/* Ticket Header (Event Image) */}
        <div className="h-40 relative">
            <img src={event.imageUrl} className="w-full h-full object-cover" alt="Event" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-bold text-lg leading-tight mb-1">{event.title}</h3>
                <div className="flex items-center text-xs opacity-90">
                    <Calendar size={12} className="mr-1.5" />
                    {event.date}
                </div>
            </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 relative">
            {/* Cutout circles for ticket effect */}
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full border-t-2 border-dashed border-slate-300 dark:border-slate-700"></div>

            <div className="flex flex-col items-center justify-center py-4">
                 <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100">
                    <div ref={qrRef} className="mix-blend-multiply" />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {ticket.id}</p>
            </div>

            <div className="space-y-3 mt-2">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs text-slate-500">Attendee</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{ticket.userName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs text-slate-500">Seat</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ticket.seatNumber ? `#${ticket.seatNumber}` : 'General Admission'}
                    </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs text-slate-500">Status</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ticket.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {ticket.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">Show this QR code at the entrance</p>
            </div>
        </div>
      </div>
    </div>
  );
};