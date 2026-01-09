import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing authentication check...');
    // Check for internal user session first
    const internalUser = sessionStorage.getItem('clinic_user');
    if (internalUser) {
      console.log('AuthContext: Found internal user session');
      try {
        const userData = JSON.parse(internalUser);
        // Check if session has expired (24 hours)
        const sessionExpiry = userData.loginTime ? new Date(userData.loginTime).getTime() + (24 * 60 * 60 * 1000) : 0;
        const now = new Date().getTime();

        if (now > sessionExpiry) {
          console.log('AuthContext: Session expired, clearing');
          // Session expired, clear it
          sessionStorage.removeItem('clinic_user');
          setLoading(false);
          return;
        }

        console.log('AuthContext: Setting user profile from session storage');
        setUserProfile(userData);
        setUser({ id: userData.id, email: userData.username } as any); // Mock user object
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored user session:', error);
        sessionStorage.removeItem('clinic_user'); // Clear corrupted data
      }
    } else {
      console.log('AuthContext: No internal user session found');
    }

    // Do nothing if Supabase isn't configured.
    // The UI will show a message to the user.
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('AuthContext: Auth state changed - event:', _event, 'session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: User authenticated, fetching profile');
          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          setUserProfile(profile);
        } else {
          console.log('AuthContext: No user session, clearing profile');
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    // Initial session check
    const getInitialSession = async () => {
        console.log('AuthContext: Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Initial session result:', !!session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('AuthContext: Initial session has user, fetching profile');
          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          setUserProfile(profile);
        } else {
          console.log('AuthContext: Initial session has no user');
          setUserProfile(null);
        }

        setLoading(false);
      }

    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    console.log('AuthContext: Starting logout process...');
    try {
      // Clear internal session
      console.log('AuthContext: Clearing internal session');
      sessionStorage.removeItem('clinic_user');

      // Also sign out from Supabase if configured
      if (supabase) {
        console.log('AuthContext: Signing out from Supabase');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
          // Don't throw here, continue with logout
        }
      }

      console.log('AuthContext: Forcing page reload to clear state');
      // Force page reload to clear all state and redirect to login
      window.location.reload();
    } catch (error: any) {
      console.error('Logout error:', error);
      // Force reload anyway to ensure user is logged out
      window.location.reload();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userProfile) return false;
    return userProfile.permissions.includes(permission);
  };

  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const isAuthenticated = !!user;

  const value = {
    user,
    session,
    userProfile,
    loading,
    isAuthenticated,
    login,
    signUp,
    logout,
    hasPermission,
    isAdmin,
  };

  // While loading, we can show a blank screen or a spinner
  // Here, we prevent rendering children until the initial session check is complete
  console.log('AuthContext: Rendering provider - loading:', loading, 'user:', !!user);
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
