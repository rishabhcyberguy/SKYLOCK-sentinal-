import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types/airspace';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemoSession: boolean;
  demoOperator: { callsign: string; role: string };
  signInWithGoogle: () => Promise<void>;
  signOutOperator: () => Promise<void>;
  startDemoSession: (callsign?: string) => void;
  endSession: () => void;
}

const ACCESS_KEY = 'aegis-system-access';
const CALLSIGN_KEY = 'aegis-operator-callsign';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (urlParams?.get('autostart') === '1') {
      return true;
    }
    return sessionStorage.getItem(ACCESS_KEY) === 'granted';
  });
  const [demoCallsign, setDemoCallsign] = useState<string>(() => {
    return sessionStorage.getItem(CALLSIGN_KEY) || 'OPERATOR-01';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDemoSession(false);
        sessionStorage.setItem(ACCESS_KEY, 'granted');
        // Fetch or create profile in Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              userId: currentUser.uid,
              email: currentUser.email || 'operator@skylock.defense',
              displayName: currentUser.displayName || 'Flight Commander',
              callsign: (currentUser.displayName || 'VIPER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || 'VIPER',
              role: 'commander',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.warn('Could not load user profile from Firestore:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signOutOperator = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(CALLSIGN_KEY);
      setIsDemoSession(false);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
  };

  const startDemoSession = (callsign = 'OPERATOR-01') => {
    sessionStorage.setItem(ACCESS_KEY, 'granted');
    sessionStorage.setItem(CALLSIGN_KEY, callsign);
    setDemoCallsign(callsign);
    setIsDemoSession(true);
  };

  const endSession = () => {
    if (user) {
      signOutOperator();
    } else {
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(CALLSIGN_KEY);
      setIsDemoSession(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoSession,
        demoOperator: {
          callsign: demoCallsign,
          role: 'Operator (Local)',
        },
        signInWithGoogle,
        signOutOperator,
        startDemoSession,
        endSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
