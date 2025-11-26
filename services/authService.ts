import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';

/**
 * Service to handle Auth logic.
 * Handles switching between Real Firebase Backend and Mock Mode.
 */

// 1. REAL BACKEND: GOOGLE SIGN IN
export const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // Map to our app's User type
            const appUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName}&background=0D8ABC&color=fff`
            };

            // Save/Update profile in Firestore
            await saveUserProfile(appUser);
            
            return { success: true, user: appUser };
        } catch (error: any) {
            console.error("Google Sign In Error:", error);
            
            // Provide specific help for domain errors
            if (error.code === 'auth/unauthorized-domain') {
                return { 
                    success: false, 
                    message: `Domain not authorized. Add ${window.location.hostname} to Firebase Console.` 
                };
            }
            if (error.code === 'auth/popup-closed-by-user') {
                return { success: false, message: "Sign in cancelled." };
            }
            if (error.code === 'auth/popup-blocked') {
                return { success: false, message: "Popup blocked. Please allow popups for this site." };
            }

            return { success: false, message: error.message };
        }
    }

    return { success: false, message: "Firebase not configured." };
};

// 2. REAL BACKEND: EMAIL/PASSWORD REGISTRATION
export const registerWithEmail = async (name: string, email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            const firebaseUser = result.user;

            // Update Auth Profile with Name
            await updateProfile(firebaseUser, { displayName: name });

            const appUser: User = {
                id: firebaseUser.uid,
                name: name,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
            };

            await saveUserProfile(appUser);
            return { success: true, user: appUser };
        } catch (error: any) {
            console.error("Registration Error:", error);
            if (error.code === 'auth/email-already-in-use') return { success: false, message: "Email is already registered." };
            if (error.code === 'auth/weak-password') return { success: false, message: "Password should be at least 6 characters." };
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: "Firebase not configured." };
};

// 3. REAL BACKEND: EMAIL/PASSWORD LOGIN
export const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            const firebaseUser = result.user;

            // Fetch full profile from Firestore to get avatar if customized, else fallback
            let userProfile = await getUserProfile(firebaseUser.uid);
            
            if (!userProfile) {
                userProfile = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    avatar: `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=0D8ABC&color=fff`
                };
            }

            return { success: true, user: userProfile };
        } catch (error: any) {
            console.error("Login Error:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                return { success: false, message: "Invalid email or password." };
            }
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: "Firebase not configured." };
};

// 4. REAL BACKEND: GUEST LOGIN (Anonymous Auth)
export const loginAsGuest = async (name: string, email: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            // 1. Authenticate anonymously in Firebase to get a real UID
            const result = await signInAnonymously(auth);
            const firebaseUser = result.user;

            // 2. Create the User object using the form data provided
            const guestUser: User = {
                id: firebaseUser.uid,
                name: name,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
            };

            // 3. Save this user to Firestore so their data persists
            await saveUserProfile(guestUser);

            return { success: true, user: guestUser };

        } catch (error: any) {
            console.error("Guest Login Error:", error);
            if (error.code === 'auth/admin-restricted-operation') {
                return { success: false, message: "Anonymous login disabled in Firebase Console." };
            }
            return { success: false, message: error.message };
        }
    }

    // MOCK FALLBACK (If Firebase is down or not configured)
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUser: User = {
        id: `guest-${Date.now()}`,
        name: name,
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
    };

    return { success: true, user: mockUser };
};

export const logoutUser = async () => {
    if (auth) {
        try {
            await signOut(auth);
            console.log("✅ Signed out from Firebase");
        } catch (e) {
            console.error("Sign out error", e);
        }
    }
};

export const saveUserProfile = async (user: User) => {
    // 1. REAL BACKEND MODE
    if (db) {
        try {
            await setDoc(doc(db, "users", user.id), user, { merge: true });
            console.log("✅ User profile saved to Firestore");
            return;
        } catch (e) {
            console.error("Error saving profile to Firestore:", e);
        }
    }
    
    // 2. MOCK MODE
    console.log("[Mock Save] User Profile:", user);
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (db) {
        try {
            const docRef = doc(db, "users", userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as User;
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
        }
    }
    return null;
};