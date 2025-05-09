
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userDetails: any | null;
  userType: 'admin' | 'lecturer' | 'student' | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userDetails: null,
  userType: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [userType, setUserType] = useState<'admin' | 'lecturer' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Clean up auth state
  const cleanupAuthState = () => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Sign out function
  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error("Error during global sign out:", err);
      }
      
      setUser(null);
      setSession(null);
      setUserDetails(null);
      setUserType(null);
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fetch user details from the appropriate table
  const fetchUserDetails = async (userId: string, type: 'admin' | 'lecturer' | 'student') => {
    try {
      const { data, error } = await supabase
        .from(`${type}_users`)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setUserDetails(data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      return null;
    }
  };

  // Determine user type by checking which tables contain their ID
  const determineUserType = async (userId: string) => {
    try {
      // Check admin table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
      if (adminData) {
        const details = await fetchUserDetails(userId, 'admin');
        if (details) {
          setUserType('admin');
          return 'admin';
        }
      }
      
      // Check lecturer table
      const { data: lecturerData, error: lecturerError } = await supabase
        .from('lecturer_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (lecturerData) {
        const details = await fetchUserDetails(userId, 'lecturer');
        if (details) {
          setUserType('lecturer');
          return 'lecturer';
        }
      }
      
      // Check student table
      const { data: studentData, error: studentError } = await supabase
        .from('student_users')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (studentData) {
        const details = await fetchUserDetails(userId, 'student');
        if (details) {
          setUserType('student');
          return 'student';
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error determining user type:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer data fetching to prevent deadlocks
        if (currentSession?.user) {
          setTimeout(() => {
            determineUserType(currentSession.user.id);
          }, 0);
        } else {
          setUserType(null);
          setUserDetails(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        determineUserType(currentSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    userDetails,
    userType,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
