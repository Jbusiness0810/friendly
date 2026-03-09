import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { rankUsersByCompatibility } from "../lib/matching";
import { useNavigate } from "@solidjs/router";
import { showToast } from "../lib/toast";

const WaveIcon = () => (
  <img src="/icon.png" alt="wave" width="26" height="26" style="border-radius:4px;flex-shrink:0" />
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="color:var(--text-secondary)">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
  </svg>
);

const Home: Component = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const PAGE_SIZE = 50;

  const [people, setPeople] = createSignal<
    Array<UserProfile & { compatibilityScore: number }>
  >([]);
  const [sentWaves, setSentWaves] = createSignal<Set<string>>(new Set());
  const [receivedWaves, setReceivedWaves] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [totalCount, setTotalCount] = createSignal(0);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [allUsers, setAllUsers] = createSignal<
    Array<UserProfile & { compatibilityScore: number }>
  >([]);

  onMount(async () => {
    const myProfile = profile();
    if (!myProfile) return;
    const myId = myProfile.id;

    try {
      const [usersRes, sentRes, receivedRes] = await Promise.all([
        supabase.from("users").select("*", { count: "exact" }).neq("id", myId),
        supabase.from("waves").select("target_id").eq("user_id", myId),
        supabase.from("waves").select("user_id").eq("target_id", myId),
      ]);

      if (usersRes.error) throw usersRes.error;

      if (usersRes.data) {
        const ranked = rankUsersByCompatibility(
          myProfile,
          usersRes.data as UserProfile[]
        );
        setAllUsers(ranked);
        setTotalCount(ranked.length);
        setPeople(ranked.slice(0, PAGE_SIZE));
      }

      if (sentRes.data) {
        setSentWaves(new Set(sentRes.data.map((w) => w.target_id)));
      }

      if (receivedRes.data) {
        setReceivedWaves(new Set(receivedRes.data.map((w) => w.user_id)));
      }
    } catch {
      showToast("Failed to load people nearby");
    }

    setLoading(false);
  });

  const loadMore = () => {
    setLoadingMore(true);
    const current = people().length;
    const next = allUsers().slice(0, current + PAGE_SIZE);
    setPeople(next);
    setLoadingMore(false);
  };

  const hasMore = () => people().length < totalCount();

  const isMatched = (personId: string) =>
    sentWaves().has(personId) && receivedWaves().has(personId);

  const hasSentWave = (personId: string) => sentWaves().has(personId);

  const wave = async (personId: string) => {
    const myProfile = profile();
    if (!myProfile) return;

    // Optimistic UI update
    setSentWaves((prev) => new Set(prev).add(personId));

    const { error } = await supabase.from("waves").insert({
      user_id: myProfile.id,
      target_id: personId,
    });

    if (error) {
      setSentWaves((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
      showToast("Failed to send wave");
    }
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

  return (
    <>
      <div class="nav-header">
        <div>
          <h1>Discover</h1>
          <div class="neighborhood-tag">
            {profile()?.location ?? "Nearby"} · {people().length} people nearby
          </div>
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
          <div class="discover-feed">
            <For each={people()}>
              {(person) => (
                <div class="discover-card" onClick={() => navigate(`/user/${person.id}`)}>
                  {/* Hero photo */}
                  <div class={`discover-photo${!person.avatar_url ? " discover-photo-gradient" : ""}`}>
                    <Show when={person.avatar_url} fallback={
                      <span class="discover-photo-initials">{getInitials(person.name)}</span>
                    }>
                      <img src={person.avatar_url!} alt={person.name} loading="lazy" />
                    </Show>
                  </div>

                  {/* Info section */}
                  <div class="discover-info">
                    {/* Floating wave button */}
                    <button
                      class={`wave-btn${isMatched(person.id) ? " wave-btn-matched" : hasSentWave(person.id) ? " wave-btn-waved" : ""}`}
                      onClick={(e) => { e.stopPropagation(); handleWaveClick(person.id); }}
                    >
                      <Show when={isMatched(person.id)}>
                        <ChatIcon />
                      </Show>
                      <Show when={hasSentWave(person.id) && !isMatched(person.id)}>
                        <CheckIcon />
                      </Show>
                      <Show when={!hasSentWave(person.id) && !isMatched(person.id)}>
                        <WaveIcon />
                      </Show>
                    </button>

                    <div class="discover-name-row">
                      <span class="discover-name">{person.name}</span>
                      <Show when={person.verified}>
                        <div class="discover-name-verified">
                          <svg viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l.7-.7L4.5 7.1l4.8-4.8.7.7z" /></svg>
                        </div>
                      </Show>
                    </div>

                    <div class="discover-location">{person.location ?? "Nearby"}</div>

                    <Show when={person.bio}>
                      <div class="discover-bio">{person.bio}</div>
                    </Show>

                    <Show when={person.interests.length > 0}>
                      <div class="discover-bottom">
                        <div class="discover-tags">
                          <For each={person.interests.slice(0, 3)}>
                            {(tag) => <span class="interest-tag">{tag}</span>}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
            <Show when={hasMore()}>
              <div class="load-more-wrap">
                <button
                  class="load-more-btn"
                  onClick={loadMore}
                  disabled={loadingMore()}
                >
                  {loadingMore() ? "Loading..." : `Load more (${totalCount() - people().length} remaining)`}
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </Show>
    </>
  );
};

export default Home;
