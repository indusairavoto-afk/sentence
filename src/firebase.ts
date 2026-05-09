import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, increment, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth();

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In failed", error);
    throw error;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out failed", error);
    throw error;
  }
}

export async function incrementGlobalStat(field: 'visitors' | 'uses' | 'donationCount') {
  const statsRef = doc(db, 'stats', 'global');
  try {
    const docSnap = await getDoc(statsRef);
    if (!docSnap.exists()) {
      await setDoc(statsRef, {
        visitors: field === 'visitors' ? 1 : 0,
        uses: field === 'uses' ? 1 : 0,
        donationCount: field === 'donationCount' ? 1 : 0
      });
    } else {
      await updateDoc(statsRef, {
        [field]: increment(1)
      });
    }
  } catch (error: any) {
    console.error(`Failed to increment ${field}`, error);
  }
}

