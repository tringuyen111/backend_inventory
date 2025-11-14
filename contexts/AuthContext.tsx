import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthError, PostgrestError, Session, User } from '@supabase/supabase-js';

type UserProfileData = {
  full_name: string | null;
  phone: string | null;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  logout: () => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { full_name: string; phone: string }) => Promise<{ error: PostgrestError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
        // Fetch profile details. The user's role is now determined from their permissions
        // in the PermissionsContext, not a direct property on their profile.
        const { data: profileDetails, error: profileError } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();

        // A missing profile record is not a fatal error, so we only log other errors.
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile details:', profileError.message);
        }

        const profileData = {
            full_name: profileDetails?.full_name || null,
            phone: profileDetails?.phone || null,
        };
        setProfile(profileData);

    } catch (e: any) {
        console.error('Exception fetching user profile:', e.message);
        setProfile(null);
    }
  }, []);
  
  useEffect(() => {
    const initializeSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchUserProfile(currentUser);
        setLoading(false);
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      fetchUserProfile(currentUser);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: { full_name: string; phone: string }) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (!error) {
        // FIX: Refetch profile after update to ensure data consistency and prevent
        // a crash if the profile was initially null.
        await fetchUserProfile(user);
    }
    return { error };
  };

  const value = {
    session,
    user,
    profile,
    loading,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};