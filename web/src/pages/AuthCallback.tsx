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

      console.log("[AuthCallback] URL:", window.location.href);

      // Supabase returns ?error= when the server-side exchange fails
      if (error) {
        console.error("[AuthCallback] OAuth error:", error, errorDescription);
        navigate("/landing", { replace: true });
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log("[AuthCallback] exchange result:", { user: data?.user?.id, error: error?.message });

        if (error) {
          console.error("[AuthCallback] Code exchange failed:", error.message);
          navigate("/landing", { replace: true });
          return;
        }
      }

      // Verify session is now set
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("[AuthCallback] session after exchange:", !!session);

      if (!session) {
        console.error("[AuthCallback] No session — redirecting to landing");
        navigate("/landing", { replace: true });
        return;
      }

      // Check if user has a profile
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      console.log("[AuthCallback] profile exists:", !!profile);
      navigate(profile ? "/" : "/onboarding", { replace: true });
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
