import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { supabase } from "../lib/supabase";

/**
 * Handles OAuth redirects (PKCE code exchange).
 * Supabase redirects here with ?code=... after provider sign-in.
 *
 * We set detectSessionInUrl: false to avoid a race with AuthContext,
 * so the exchange must happen manually here.
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  onMount(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      console.log("[AuthCallback] mounted");
      console.log("[AuthCallback] URL:", window.location.href);
      console.log("[AuthCallback] code present:", !!code);
      console.log("[AuthCallback] error param:", error);

      // Check PKCE code verifier exists in storage
      const storageKey = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token-code-verifier`;
      const codeVerifier = localStorage.getItem(storageKey);
      console.log("[AuthCallback] PKCE code verifier key:", storageKey);
      console.log("[AuthCallback] PKCE code verifier present:", !!codeVerifier);

      // Supabase returns ?error= when the server-side exchange fails
      if (error) {
        console.error("[AuthCallback] OAuth error:", error, errorDescription);
        navigate("/landing", { replace: true });
        return;
      }

      if (!code) {
        console.error("[AuthCallback] No code in URL — redirecting to landing");
        navigate("/landing", { replace: true });
        return;
      }

      console.log("[AuthCallback] calling exchangeCodeForSession...");
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      console.log("[AuthCallback] exchange result:", {
        user: data?.user?.id,
        email: data?.user?.email,
        error: exchangeError?.message,
        status: exchangeError?.status,
      });

      if (exchangeError) {
        console.error("[AuthCallback] Code exchange failed:", exchangeError.message, exchangeError);
        navigate("/landing", { replace: true });
        return;
      }

      // Verify session is now set
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("[AuthCallback] session after exchange:", !!session, session?.user?.id);

      if (!session) {
        console.error("[AuthCallback] No session — redirecting to landing");
        navigate("/landing", { replace: true });
        return;
      }

      // Check if user has a profile
      console.log("[AuthCallback] checking profile for user:", session.user.id);
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      console.log("[AuthCallback] profile exists:", !!profile, "error:", profileError?.message);
      const dest = profile ? "/" : "/onboarding";
      console.log("[AuthCallback] navigating to:", dest);
      navigate(dest, { replace: true });
    } catch (err) {
      console.error("[AuthCallback] Unexpected error:", err);
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
