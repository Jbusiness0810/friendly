import { createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * Handles OAuth redirects.
 * Supabase's detectSessionInUrl automatically exchanges the ?code= param
 * for a session. This component just waits for that to complete, then
 * routes the user based on whether they have a profile.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  createEffect(async () => {
    if (loading()) return;

    const s = session();
    if (!s) {
      console.error("[Auth] No session after callback — redirecting to landing");
      navigate("/landing", { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", s.user.id)
      .maybeSingle();

    navigate(profile ? "/" : "/onboarding", { replace: true });
  });

  return (
    <div class="loading-screen">
      <div class="loading-spinner" />
    </div>
  );
};

export default AuthCallback;
