import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import type { UserProfile as UserProfileType } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";

const WaveIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
    <path d="M9 16.5V8.5C9 7.67 9.67 7 10.5 7S12 7.67 12 8.5V15h1V5.5C13 4.67 13.67 4 14.5 4S16 4.67 16 5.5V15h1V6.5C17 5.67 17.67 5 18.5 5S20 5.67 20 6.5V15h1V9.5C21 8.67 21.67 8 22.5 8S24 8.67 24 9.5V21c0 4.42-3.58 8-8 8s-8-3.58-8-8v-1.5C8 18.12 8.67 17.5 9 16.5z" />
  </svg>
);

const UserProfilePage: Component = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile: myProfile } = useAuth();

  const [person, setPerson] = createSignal<UserProfileType | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [notFound, setNotFound] = createSignal(false);
  const [hasSentWave, setHasSentWave] = createSignal(false);
  const [hasReceivedWave, setHasReceivedWave] = createSignal(false);
  const [waving, setWaving] = createSignal(false);

  const isMatched = () => hasSentWave() && hasReceivedWave();

  onMount(async () => {
    const targetId = params.id;
    const me = myProfile();

    if (me && targetId === me.id) {
      navigate("/profile", { replace: true });
      return;
    }

    try {
      const [userRes, sentRes, receivedRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", targetId).maybeSingle(),
        me
          ? supabase.from("waves").select("id").eq("user_id", me.id).eq("target_id", targetId).maybeSingle()
          : Promise.resolve({ data: null }),
        me
          ? supabase.from("waves").select("id").eq("user_id", targetId).eq("target_id", me.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (!userRes.data) {
        setNotFound(true);
      } else {
        setPerson(userRes.data as UserProfileType);
        setHasSentWave(!!sentRes.data);
        setHasReceivedWave(!!receivedRes.data);
      }
    } catch {
      showToast("Failed to load profile");
    }

    setLoading(false);
  });

  const wave = async () => {
    const me = myProfile();
    if (!me) return;

    setWaving(true);
    setHasSentWave(true);

    const { error } = await supabase.from("waves").insert({
      user_id: me.id,
      target_id: params.id,
    });

    if (error) {
      setHasSentWave(false);
      showToast("Failed to send wave");
    }
    setWaving(false);
  };

  const handleWaveClick = () => {
    if (isMatched()) {
      navigate(`/chat?with=${params.id}`);
    } else if (!hasSentWave()) {
      wave();
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header with back button */}
      <div class="convo-header">
        <button class="convo-back" onClick={() => navigate(-1 as any)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <span class="convo-name">Profile</span>
      </div>

      <Show when={!loading()} fallback={
        <div style="display:flex;justify-content:center;padding:3rem">
          <div class="loading-spinner" />
        </div>
      }>
        <Show when={!notFound()} fallback={
          <div class="empty-state">
            This person doesn't seem to exist.
          </div>
        }>
          <Show when={person()}>
            {(p) => (
              <div class="content" style="padding-bottom:100px">
                <div class="profile-header">
                  <div class={`profile-avatar${p().avatar_url ? " avatar-photo" : ""}`}>
                    <Show when={p().avatar_url} fallback={getInitials(p().name)}>
                      <img src={p().avatar_url!} alt={p().name} />
                    </Show>
                  </div>
                  <Show when={p().verified}>
                    <div class="profile-verified">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      Verified
                    </div>
                  </Show>
                  <div class="profile-name">{p().name}</div>
                  <Show when={p().bio}>
                    <div class="profile-bio">{p().bio}</div>
                  </Show>
                  <Show when={p().fun_fact}>
                    <div class="profile-bio" style="font-style:italic;margin-top:4px">
                      "{p().fun_fact}"
                    </div>
                  </Show>
                  <Show when={p().location}>
                    <div class="profile-location">{p().location}</div>
                  </Show>
                </div>

                <Show when={p().interests && p().interests.length > 0}>
                  <div class="section-header" style="padding:0 20px">
                    <h2>Interests</h2>
                  </div>
                  <div class="interest-tags" style="padding:0 20px;margin-bottom:20px">
                    <For each={p().interests}>
                      {(tag) => <span class="interest-tag">{tag}</span>}
                    </For>
                  </div>
                </Show>

                <Show when={p().ideal_hangouts && p().ideal_hangouts.length > 0}>
                  <div class="section-header" style="padding:0 20px">
                    <h2>Ideal Hangouts</h2>
                  </div>
                  <div class="interest-tags" style="padding:0 20px;margin-bottom:20px">
                    <For each={p().ideal_hangouts}>
                      {(tag) => <span class="interest-tag">{tag}</span>}
                    </For>
                  </div>
                </Show>

                <Show when={p().social_style}>
                  <div class="section-header" style="padding:0 20px">
                    <h2>Social Style</h2>
                  </div>
                  <div class="interest-tags" style="padding:0 20px;margin-bottom:20px">
                    <span class="interest-tag">{p().social_style}</span>
                  </div>
                </Show>

                <Show when={p().intent && p().intent.length > 0}>
                  <div class="section-header" style="padding:0 20px">
                    <h2>Looking For</h2>
                  </div>
                  <div class="interest-tags" style="padding:0 20px;margin-bottom:20px">
                    <For each={p().intent}>
                      {(tag) => <span class="interest-tag">{tag}</span>}
                    </For>
                  </div>
                </Show>

                <Show when={p().political_alignment && p().political_alignment !== "Rather not say"}>
                  <div class="section-header" style="padding:0 20px">
                    <h2>Political Views</h2>
                  </div>
                  <div class="interest-tags" style="padding:0 20px;margin-bottom:20px">
                    <span class="interest-tag">{p().political_alignment}</span>
                  </div>
                </Show>

                {/* Wave / Match button */}
                <button
                  class={`user-profile-wave-btn${isMatched() ? " matched" : hasSentWave() ? " waved" : ""}`}
                  onClick={handleWaveClick}
                  disabled={waving() || (hasSentWave() && !isMatched())}
                >
                  <Show when={!hasSentWave() && !isMatched()}>
                    <WaveIcon />
                  </Show>
                  {isMatched() ? "Matched — Message" : hasSentWave() ? "Waved ✓" : "Wave"}
                </button>
              </div>
            )}
          </Show>
        </Show>
      </Show>
    </>
  );
};

export default UserProfilePage;
