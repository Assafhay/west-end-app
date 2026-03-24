import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Handle redirect result — explicitly update state in case onAuthStateChanged
    // already fired with null before the redirect result was processed
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        const u = result.user;
        setUser({ id: u.uid, email: u.email, full_name: u.displayName, profile_image: u.photoURL });
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      }
    }).catch((error) => {
      console.error('Redirect sign-in error:', error.code, error.message);
    });

    // Firebase listener — fires immediately with cached state, then on every change
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName,
          profile_image: firebaseUser.photoURL,
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      // Popup is more reliable than redirect for custom domains (avoids 3rd-party cookie issues)
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        // Only fall back to redirect if popup is explicitly blocked
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      signInWithGoogle,
      logout,
    }}>
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
