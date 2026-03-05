import { type Component, createEffect, createSignal } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";

const Landing: Component = () => {
  const { session, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [isSignUp, setIsSignUp] = createSignal(false);
  const [error, setError] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const [confirmationSent, setConfirmationSent] = createSignal(false);

  createEffect(() => {
    if (loading()) return;
    if (session() && profile()) {
      navigate("/", { replace: true });
    } else if (session() && !profile()) {
      navigate("/onboarding", { replace: true });
    }
  });

  const handleEmailSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = isSignUp()
      ? await signUpWithEmail(email(), password())
      : await signInWithEmail(email(), password());

    if (result.error) {
      setError(result.error);
    } else if (isSignUp()) {
      setConfirmationSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div class="landing">
      <div class="landing-content">
        <div class="landing-top">
          <div class="landing-icon-wrap">
            <img src="/icon.png" alt="Friendly" class="landing-icon" />
          </div>
          <h1 class="landing-title">Friendly</h1>
          <p class="landing-tagline">
            Meet your neighbors.<br />Make real friends.
          </p>
        </div>

        <div class="landing-bottom">
          <button class="landing-cta" onClick={signInWithGoogle}>
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="rgba(255,255,255,0.9)"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="rgba(255,255,255,0.9)"
              />
            </svg>
            Continue with Google
          </button>

          <div class="landing-divider">
            <span>or</span>
          </div>

          {confirmationSent() ? (
            <div class="landing-confirmation">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="rgba(0,122,255,0.15)" />
                <path d="M15 24.5L21 30.5L33 18.5" stroke="#007AFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <p class="landing-confirmation-title">Check your email</p>
              <p class="landing-confirmation-text">
                We sent a confirmation link to <strong>{email()}</strong>. Tap the link to activate your account.
              </p>
              <button class="landing-toggle" onClick={() => { setConfirmationSent(false); setIsSignUp(false); setError(""); }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form class="landing-email-form" onSubmit={handleEmailSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  class="landing-input"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  class="landing-input"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  required
                  minLength={6}
                />
                {error() && <p class="landing-error">{error()}</p>}
                <button type="submit" class="landing-cta landing-cta-email" disabled={submitting()}>
                  {submitting() ? "..." : isSignUp() ? "Create Account" : "Sign In"}
                </button>
              </form>

              <button class="landing-toggle" onClick={() => { setIsSignUp(!isSignUp()); setError(""); }}>
                {isSignUp() ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </>
          )}

          <p class="landing-terms">
            By continuing, you agree to our{" "}
            <A href="/terms" class="landing-link">Terms of Service</A> and{" "}
            <A href="/privacy" class="landing-link">Privacy Policy</A>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
