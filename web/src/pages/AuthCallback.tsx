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
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error || !code) {
        navigate("/landing", { replace: true });
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        navigate("/landing", { replace: true });
        return;
      }

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
    } catch {
      navigate("/landing", { replace: true });
    }
  });

  return (
    <div class="loading-screen">
      <div class="loading-spinner" />
    </div>
  );
};

export default AuthCallback;
