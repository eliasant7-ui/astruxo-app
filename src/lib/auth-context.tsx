/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase-client';
import { setUserProperties } from './usePageTracking';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  refreshToken: () => Promise<string | null>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  refreshToken: async () => null,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!isFirebaseConfigured ? false : true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing...', {
      isFirebaseConfigured,
      hasAuth: !!auth,
    });

    // If Firebase is not configured, set loading to false immediately
    if (!isFirebaseConfigured || !auth) {
      console.warn('⚠️ Firebase not configured, authentication disabled');
      setLoading(false);
      return;
    }

    console.log('✅ AuthContext: Setting up auth state listener');

    // Safety timeout: if Firebase doesn't respond in 3 seconds, stop loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Firebase auth state check timeout, setting loading to false');
      setLoading(false);
    }, 3000);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeoutId); // Clear timeout since we got a response
      console.log('🔍 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get and store token
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem('firebaseToken', idToken);
          
          // Track user in Google Analytics
          setUserProperties(firebaseUser.uid, {
            user_email: firebaseUser.email,
            user_verified: firebaseUser.emailVerified,
          });
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
          localStorage.removeItem('firebaseToken');
        }
      } else {
        setToken(null);
        localStorage.removeItem('firebaseToken');
      }

      setLoading(false);
      console.log('✅ AuthContext: Loading complete');
    });

    // Cleanup subscription and timeout
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Function to manually refresh token
  const refreshToken = async (): Promise<string | null> => {
    if (!user) {
      console.warn('⚠️ Cannot refresh token: No user logged in');
      return null;
    }

    try {
      console.log('🔄 Refreshing Firebase token...');
      const idToken = await user.getIdToken(true); // Force refresh
      setToken(idToken);
      localStorage.setItem('firebaseToken', idToken);
      console.log('✅ Token refreshed successfully');
      return idToken;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      setToken(null);
      localStorage.removeItem('firebaseToken');
      return null;
    }
  };

  // Function to get current ID token (or refresh if needed)
  const getIdToken = async (): Promise<string | null> => {
    if (!user) {
      console.warn('⚠️ Cannot get token: No user logged in');
      return null;
    }

    try {
      const idToken = await user.getIdToken(false); // Don't force refresh
      return idToken;
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, refreshToken, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
