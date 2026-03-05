import { type ParentComponent, Show, createEffect } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "./context/AuthContext";

const App: ParentComponent = (props) => {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  // Auth guard: redirect unauthenticated or un-onboarded users
  createEffect(() => {
    if (loading()) return;
    if (!session()) {
      navigate("/landing", { replace: true });
    } else if (!profile()) {
      navigate("/onboarding", { replace: true });
    }
  });

  return (
    <Show
      when={!loading() && session() && profile()}
      fallback={
        <div class="loading-screen">
          <div class="loading-spinner" />
        </div>
      }
    >
      {/* Status Bar */}
      <div class="status-bar">
        <span class="status-time">9:41</span>
        <div class="status-icons">
          <svg width="17" height="12" viewBox="0 0 17 12">
            <rect x="0" y="9" width="3" height="3" rx="0.5" fill="currentColor" />
            <rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="currentColor" />
            <rect x="9" y="3" width="3" height="9" rx="0.5" fill="currentColor" />
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="currentColor" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12">
            <path d="M8 10a1.2 1.2 0 110 2.4A1.2 1.2 0 018 10zm0-3.5c1.8 0 3.4.73 4.6 1.9l-1.2 1.3C10.5 8.8 9.3 8.3 8 8.3s-2.5.5-3.4 1.4L3.4 8.4C4.6 7.23 6.2 6.5 8 6.5zm0-3.5c2.7 0 5.2 1.1 7 3l-1.2 1.3C12.2 5.7 10.2 4.8 8 4.8S3.8 5.7 2.2 7.3L1 6C2.8 4.1 5.3 3 8 3z" fill="currentColor" />
          </svg>
          <svg width="27" height="12" viewBox="0 0 27 12">
            <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" stroke-width="1" fill="none" />
            <rect x="1.5" y="2" width="17.5" height="8" rx="1.5" fill="currentColor" />
            <path d="M24 4v4a2.2 2.2 0 000-4z" fill="currentColor" opacity="0.35" />
          </svg>
        </div>
      </div>

      {/* Page Content */}
      <div class="page-wrapper">
        {props.children}
      </div>

      {/* Tab Bar — 4 tabs: Home, Events, Chat, Profile */}
      <div class="tab-bar">
        <A href="/" end>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          Home
        </A>
        <A href="/events">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
          </svg>
          Events
        </A>
        <A href="/chat">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
          Chat
        </A>
        <A href="/profile">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Profile
        </A>
      </div>
    </Show>
  );
};

export default App;
