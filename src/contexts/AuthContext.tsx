import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
    // Check localStorage for existing session
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
    setLoading(false);
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const profileData = storage.getProfile(userId);
      if (profileData) {
        setProfile(profileData);
      }

      const userRole = storage.getUserRole(userId);
      if (userRole) {
        setRole(userRole as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const user = storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return { error: new Error('Invalid email or password') };
      }

      // Store session
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
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: AppRole) => {
    try {
      // Check if user already exists
      const existingUser = storage.getUserByEmail(email);
      if (existingUser) {
        return { error: new Error('Email already registered') };
      }

      // Create user
      const userId = `user_${Date.now()}`;
      const newUser = {
        id: userId,
        email,
        password, // In production, this should be hashed
        name,
      };

      storage.addUser(userId, newUser);
      storage.addProfile(userId, { user_id: userId, email, name });
      storage.addUserRole(userId, role);

      // Store session
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
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
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
