import React, { useEffect, useRef } from 'react';
import { X, Calendar } from 'lucide-react';
import { Ticket, EventItem } from '../types';

interface TicketModalProps {
  ticket: Ticket;
  event: EventItem;
  onClose: () => void;
}

declare global {
  interface Window { QRCode: any; }
}

export const TicketModal: React.FC<TicketModalProps> = ({ ticket, event, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
        qrRef.current.innerHTML = '';
        try {
             // Generate Secure Payload with ID
             const securePayload = JSON.stringify({ id: ticket.id });
             new window.QRCode(qrRef.current, {
                text: securePayload,
                width: 180,
                height: 180,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : 2
            });
        } catch (e) { console.error(e); }
    }
  }, [ticket]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white z-10"><X size={20} /></button>
        <div className="h-40 relative">
            <img src={event.imageUrl} className="w-full h-full object-cover" alt="Event" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80"></div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-bold text-lg leading-tight mb-1">{event.title}</h3>
                <div className="flex items-center text-xs opacity-90"><Calendar size={12} className="mr-1.5" />{event.date}</div>
            </div>
        </div>
        <div className="p-6 relative">
            <div className="flex flex-col items-center justify-center py-4">
                 <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100"><div ref={qrRef} /></div>
                 <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {ticket.id}</p>
            </div>
            <div className="space-y-3 mt-2">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"><span className="text-xs text-slate-500">Attendee</span><span className="text-sm font-semibold dark:text-white">{ticket.userName}</span></div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"><span className="text-xs text-slate-500">Status</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ticket.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{ticket.status.toUpperCase()}</span></div>
            </div>
        </div>
      </div>
    </div>
  );
};