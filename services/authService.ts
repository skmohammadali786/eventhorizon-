import { auth, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Service to handle Auth logic.
 * Currently defaults to MOCK mode if Firebase is not configured.
 */

export const sendOtp = async (email: string): Promise<{ success: boolean; message?: string }> => {
    // 1. REAL BACKEND MODE
    if (functions) {
        try {
            const sendOtpFn = httpsCallable(functions, 'sendOtp');
            // This 'sendOtp' cloud function should be connected to SendGrid on your backend
            await sendOtpFn({ email });
            return { success: true };
        } catch (error: any) {
            console.error("Firebase Function Error:", error);
            return { success: false, message: error.message };
        }
    }

    // 2. MOCK MODE (For Preview)
    console.log(`[MOCK AUTH] Sending OTP to ${email} via fake SendGrid...`);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 1500);
    });
};

export const verifyOtp = async (email: string, code: string): Promise<{ success: boolean; token?: string }> => {
    // 1. REAL BACKEND MODE
    if (functions) {
        try {
            const verifyOtpFn = httpsCallable(functions, 'verifyOtp');
            const result = await verifyOtpFn({ email, code });
            return { success: true, token: (result.data as any).token };
        } catch (error: any) {
             return { success: false };
        }
    }

    // 2. MOCK MODE
    console.log(`[MOCK AUTH] Verifying code ${code} for ${email}...`);
    return new Promise((resolve) => {
        setTimeout(() => {
            if (code === '1234') { // Mock "Correct" Code logic if you wanted strict testing
               resolve({ success: true, token: 'mock-jwt-token' });
            } else {
               // For demo purposes, we accept any 4 digit code in mock mode usually, 
               // but let's just say success
               resolve({ success: true, token: 'mock-jwt-token' });
            }
        }, 1500);
    });
};

export const createUserProfile = async (uid: string, data: any) => {
    // Save to Firestore here
    console.log("[MOCK FIRESTORE] Saving user profile:", data);
};