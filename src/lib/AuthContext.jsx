import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();

    // Keep auth state in sync across tabs / token refresh / sign-out elsewhere.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // A row in `profiles` (keyed by auth.users.id) is how this app tracks who's
  // actually provisioned to use it — mirrors base44's "user_not_registered" gate.
  const loadProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (!profile) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email, role: profile.role });
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('Profile load failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to load profile' });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      authChecked,
      logout,
      checkUserAuth,
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
