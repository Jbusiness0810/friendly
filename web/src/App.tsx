import { type ParentComponent, Show, For, createEffect, onMount } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabase";
import { toasts } from "./lib/toast";
import { hasUnread } from "./lib/unread";
import { hasNewWaves } from "./lib/waves-unread";
import { setBlockedIds } from "./lib/blocked";
import { initNativePlugins } from "./lib/capacitor";
import { requestGeolocation, saveCoordinates, setMyCoords } from "./lib/geolocation";
import { initPushNotifications } from "./lib/push-notifications";

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

  // Initialize native plugins (Capacitor) + fetch blocked users
  onMount(() => { initNativePlugins(); });

  onMount(async () => {
    const p = profile();
    if (!p) return;

    // Fetch blocked users
    const { data } = await supabase
      .from("blocks")
      .select("blocked_user_id")
      .eq("user_id", p.id);
    if (data) {
      setBlockedIds(new Set(data.map((b: any) => b.blocked_user_id)));
    }

    // Load cached coordinates from profile, then request fresh ones
    if (p.latitude && p.longitude) {
      setMyCoords({ latitude: p.latitude, longitude: p.longitude });
    }
    requestGeolocation().then((coords) => {
      if (coords) saveCoordinates(p.id, coords);
    });

    // Initialize push notifications
    initPushNotifications(p.id);
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

      {/* Tab Bar */}
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
        <A href="/circles">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          Circles
        </A>
        <A href="/waves" class="tab-chat-wrap">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a.996.996 0 00-1.41 0L1.29 18.96a.996.996 0 000 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a.996.996 0 000-1.41l-2.33-2.35z" />
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
