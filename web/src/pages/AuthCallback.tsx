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
    // Check query params (PKCE flow) and hash fragment (implicit flow / Apple)
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const code = params.get("code");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    console.log("[Auth] Callback URL:", window.location.href);
    console.log("[Auth] code:", code, "access_token:", !!accessToken);

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[Auth] Code exchange failed:", error.message);
        navigate("/landing", { replace: true });
        return;
      }
    } else if (accessToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      });
      if (error) {
        console.error("[Auth] Token session failed:", error.message);
        navigate("/landing", { replace: true });
        return;
      }
    }

    // Session is now set — check if user has a profile
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[Auth] No session after callback — redirecting to landing");
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
