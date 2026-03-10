import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { supabase } from "../lib/supabase";

/**
 * Handles OAuth redirects (PKCE code exchange).
 * Supabase redirects here with ?code=... after provider sign-in.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  onMount(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[Auth] Code exchange failed:", error.message);
        navigate("/landing", { replace: true });
        return;
      }
    }

    // Session is now set — check if user has a profile
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/landing", { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
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
