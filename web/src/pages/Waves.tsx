import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import { blockedIds } from "../lib/blocked";
import { setHasNewWaves } from "../lib/waves-unread";

interface WaveWithUser {
  waveId: string;
  userId: string;
  createdAt: string;
  user: UserProfile;
}

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
};

const Waves: Component = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [incomingWaves, setIncomingWaves] = createSignal<WaveWithUser[]>([]);
  const [sentWaveTargets, setSentWaveTargets] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [wavingBack, setWavingBack] = createSignal<Set<string>>(new Set());

  const newWaves = () =>
    incomingWaves().filter((w) => !sentWaveTargets().has(w.userId));
  const matchedWaves = () =>
    incomingWaves().filter((w) => sentWaveTargets().has(w.userId));

  onMount(async () => {
    const me = profile();
    if (!me) return;

    // Mark waves as seen
    try {
      localStorage.setItem("friendly-waves-last-seen", new Date().toISOString());
    } catch { /* ignore */ }
    setHasNewWaves(false);

    try {
      const [incomingRes, sentRes] = await Promise.all([
        supabase
          .from("waves")
          .select("id, user_id, created_at")
          .eq("target_id", me.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("waves")
          .select("target_id")
          .eq("user_id", me.id),
      ]);

      if (sentRes.data) {
        setSentWaveTargets(new Set(sentRes.data.map((w: any) => w.target_id)));
      }

      if (incomingRes.data && incomingRes.data.length > 0) {
        const blocked = blockedIds();
        const senderIds = incomingRes.data
          .map((w: any) => w.user_id)
          .filter((id: string) => !blocked.has(id));

        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from("users")
            .select("*")
            .in("id", senderIds);

          const profileMap = new Map<string, UserProfile>();
          (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p as UserProfile));

          const waves: WaveWithUser[] = incomingRes.data
            .filter((w: any) => profileMap.has(w.user_id))
            .map((w: any) => ({
              waveId: w.id,
              userId: w.user_id,
              createdAt: w.created_at,
              user: profileMap.get(w.user_id)!,
            }));

          setIncomingWaves(waves);
        }
      }
    } catch {
      showToast("Failed to load waves");
    }

    setLoading(false);
  });

  const waveBack = async (userId: string) => {
    const me = profile();
    if (!me) return;

    setWavingBack((prev) => new Set(prev).add(userId));
    setSentWaveTargets((prev) => new Set(prev).add(userId));

    const { error } = await supabase.from("waves").insert({
      user_id: me.id,
      target_id: userId,
    });

    if (error) {
      setSentWaveTargets((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      showToast("Failed to wave back");
    }
    setWavingBack((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div class="nav-header">
        <div style="display:flex;align-items:center;gap:10px">
          <img src="/icon.png" class="nav-logo" alt="Friendly" />
          <h1>Waves</h1>
        </div>
      </div>

      <Show when={!loading()} fallback={
        <div style="display:flex;justify-content:center;padding:3rem">
          <div class="loading-spinner" />
        </div>
      }>
        <Show when={incomingWaves().length > 0} fallback={
          <div class="empty-state">
            No waves yet. People who wave at you will show up here.
          </div>
        }>
          <div class="waves-page">
            <Show when={newWaves().length > 0}>
              <div class="waves-section-header">New Waves</div>
              <For each={newWaves()}>
                {(item) => (
                  <div class="wave-card" onClick={() => navigate(`/user/${item.userId}`)}>
                    <div class={`wave-avatar${item.user.avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={item.user.avatar_url} fallback={getInitials(item.user.name)}>
                        <img src={item.user.avatar_url!} alt={item.user.name} />
                      </Show>
                    </div>
                    <div class="wave-info">
                      <div class="wave-name">{item.user.name}</div>
                      <div class="wave-location">{item.user.location ?? "Nearby"}</div>
                    </div>
                    <div class="wave-time">{formatTimeAgo(item.createdAt)}</div>
                    <button
                      class="wave-action-btn wave-action-wave"
                      onClick={(e) => { e.stopPropagation(); waveBack(item.userId); }}
                      disabled={wavingBack().has(item.userId)}
                    >
                      Wave Back
                    </button>
                  </div>
                )}
              </For>
            </Show>

            <Show when={matchedWaves().length > 0}>
              <div class="waves-section-header">Matched</div>
              <For each={matchedWaves()}>
                {(item) => (
                  <div class="wave-card" onClick={() => navigate(`/user/${item.userId}`)}>
                    <div class={`wave-avatar${item.user.avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={item.user.avatar_url} fallback={getInitials(item.user.name)}>
                        <img src={item.user.avatar_url!} alt={item.user.name} />
                      </Show>
                    </div>
                    <div class="wave-info">
                      <div class="wave-name">{item.user.name}</div>
                      <div class="wave-location">{item.user.location ?? "Nearby"}</div>
                    </div>
                    <button
                      class="wave-action-btn wave-action-message"
                      onClick={(e) => { e.stopPropagation(); navigate(`/chat?with=${item.userId}`); }}
                    >
                      Message
                    </button>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </Show>
      </Show>
    </>
  );
};

export default Waves;
