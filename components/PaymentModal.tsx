import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { EventItem } from '../types';

interface PaymentModalProps {
  event: EventItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ event, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate Payment Gateway delay
    setTimeout(() => {
        setIsProcessing(false);
        setStep('success');
        
        // Auto close after showing success
        setTimeout(() => {
            onSuccess();
        }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-scale-in">
        
        {step === 'form' && (
            <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Lock size={16} className="text-green-500" /> Secure Payment
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">${event.priceValue}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-slate-500 dark:text-slate-400">{event.title}</p>
                             <p className="text-xs text-blue-500 font-medium">1 Ticket</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Card Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input required type="text" placeholder="0000 0000 0000 0000" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Expiry</label>
                                <input required type="text" placeholder="MM/YY" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">CVC</label>
                                <input required type="text" placeholder="123" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 mt-4 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>Processing...</>
                            ) : (
                                <>Pay ${event.priceValue}</>
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-slate-400">
                            Powered by Stripe (Mock Mode). No real charge will be made.
                        </p>
                    </div>
                </div>
            </>
        )}

        {step === 'success' && (
             <div className="p-12 flex flex-col items-center justify-center text-center animate-fade-in">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
                 <p className="text-slate-500 dark:text-slate-400">Generating your ticket...</p>
             </div>
        )}
      </div>
    </div>
  );
};