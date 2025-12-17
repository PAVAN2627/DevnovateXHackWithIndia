import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';

type AppRole = 'organizer' | 'participant';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  isOrganizer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        // Fallback to localStorage for development
        const sessionData = localStorage.getItem('auth_session');
        if (sessionData) {
          try {
            const { userId, email } = JSON.parse(sessionData);
            const userData = storage.getUser(userId);
            const profileData = storage.getProfile(userId);
            const userRole = storage.getUserRole(userId);
            
            if (userData && profileData) {
              setUser(userData);
              setSession({ user: userData, email });
              setProfile(profileData);
              setRole(userRole as AppRole);
            }
          } catch (error) {
            console.error('Error restoring session:', error);
          }
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Try Supabase first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData as Profile);
      } else {
        // Fallback to localStorage
        const localProfile = storage.getProfile(userId);
        if (localProfile) {
          setProfile(localProfile);
        }
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!roleError && roleData) {
        setRole(roleData.role as AppRole);
      } else {
        // Fallback to localStorage
        const localRole = storage.getUserRole(userId);
        if (localRole) {
          setRole(localRole as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage
      const localProfile = storage.getProfile(userId);
      if (localProfile) {
        setProfile(localProfile);
      }
      const localRole = storage.getUserRole(userId);
      if (localRole) {
        setRole(localRole as AppRole);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback to localStorage
        const user = storage.getUserByEmail(email);
        if (!user || user.password !== password) {
          return { error: new Error('Invalid email or password') };
        }

        localStorage.setItem('auth_session', JSON.stringify({ 
          userId: user.id, 
          email: user.email 
        }));

        setUser(user);
        setSession({ user, email });
        const profileData = storage.getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
        }
        const userRole = storage.getUserRole(user.id);
        setRole(userRole as AppRole);

        return { error: null };
      }

      // Supabase auth successful
      setUser(data.user);
      setSession(data.session);
      await fetchUserData(data.user.id);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: AppRole) => {
    try {
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          }
        }
      });

      if (error) {
        // Fallback to localStorage
        const existingUser = storage.getUserByEmail(email);
        if (existingUser) {
          return { error: new Error('Email already registered') };
        }

        const userId = `user_${Date.now()}`;
        const newUser = {
          id: userId,
          email,
          password,
          name,
        };

        storage.addUser(userId, newUser);
        storage.addProfile(userId, { user_id: userId, email, name });
        storage.addUserRole(userId, role);

        localStorage.setItem('auth_session', JSON.stringify({ 
          userId, 
          email 
        }));

        setUser(newUser);
        setSession({ user: newUser, email });
        const profileData = storage.getProfile(userId);
        setProfile(profileData);
        setRole(role);

        return { error: null };
      }

      // Supabase signup successful
      if (data.user) {
        // Create profile and role in Supabase
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email,
          name,
        });

        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role,
        });

        setUser(data.user);
        setSession(data.session);
        await fetchUserData(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Try Supabase signout first
    await supabase.auth.signOut();
    
    // Also clear localStorage
    localStorage.removeItem('auth_session');
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
    }
  };

  const value = {
    user,
    session,
    profile,
    role,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isOrganizer: role === 'organizer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
