import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from '../types';

export const loginWithGoogle = async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            const appUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName}&background=0D8ABC&color=fff`
            };
            await saveUserProfile(appUser);
            return { success: true, user: appUser };
        } catch (error: any) {
            if (error.code === 'auth/unauthorized-domain') return { success: false, message: `Domain not authorized. Add ${window.location.hostname} to Firebase Console.` };
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: "Firebase not configured." };
};

export const registerWithEmail = async (name: string, email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(result.user, { displayName: name });
            const appUser: User = {
                id: result.user.uid,
                name: name,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
            };
            await saveUserProfile(appUser);
            return { success: true, user: appUser };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: "Firebase not configured." };
};

export const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            let userProfile = await getUserProfile(result.user.uid);
            if (!userProfile) {
                userProfile = {
                    id: result.user.uid,
                    name: result.user.displayName || 'User',
                    email: result.user.email || '',
                    avatar: `https://ui-avatars.com/api/?name=${result.user.displayName || 'User'}&background=0D8ABC&color=fff`
                };
            }
            return { success: true, user: userProfile };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: "Firebase not configured." };
};

export const loginAsGuest = async (name: string, email: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    if (auth) {
        try {
            const result = await signInAnonymously(auth);
            const guestUser: User = {
                id: result.user.uid,
                name: name,
                email: email,
                avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff`
            };
            await saveUserProfile(guestUser);
            return { success: true, user: guestUser };
        } catch (error: any) {
            if (error.code === 'auth/admin-restricted-operation') return { success: false, message: "Anonymous login disabled in Firebase Console." };
            return { success: false, message: error.message };
        }
    }
    const mockUser: User = { id: `guest-${Date.now()}`, name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff` };
    return { success: true, user: mockUser };
};

export const logoutUser = async () => {
    if (auth) {
        try { await signOut(auth); } catch (e) { console.error(e); }
    }
};

export const saveUserProfile = async (user: User) => {
    if (db) {
        try { await setDoc(doc(db, "users", user.id), user, { merge: true }); } catch (e) { console.error(e); }
    }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (db) {
        try {
            const snap = await getDoc(doc(db, "users", userId));
            if (snap.exists()) return snap.data() as User;
        } catch (e) { console.error(e); }
    }
    return null;
};