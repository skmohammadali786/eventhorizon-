import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, User, UserX, UserCheck } from 'lucide-react';
import { Ticket } from '../types';

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => Promise<{ valid: boolean; ticket?: Ticket; message?: string }>; 
  onConfirmEntry: (ticketId: string) => Promise<boolean>;
}

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess, onConfirmEntry }) => {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Scanned Ticket State
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'valid' | 'invalid' | 'used' | 'success_confirmed' | null>(null);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initScanner = async () => {
        if (!window.Html5Qrcode) {
            setError("Scanner library not loaded.");
            return;
        }

        try {
            if (scannerRef.current) {
                try { await scannerRef.current.clear(); } catch(e) {}
            }

            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText: string) => {
                    handleCodeScanned(decodedText);
                },
                (errorMessage: string) => {
                    // Ignore frame parse errors
                }
            );
            setIsScanning(true);
        } catch (err: any) {
            console.error("Camera start failed", err);
            if (err.name === 'NotAllowedError') {
                setError("Camera access denied. Please allow camera permissions in your browser settings.");
            } else {
                setError("Failed to start camera.");
            }
            setIsScanning(false);
        }
    };

    setTimeout(initScanner, 100);

    return () => {
        if (scannerRef.current) {
             if (scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(console.error);
             } else {
                 scannerRef.current.clear();
             }
        }
    };
  }, []);

  const handleCodeScanned = async (decodedText: string) => {
      // Pause scanning immediately
      if (scannerRef.current) {
          try { await scannerRef.current.pause(); } catch(e) {}
      }
      setIsScanning(false);
      setIsProcessing(true);

      try {
          const result = await onScanSuccess(decodedText);
          
          if (result.valid && result.ticket) {
              setScannedTicket(result.ticket);
              if (result.ticket.status === 'used') {
                  setScanStatus('used');
                  setScanMessage("Already Checked In");
              } else {
                  // Valid and Active -> Show Confirm Button
                  setScanStatus('valid');
                  setScanMessage("Valid Ticket");
              }
          } else {
              setScanStatus('invalid');
              setScanMessage(result.message || "Invalid Ticket");
          }
      } catch (e) {
          setScanStatus('invalid');
          setScanMessage("Scan Error");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleConfirmClick = async () => {
      if (!scannedTicket) return;
      setIsConfirming(true);
      
      const success = await onConfirmEntry(scannedTicket.id);
      
      setIsConfirming(false);
      if (success) {
          setScanStatus('success_confirmed');
          setScanMessage("Entry Confirmed!");
          // Automatically reset after 2 seconds for next person
          setTimeout(resetScanner, 2000);
      } else {
          setError("Failed to update database.");
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setError('');

      try {
          if (!scannerRef.current) scannerRef.current = new window.Html5Qrcode("reader");
          
          // Stop camera stream before scanning file to avoid conflict
          if (isScanning) {
             try { await scannerRef.current.stop(); setIsScanning(false); } catch (e) {}
          }
          
          const result = await scannerRef.current.scanFile(file, true);
          handleCodeScanned(result);
      } catch (err) {
          setError("Could not read QR code.");
          setIsProcessing(false);
      }
  };

  const resetScanner = () => {
      setScannedTicket(null);
      setScanStatus(null);
      setScanMessage('');
      setIsScanning(true);
      setIsProcessing(false);
      if (scannerRef.current) {
          try { 
              // If stopped, we might need to restart, but usually pause/resume works
              scannerRef.current.resume(); 
          } catch(e) {
              // If resume fails (e.g. stopped for file upload), restart it
               scannerRef.current.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 } },
                handleCodeScanned,
                () => {}
               ).catch(console.error);
          }
      }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 text-white">
              <Camera size={20} />
              <span className="font-bold">Scan Ticket</span>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={24} /></button>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-black overflow-hidden flex flex-col items-center justify-center">
          
          <div id="reader" className={`w-full h-full object-cover ${scanStatus ? 'hidden' : 'block'}`}></div>

          {isProcessing && (
              <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                  <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                  <p className="text-white font-medium">Verifying Ticket...</p>
              </div>
          )}

          {scanStatus && (
              <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center z-40 text-center animate-scale-in">
                  
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${
                      scanStatus === 'valid' ? 'bg-blue-500/20 border-blue-500 text-blue-500' :
                      scanStatus === 'success_confirmed' ? 'bg-green-500/20 border-green-500 text-green-500' :
                      scanStatus === 'used' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' :
                      'bg-red-500/20 border-red-500 text-red-500'
                  }`}>
                      {scanStatus === 'valid' ? <UserCheck size={40} /> : 
                       scanStatus === 'success_confirmed' ? <CheckCircle2 size={40} /> :
                       scanStatus === 'used' ? <User size={40} /> : <UserX size={40} />}
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-1">{scanMessage}</h2>
                  
                  {scannedTicket && (
                      <div className="bg-slate-800 p-4 rounded-xl w-full max-w-xs mt-4 border border-slate-700">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Guest</p>
                          <p className="text-lg font-bold text-white mb-3">{scannedTicket.userName}</p>
                          
                          <div className="flex justify-between border-t border-slate-700 pt-3">
                              <div>
                                  <p className="text-xs text-slate-400">Seat</p>
                                  <p className="font-mono text-white">{scannedTicket.seatNumber || 'GA'}</p>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs text-slate-400">Ticket ID</p>
                                  <p className="font-mono text-xs text-white truncate max-w-[100px]">{scannedTicket.id}</p>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="mt-8 w-full max-w-xs space-y-3">
                      {/* Only show Confirm button if status is VALID (not used, not confirmed yet) */}
                      {scanStatus === 'valid' && (
                          <button 
                             onClick={handleConfirmClick}
                             disabled={isConfirming}
                             className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                              {isConfirming ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                              Confirm Check-In
                          </button>
                      )}
                      
                      {scanStatus !== 'success_confirmed' && (
                          <button 
                             onClick={resetScanner}
                             className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl"
                          >
                              {scanStatus === 'valid' ? 'Cancel' : 'Scan Next'}
                          </button>
                      )}
                  </div>
              </div>
          )}

          {isScanning && !error && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-blue-500 rounded-2xl relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse"></div>
                  </div>
              </div>
          )}
          
          {error && !isScanning && !scanStatus && (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/90">
                  <AlertCircle size={48} className="text-red-500 mb-4" />
                  <p className="text-white font-bold mb-2">Camera Error</p>
                  <p className="text-slate-400 text-sm mb-6 max-w-[250px]">{error}</p>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                      <ImageIcon size={18} /> Upload Image Instead
                  </button>
              </div>
          )}
      </div>

      {!scanStatus && (
        <div className="w-full max-w-md p-6 flex flex-col gap-3 z-20">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold py-4 rounded-xl backdrop-blur-md flex items-center justify-center gap-3">
                <ImageIcon size={20} /> Scan from Gallery
            </button>
        </div>
      )}
    </div>
  );
};
