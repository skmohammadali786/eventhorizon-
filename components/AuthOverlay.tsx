import React, { useState, useRef } from 'react';
import { X, Mail, User, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/authService';

interface AuthOverlayProps {
  onClose: () => void;
  onLogin: (name: string, email: string) => void;
}

type AuthStep = 'EMAIL' | 'OTP' | 'DETAILS';

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onClose, onLogin }) => {
  const [step, setStep] = useState<AuthStep>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');

  // Refs for OTP focus
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');

    try {
        const result = await sendOtp(email);
        if (result.success) {
            setStep('OTP');
        } else {
            setError(result.message || 'Failed to send verification code.');
        }
    } catch (err) {
        setError('Something went wrong. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 4) return;

    setIsLoading(true);
    setError('');

    try {
        const result = await verifyOtp(email, code);
        if (result.success) {
            setStep('DETAILS');
        } else {
             setError('Invalid code. Please try again.');
        }
    } catch (err) {
        setError('Verification failed.');
    } finally {
        setIsLoading(false);
    }
  };

  // 3. Finalize
  const handleFinalize = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      // In a real app, you would save the profile to Firestore here via service
      setTimeout(() => {
        onLogin(name || 'New User', email);
      }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
      if (isNaN(Number(value))) return;
      
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next
      if (value && index < 3) {
          otpRefs.current[index + 1]?.focus();
      }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
          otpRefs.current[index - 1]?.focus();
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

        <div className="text-center mb-8 animate-fade-in delay-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 mb-4 border border-blue-200 dark:border-blue-500/20">
                {step === 'EMAIL' && <Mail size={32} />}
                {step === 'OTP' && <ShieldCheck size={32} />}
                {step === 'DETAILS' && <User size={32} />}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {step === 'EMAIL' && 'Welcome'}
                {step === 'OTP' && 'Verify Identity'}
                {step === 'DETAILS' && 'Profile Details'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                {step === 'EMAIL' && 'Enter your email to sign in or create an account.'}
                {step === 'OTP' && `We sent a code to ${email}.`}
                {step === 'DETAILS' && 'Tell us a bit about yourself.'}
            </p>
        </div>
        
        {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg text-center">
                {error}
            </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-slide-in-right">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <>Continue <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        {/* STEP 2: OTP */}
        {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slide-in-right">
                 <div className="flex justify-center gap-3">
                    {otp.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={el => otpRefs.current[idx] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-14 h-16 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    ))}
                 </div>
                 <button 
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 4}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Verify Code'}
                </button>
                <div className="text-center">
                    <button type="button" onClick={() => setStep('EMAIL')} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Change Email
                    </button>
                </div>
            </form>
        )}

        {/* STEP 3: DETAILS */}
        {step === 'DETAILS' && (
            <form onSubmit={handleFinalize} className="space-y-4 animate-slide-in-right">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            required 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 mt-4 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : 'Create Account'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};