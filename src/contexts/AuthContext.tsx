import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const DEMO_EMAIL = 'demo@zentrocredit.com';
const DEMO_PASSWORD = 'Demo2024!Zentro';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInAsDemo: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 1) Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN') {
        // If user just signed in from the auth page, go to last route or home
        const currentPath = window.location.pathname;
        if (currentPath === '/auth') {
          const last = localStorage.getItem('last_route');
          navigate(last && !last.startsWith('/auth') ? last : '/', { replace: true });
        }
      }
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    // 2) THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    setIsDemo(user?.email === DEMO_EMAIL);
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Cuenta creada exitosamente');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Sesión iniciada');
    }
    
    return { error };
  };

  const signInAsDemo = async () => {
    // Asegura que el usuario demo exista y la contraseña sea la correcta
    try {
      await supabase.functions.invoke('ensure-demo-user', { body: {} });
    } catch (e) {
      console.warn('ensure-demo-user failed, continuing to sign in', e);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      toast.error('Error al acceder al modo demo');
    } else {
      toast.success('🎭 Accediste en modo demo');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate('/auth');
    toast.info('Sesión cerrada');
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInAsDemo, signOut, loading, isDemo }}>
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
