import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { rankUsersByCompatibility } from "../lib/matching";
import { useNavigate } from "@solidjs/router";
import { showToast } from "../lib/toast";
import { blockedIds } from "../lib/blocked";
import { myCoords, distanceMiles, formatDistance } from "../lib/geolocation";

const INTEREST_OPTIONS = [
  "Lifting", "Running", "Cooking", "Gaming", "Music", "Hiking",
  "Coffee", "Basketball", "Golf", "Outdoors", "Fishing", "Cars",
];

const WaveIcon = () => (
  <img src="/wave-hand.png" alt="wave" class="wave-btn-icon" />
);

const MessageIcon = () => (
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
  const [loading, setLoading] = createSignal(true);
  const [totalCount, setTotalCount] = createSignal(0);
  const [loadingMore, setLoadingMore] = createSignal(false);
  const [allUsers, setAllUsers] = createSignal<
    Array<UserProfile & { compatibilityScore: number }>
  >([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedInterests, setSelectedInterests] = createSignal<Set<string>>(new Set());

  onMount(async () => {
    const myProfile = profile();
    if (!myProfile) return;
    const myId = myProfile.id;

    try {
      const [usersRes, sentRes] = await Promise.all([
        supabase.from("users").select("*", { count: "exact" }).neq("id", myId),
        supabase.from("waves").select("target_id").eq("user_id", myId),
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

  const hasSentWave = (personId: string) => sentWaves().has(personId);

  // Derived: gender → block filter → search → interest filter
  const filteredPeople = () => {
    const blocked = blockedIds();
    let result = people().filter((p) => !blocked.has(p.id));

    // Gender-based matching: men see men, women see women, others see everyone
    const myGender = profile()?.gender;
    if (myGender === "Man") {
      result = result.filter((p) => (p as any).gender !== "Woman");
    } else if (myGender === "Woman") {
      result = result.filter((p) => (p as any).gender !== "Man");
    }

    const q = searchQuery().toLowerCase().trim();
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    const interests = selectedInterests();
    if (interests.size > 0) {
      result = result.filter((p) =>
        p.interests.some((i) => interests.has(i))
      );
    }

    return result;
  };

  const isFiltering = () => searchQuery() !== "" || selectedInterests().size > 0;

  const MAX_WAVES_PER_DAY = 25;

  const getWavesToday = (): number => {
    try {
      const stored = localStorage.getItem("friendly-waves-today");
      if (!stored) return 0;
      const { count, date } = JSON.parse(stored);
      if (date !== new Date().toISOString().split("T")[0]) return 0;
      return count;
    } catch { return 0; }
  };

  const incrementWavesToday = () => {
    const today = new Date().toISOString().split("T")[0];
    const current = getWavesToday();
    localStorage.setItem("friendly-waves-today", JSON.stringify({ count: current + 1, date: today }));
  };

  const wave = async (personId: string) => {
    const myProfile = profile();
    if (!myProfile) return;

    if (getWavesToday() >= MAX_WAVES_PER_DAY) {
      showToast("You've reached the daily wave limit. Try again tomorrow!");
      return;
    }

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
    } else {
      incrementWavesToday();
    }
  };

  const handleWaveClick = (personId: string) => {
    if (hasSentWave(personId)) {
      navigate(`/chat?with=${personId}`);
    } else {
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

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) next.delete(interest);
      else next.add(interest);
      return next;
    });
  };

  return (
    <>
      <div class="nav-header">
        <div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="nav-logo"><img src="/icon.png" alt="Friendly" /></div>
            <h1>Discover</h1>
          </div>
          <div class="neighborhood-tag">
            {profile()?.location ?? "Nearby"} · {filteredPeople().length} people
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div class="search-bar-sticky">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="flex-shrink:0;color:var(--text-secondary)">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            class="search-input"
          />
          <Show when={searchQuery()}>
            <button class="search-clear" onClick={() => setSearchQuery("")}>&times;</button>
          </Show>
        </div>

        <div class="filter-pills-scroll">
          <For each={INTEREST_OPTIONS}>
            {(interest) => (
              <button
                class={`filter-pill${selectedInterests().has(interest) ? " filter-pill-active" : ""}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            )}
          </For>
        </div>

        <Show when={isFiltering()}>
          <div class="filter-status">
            <span>{filteredPeople().length} result{filteredPeople().length !== 1 ? "s" : ""}</span>
            <button
              class="filter-clear-all"
              onClick={() => { setSearchQuery(""); setSelectedInterests(new Set()); }}
            >
              Clear all
            </button>
          </div>
        </Show>
      </div>

      <Show when={!loading()} fallback={
        <div style="display:flex;justify-content:center;padding:3rem">
          <div class="loading-spinner" />
        </div>
      }>
        <Show when={filteredPeople().length > 0} fallback={
          <div class="empty-state-rich">
            <Show when={isFiltering()} fallback={
              <>
                <div class="empty-state-icon">
                  <img src="/wave-hand.png" alt="" style="width:48px;height:48px" />
                </div>
                <div class="empty-state-title">No one nearby yet</div>
                <div class="empty-state-sub">Be the first in your area! Share Friendly with friends to get started.</div>
              </>
            }>
              <div class="empty-state-title">No one matches your filters</div>
              <div class="empty-state-sub">Try adjusting your search or clearing filters.</div>
            </Show>
          </div>
        }>
          <div class="discover-feed">
            <For each={filteredPeople()}>
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
                      class={`wave-btn${hasSentWave(person.id) ? " wave-btn-messaged" : ""}`}
                      onClick={(e) => { e.stopPropagation(); handleWaveClick(person.id); }}
                    >
                      <Show when={hasSentWave(person.id)}>
                        <MessageIcon />
                      </Show>
                      <Show when={!hasSentWave(person.id)}>
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

                    <Show when={person.gender && person.gender !== "Prefer not to say"}>
                      <div class="discover-gender">{person.gender}</div>
                    </Show>

                    <div class="discover-location">
                      {person.location ?? "Nearby"}
                      <Show when={myCoords() && person.latitude && person.longitude}>
                        {" · "}
                        {formatDistance(
                          distanceMiles(
                            myCoords()!.latitude, myCoords()!.longitude,
                            person.latitude!, person.longitude!
                          )
                        )}
                      </Show>
                    </div>

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
            <Show when={hasMore() && !isFiltering()}>
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
