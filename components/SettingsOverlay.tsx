import React from 'react';
import { X, Trash2, Database, Shield, Moon, Sun } from 'lucide-react';
import { Theme } from '../types';

interface SettingsOverlayProps {
  onClose: () => void;
  onClearHistory: () => void;
  onClearSaved: () => void;
  toggleTheme: () => void;
  currentTheme: Theme;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ onClose, onClearHistory, onClearSaved, toggleTheme, currentTheme }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
            <button 
                onClick={onClose}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                <X size={24} />
            </button>
        </div>

        <div className="space-y-4">
             {/* Theme Toggle */}
             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-slate-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                        Appearance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark/light mode</p>
                </div>
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                    {currentTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                    <Database size={18} className="text-blue-500" /> Data Management
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Manage your local application data.</p>
                
                <div className="space-y-2">
                    <button 
                        onClick={onClearHistory}
                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
                    >
                        <span>Clear Search History</span>
                        <Trash2 size={16} />
                    </button>
                    <button 
                        onClick={onClearSaved}
                        className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-300"
                    >
                        <span>Clear Saved Events</span>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-slate-900 dark:text-white font-medium mb-1 flex items-center gap-2">
                    <Shield size={18} className="text-green-500" /> About
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    EventHorizon v1.1.0
                </p>
            </div>
        </div>

        <button 
            onClick={onClose}
            className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl mt-6 transition-all"
        >
            Done
        </button>
      </div>
    </div>
  );
};