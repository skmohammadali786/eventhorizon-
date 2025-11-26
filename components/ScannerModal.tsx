import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ScannerModalProps {
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

declare global {
  interface Window {
    Html5QrcodeScanner: any;
  }
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const scannerRef = useRef<any>(null);
  
  useEffect(() => {
    // Delay initialization slightly to ensure DOM is ready
    const timeoutId = setTimeout(() => {
        if (window.Html5QrcodeScanner && !scannerRef.current) {
            try {
                const scanner = new window.Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true
                    },
                    /* verbose= */ false
                );
                
                scannerRef.current = scanner;
                
                scanner.render((decodedText: string) => {
                    // Stop scanning on success
                    if (scannerRef.current) {
                        scannerRef.current.clear().then(() => {
                            onScanSuccess(decodedText);
                        }).catch((err: any) => {
                            console.warn("Scanner clear warning:", err);
                            onScanSuccess(decodedText);
                        });
                        scannerRef.current = null;
                    }
                }, (error: any) => {
                    // Ignore transient scan errors, they happen every frame
                });
            } catch (e) {
                console.error("Scanner initialization failed", e);
            }
        }
    }, 100);

    return () => {
        clearTimeout(timeoutId);
        if (scannerRef.current) {
            try {
                scannerRef.current.clear().catch((error: any) => {
                    console.warn("Failed to clear scanner on unmount", error);
                });
            } catch (e) {
                console.warn("Error during cleanup", e);
            }
            scannerRef.current = null;
        }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden relative animate-scale-in">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
            <X size={24} />
        </button>
        
        <div className="p-4 text-center border-b border-slate-200 dark:border-slate-800">
             <h3 className="font-bold text-slate-900 dark:text-white">Scan Ticket</h3>
             <p className="text-xs text-slate-500">Point camera at attendee's QR code</p>
        </div>

        <div className="p-0 bg-black min-h-[350px] relative flex flex-col justify-center">
            <div id="reader" className="w-full h-full overflow-hidden"></div>
             {/* Custom styling override for the library's injected elements */}
             <style>{`
                #reader__scan_region { background: transparent !important; }
                #reader__dashboard_section_csr button { 
                    background: white; 
                    border: none; 
                    padding: 8px 16px; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    margin-top: 10px;
                    cursor: pointer;
                }
                #reader__dashboard_section_swaplink { display: none !important; }
                #reader video { object-fit: cover; border-radius: 0; }
            `}</style>
        </div>
        
        <div className="p-3 bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
            Allow camera permission to start scanning
        </div>
      </div>
    </div>
  );
};