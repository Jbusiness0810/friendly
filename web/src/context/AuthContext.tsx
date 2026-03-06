import {
  createContext,
  useContext,
  createSignal,
  onMount,
  onCleanup,
  type ParentComponent,
  type Accessor,
} from "solid-js";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  interests: string[];
  intent: string[];
  social_style: string | null;
  fun_fact: string | null;
  ideal_hangouts: string[];
  political_alignment: string | null;
  verified: boolean;
  created_at: string;
}

interface AuthContextValue {
  session: Accessor<Session | null>;
  user: Accessor<User | null>;
  profile: Accessor<UserProfile | null>;
  loading: Accessor<boolean>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const [session, setSession] = createSignal<Session | null>(null);
  const [profile, setProfile] = createSignal<UserProfile | null>(null);
  const [loading, setLoading] = createSignal(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as UserProfile | null);
  };

  onMount(async () => {
    // Get initial session
    const {
      data: { session: initialSession },
    } = await supabase.auth.getSession();
    setSession(initialSession);
    if (initialSession?.user) {
      await fetchProfile(initialSession.user.id);
    }
    setLoading(false);

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    onCleanup(() => subscription.unsubscribe());
  });

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (_) {
      // Force sign-out even if Supabase call fails
    }
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const s = session();
    if (s?.user) await fetchProfile(s.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: () => session()?.user ?? null,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
