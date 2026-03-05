import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { rankUsersByCompatibility } from "../lib/matching";
import { useNavigate } from "@solidjs/router";

const VerifiedBadge = () => (
  <div class="verified-badge">
    <svg viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l.7-.7L4.5 7.1l4.8-4.8.7.7z" /></svg>
  </div>
);

const Home: Component = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [people, setPeople] = createSignal<
    Array<UserProfile & { compatibilityScore: number }>
  >([]);
  const [sentWaves, setSentWaves] = createSignal<Set<string>>(new Set());
  const [receivedWaves, setReceivedWaves] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);

  onMount(async () => {
    const myProfile = profile();
    if (!myProfile) return;
    const myId = myProfile.id;

    const [usersRes, sentRes, receivedRes] = await Promise.all([
      supabase.from("users").select("*").neq("id", myId),
      supabase.from("waves").select("target_id").eq("user_id", myId),
      supabase.from("waves").select("user_id").eq("target_id", myId),
    ]);

    if (usersRes.data) {
      const ranked = rankUsersByCompatibility(
        myProfile,
        usersRes.data as UserProfile[]
      );
      setPeople(ranked);
    }

    if (sentRes.data) {
      setSentWaves(new Set(sentRes.data.map((w) => w.target_id)));
    }

    if (receivedRes.data) {
      setReceivedWaves(new Set(receivedRes.data.map((w) => w.user_id)));
    }

    setLoading(false);
  });

  const isMatched = (personId: string) =>
    sentWaves().has(personId) && receivedWaves().has(personId);

  const hasSentWave = (personId: string) => sentWaves().has(personId);

  const wave = async (personId: string) => {
    const myProfile = profile();
    if (!myProfile) return;

    // Optimistic UI update
    setSentWaves((prev) => new Set(prev).add(personId));

    await supabase.from("waves").insert({
      user_id: myProfile.id,
      target_id: personId,
    });
  };

  const handleWaveClick = (personId: string) => {
    if (isMatched(personId)) {
      navigate(`/chat?with=${personId}`);
    } else if (!hasSentWave(personId)) {
      wave(personId);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getButtonLabel = (personId: string) => {
    if (isMatched(personId)) return "Matched";
    if (hasSentWave(personId)) return "Waved ✓";
    return "Wave";
  };

  return (
    <>
      <div class="nav-header">
        <div>
          <h1>Discover</h1>
          <div class="neighborhood-tag">
            {profile()?.location ?? "Nearby"} · {people().length} people nearby
          </div>
        </div>
        <div class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
      </div>

      <Show when={!loading()} fallback={
        <div style="display:flex;justify-content:center;padding:3rem">
          <div class="loading-spinner" />
        </div>
      }>
        <Show when={people().length > 0} fallback={
          <div style="text-align:center;padding:3rem;color:var(--text-secondary)">
            No one nearby yet
          </div>
        }>
          <div>
            <For each={people()}>
              {(person) => (
                <div class="discover-card">
                  <div class={`discover-avatar${isMatched(person.id) ? " avatar-photo" : ""}`}>
                    {getInitials(person.name)}
                    <Show when={person.verified}>
                      <VerifiedBadge />
                    </Show>
                  </div>
                  <div class="discover-info">
                    <div class="discover-name">{person.name}</div>
                    <div class="discover-location">{person.location ?? "Nearby"}</div>
                    <div class="discover-bio">{person.bio}</div>
                    <div class="discover-bottom">
                      <div class="discover-tags">
                        <For each={person.interests.slice(0, 3)}>
                          {(tag) => <span class="interest-tag">{tag}</span>}
                        </For>
                      </div>
                      <button
                        class="wave-btn"
                        onClick={() => handleWaveClick(person.id)}
                        style={
                          isMatched(person.id) || hasSentWave(person.id)
                            ? "color: var(--text-secondary)"
                            : ""
                        }
                      >
                        {getButtonLabel(person.id)}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </>
  );
};

export default Home;
