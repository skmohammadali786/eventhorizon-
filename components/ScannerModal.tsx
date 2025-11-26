import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, User, UserX, UserCheck } from 'lucide-react';
import { Ticket } from '../types';

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => Promise<{ valid: boolean; ticket?: Ticket; message?: string }>; 
  onConfirmEntry: (ticketId: string) => Promise<boolean>;
}

declare global { interface Window { Html5Qrcode: any; } }

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess, onConfirmEntry }) => {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'valid' | 'invalid' | 'used' | 'success_confirmed' | null>(null);

  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initScanner = async () => {
        if (!window.Html5Qrcode) return;
        try {
            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, handleCodeScanned, () => {});
            setIsScanning(true);
        } catch (err: any) {
            setError(err.name === 'NotAllowedError' ? "Camera access denied." : "Failed to start camera.");
            setIsScanning(false);
        }
    };
    setTimeout(initScanner, 100);
    return () => { if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(console.error); };
  }, []);

  const handleCodeScanned = async (decodedText: string) => {
      if (scannerRef.current) try { await scannerRef.current.pause(); } catch(e) {}
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
                  setScanStatus('valid');
                  setScanMessage("Valid Ticket");
              }
          } else {
              setScanStatus('invalid');
              setScanMessage(result.message || "Invalid Ticket");
          }
      } catch (e) { setScanStatus('invalid'); setScanMessage("Scan Error"); } finally { setIsProcessing(false); }
  };

  const handleConfirmClick = async () => {
      if (!scannedTicket) return;
      setIsConfirming(true);
      const success = await onConfirmEntry(scannedTicket.id);
      setIsConfirming(false);
      if (success) {
          setScanStatus('success_confirmed');
          setScanMessage("Entry Confirmed!");
          setTimeout(resetScanner, 2000);
      } else { setError("Failed to update database."); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
          if (!scannerRef.current) scannerRef.current = new window.Html5Qrcode("reader");
          if (isScanning) try { await scannerRef.current.stop(); setIsScanning(false); } catch (e) {}
          const result = await scannerRef.current.scanFile(file, true);
          handleCodeScanned(result);
      } catch (err) { setError("Could not read QR code."); setIsProcessing(false); }
  };

  const resetScanner = () => {
      setScannedTicket(null); setScanStatus(null); setScanMessage(''); setIsScanning(true); setIsProcessing(false);
      if (scannerRef.current) try { scannerRef.current.resume(); } catch(e) { scannerRef.current.start({ facingMode: "environment" }, { fps: 10 }, handleCodeScanned, () => {}); }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-20"><div className="text-white flex gap-2"><Camera /><span>Scan Ticket</span></div><button onClick={onClose}><X className="text-white" /></button></div>
      <div className="relative w-full max-w-md aspect-[3/4] bg-black overflow-hidden flex flex-col items-center justify-center">
          <div id="reader" className={`w-full h-full object-cover ${scanStatus ? 'hidden' : 'block'}`}></div>
          {isProcessing && <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}
          {scanStatus && (
              <div className="absolute inset-0 bg-slate-900 p-6 flex flex-col items-center justify-center z-40 text-center animate-scale-in">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${scanStatus === 'valid' ? 'border-blue-500 text-blue-500' : scanStatus === 'success_confirmed' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                      {scanStatus === 'valid' ? <UserCheck size={40} /> : scanStatus === 'success_confirmed' ? <CheckCircle2 size={40} /> : <UserX size={40} />}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">{scanMessage}</h2>
                  {scannedTicket && <div className="text-white mb-6"><p className="text-lg font-bold">{scannedTicket.userName}</p><p className="text-sm opacity-70">ID: {scannedTicket.id}</p></div>}
                  {scanStatus === 'valid' && <button onClick={handleConfirmClick} disabled={isConfirming} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl">{isConfirming ? 'Checking In...' : 'Confirm Check-In'}</button>}
                  {scanStatus !== 'success_confirmed' && <button onClick={resetScanner} className="w-full py-4 bg-slate-700 text-white font-bold rounded-xl mt-3">Cancel</button>}
              </div>
          )}
          {error && !isScanning && !scanStatus && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6"><AlertCircle size={48} className="text-red-500 mb-4" /><p>{error}</p><button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-white text-black px-6 py-3 rounded-xl">Upload Image</button></div>}
      </div>
      {!scanStatus && <div className="w-full max-w-md p-6"><input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/10 text-white py-4 rounded-xl backdrop-blur-md flex items-center justify-center gap-2"><ImageIcon /> Scan from Gallery</button></div>}
    </div>
  );
};