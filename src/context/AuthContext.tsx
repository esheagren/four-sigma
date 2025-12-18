import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDeviceId } from '../lib/device';
import { supabase } from '../lib/supabaseClient';

interface User {
  id: string;
  email: string | null;
  displayName: string;
  isAnonymous: boolean;
  sessionCount: number;
  totalScore: number;
  averageScore: number;
  gamesPlayed: number;
  currentStreak: number;
  bestStreak: number;
  calibrationRate: number;
  questionsCaptured: number;
  bestSingleScore: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
  hasClaimedUsername: boolean;
  authToken: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  claimUsername: (username: string) => Promise<{ success: boolean; error?: string; suggestions?: string[] }>;
  claimAccount: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const isAnonymous = user?.isAnonymous ?? true;
  const hasClaimedUsername = user ? !user.isAnonymous && !user.email : false;

  // Initialize user on mount
  useEffect(() => {
    initializeUser();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setAuthToken(session.access_token);
        await fetchCurrentUser(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setAuthToken(null);
        // Re-initialize as anonymous user
        await initializeDeviceUser();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setAuthToken(session.access_token);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeUser() {
    setIsLoading(true);
    try {
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setAuthToken(session.access_token);
        await fetchCurrentUser(session.access_token);
      } else {
        // Initialize as anonymous device user
        await initializeDeviceUser();
      }
    } catch (err) {
      console.error('Failed to initialize user:', err);
      // Fall back to anonymous
      await initializeDeviceUser();
    } finally {
      setIsLoading(false);
    }
  }

  async function initializeDeviceUser() {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          ...data.user,
          email: null,
        });
      }
    } catch (err) {
      console.error('Failed to initialize device user:', err);
    }
  }

  async function fetchCurrentUser(token: string) {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Device-Id': deviceId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.session) {
        setAuthToken(data.session.access_token);
        // Set session in Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An error occurred during login' };
    }
  }

  async function signup(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      if (data.session) {
        setAuthToken(data.session.access_token);
        // Set session in Supabase client
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: 'An error occurred during signup' };
    }
  }

  async function logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      setAuthToken(null);
      // Re-initialize as anonymous user
      await initializeDeviceUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  async function refreshUser(): Promise<void> {
    if (authToken) {
      await fetchCurrentUser(authToken);
    } else {
      await initializeDeviceUser();
    }
  }

  async function claimUsername(username: string): Promise<{ success: boolean; error?: string; suggestions?: string[] }> {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/claim-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error,
          suggestions: data.suggestions
        };
      }

      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('Claim username error:', err);
      return { success: false, error: 'Failed to claim username' };
    }
  }

  async function claimAccount(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceId = getDeviceId();
      const response = await fetch('/api/auth/claim-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      if (data.session) {
        setAuthToken(data.session.access_token);
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('Claim account error:', err);
      return { success: false, error: 'Failed to claim account' };
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAnonymous,
    hasClaimedUsername,
    authToken,
    login,
    signup,
    logout,
    refreshUser,
    claimUsername,
    claimAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
