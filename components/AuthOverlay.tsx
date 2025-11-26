import React, { useState } from 'react';
import { X, Mail, User, ArrowRight, Chrome, LogIn, Copy, Lock, UserPlus } from 'lucide-react';
import { loginWithGoogle, loginAsGuest, registerWithEmail, loginWithEmail } from '../services/authService';
import { User as UserType } from '../types';

interface AuthOverlayProps {
  onClose: () => void;
  onLogin: (user: UserType) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'guest'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Handle Google Login
  const handleGoogleLogin = async () => {
      setIsLoading(true);
      setError('');
      try {
          const result = await loginWithGoogle();
          if (result.success && result.user) {
              onLogin(result.user);
          } else {
              setError(result.message || 'Google Sign In failed.');
          }
      } catch (e) {
          setError('An unexpected error occurred.');
      } finally {
          setIsLoading(false);
      }
  };

  // Handle Email/Password Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) return;
      if (mode === 'signup' && !name) return;

      setIsLoading(true);
      setError('');

      try {
          let result;
          if (mode === 'signup') {
              result = await registerWithEmail(name, email, password);
          } else {
              result = await loginWithEmail(email, password);
          }

          if (result.success && result.user) {
              onLogin(result.user);
          } else {
              setError(result.message || 'Authentication failed.');
          }
      } catch (e) {
          setError('Something went wrong. Please try again.');
      } finally {
          setIsLoading(false);
      }
  };

  // Handle Guest Login
  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setIsLoading(true);
    setError('');

    try {
        const result = await loginAsGuest(name, email);
        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            setError(result.message || 'Guest login failed.');
        }
    } catch (err) {
        setError('Something went wrong.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-up">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
            <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 animate-fade-in delay-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 mb-4 border border-blue-200 dark:border-blue-500/20">
                {mode === 'signup' ? <UserPlus size={32} /> : <LogIn size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {mode === 'signup' ? 'Create Account' : (mode === 'guest' ? 'Guest Access' : 'Welcome Back')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                {mode === 'signup' 
                    ? 'Join to host events and buy tickets.' 
                    : (mode === 'guest' ? 'Quick access without a password.' : 'Sign in to access your tickets and plans.')}
            </p>
        </div>
        
        {/* Error Display */}
        {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-xl text-center break-words border border-red-200 dark:border-red-900/50">
                {error.includes("Domain not authorized") ? (
                    <div className="flex flex-col gap-2">
                        <p className="font-bold">Security Block</p>
                        <p>Domain not whitelisted in Firebase.</p>
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg font-mono text-[10px] break-all select-all flex items-center justify-between gap-2">
                            <span>{window.location.hostname}</span>
                            <button onClick={() => navigator.clipboard.writeText(window.location.hostname)} className="p-1 hover:bg-black/10 rounded"><Copy size={12} /></button>
                        </div>
                    </div>
                ) : error}
            </div>
        )}

        {/* Guest Mode UI */}
        {mode === 'guest' ? (
             <form onSubmit={handleGuestLogin} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Your Name" />
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@example.com" />
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 mt-2 disabled:opacity-50">
                    {isLoading ? 'Processing...' : 'Continue as Guest'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-slate-500 mt-2 hover:underline">Cancel</button>
            </form>
        ) : (
            // Standard Login/Signup UI
            <div className="space-y-4">
                <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-500 rounded-full animate-spin"></div> : <><Chrome size={20} className="text-blue-500" /><span>Continue with Google</span></>}
                </button>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or using email</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="name@example.com" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" minLength={6} />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 mt-4 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                <div className="text-center space-y-2 mt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {mode === 'signup' ? 'Already have an account?' : 'Don\'t have an account?'}
                        <button 
                            type="button"
                            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
                            className="ml-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                            {mode === 'signup' ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                    <button 
                        type="button"
                        onClick={() => { setMode('guest'); setError(''); }}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};