import { type ParentComponent, Show, For, createEffect } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "./context/AuthContext";
import { toasts } from "./lib/toast";

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
      {/* Toast Notifications */}
      <For each={toasts()}>
        {(toast) => (
          <div class={`toast toast-${toast.type}`}>{toast.message}</div>
        )}
      </For>

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
