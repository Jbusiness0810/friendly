import { type ParentComponent, Show, For, createEffect, onMount } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { toasts } from "./lib/toast";
import { hasUnread } from "./lib/unread";
import { hasNewWaves } from "./lib/waves-unread";
import { setBlockedIds } from "./lib/blocked";

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

  // Fetch blocked users on mount
  onMount(async () => {
    const p = profile();
    if (!p) return;
    const { data } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("user_id", p.id);
    if (data) {
      setBlockedIds(new Set(data.map((b: any) => b.blocked_user_id)));
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
        <A href="/waves" class="tab-chat-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M23 17v2H1v-2h22zM12.84 7.55c-.62-.62-1.62-.62-2.24 0L8.48 9.67l1.41 1.41 2.12-2.12 5.66 5.66 1.41-1.41-6.24-5.66zM8.48 5.44l1.42-1.42c.62-.62.62-1.62 0-2.24a1.58 1.58 0 00-2.24 0L5.55 3.9 3.43 1.78 2.02 3.19l2.12 2.12L2.02 7.43 3.43 8.84l2.12-2.12L7.67 8.84 9.08 7.43 6.96 5.31z" />
          </svg>
          <Show when={hasNewWaves()}>
            <div class="tab-unread-dot" />
          </Show>
          Waves
        </A>
        <A href="/chat" class="tab-chat-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
          <Show when={hasUnread()}>
            <div class="tab-unread-dot" />
          </Show>
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
