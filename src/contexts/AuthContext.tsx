import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "administrador"
  | "gerente"
  | "cajero"
  | "almacenero"
  | "vendedor"
  | "contador"
  | "supervisor";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  isDemo: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

const DEMO_KEY = "minimarket_demo_mode";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isDemo, setIsDemo] = useState(
    typeof window !== "undefined" &&
      window.localStorage.getItem(DEMO_KEY) === "1",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer role fetch
        setTimeout(() => fetchRole(sess.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchRole(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(userId: string) {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (!error && data?.role) setRole(data.role as AppRole);
      else setRole("cajero");
    } catch {
      setRole("cajero");
    }
  }

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp: AuthCtx["signUp"] = async (email, password) => {
    const redirect =
      typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect },
    });
    return error ? { error: error.message } : {};
  };

  const signInWithGoogle = async () => {
    const redirect =
      typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirect },
    });
  };

  const enterDemo = () => {
    if (typeof window !== "undefined") localStorage.setItem(DEMO_KEY, "1");
    setIsDemo(true);
    setRole("administrador");
  };

  const signOut = async () => {
    if (typeof window !== "undefined") localStorage.removeItem(DEMO_KEY);
    setIsDemo(false);
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "administrador" || isDemo,
        isDemo,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        enterDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}