import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import type { UserProfile as UserProfileType } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import { blockedIds, setBlockedIds } from "../lib/blocked";
import { myCoords, distanceMiles, formatDistance } from "../lib/geolocation";

const REPORT_REASONS = ["Spam", "Inappropriate content", "Harassment", "Other"];

const WaveIcon = () => (
  <img src="/wave-hand.png" alt="wave" class="wave-btn-icon" />
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

  // Block & Report state
  const [showMenu, setShowMenu] = createSignal(false);
  const [showReportSheet, setShowReportSheet] = createSignal(false);
  const [reportReason, setReportReason] = createSignal("");
  const [reportDescription, setReportDescription] = createSignal("");
  const [submittingReport, setSubmittingReport] = createSignal(false);

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
    if (hasSentWave()) {
      navigate(`/chat?with=${params.id}`);
    } else {
      wave();
    }
  };

  const blockUser = async () => {
    const me = myProfile();
    if (!me) return;

    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.add(params.id);
      return next;
    });
    setShowMenu(false);

    const { error } = await supabase.from("blocks").insert({
      user_id: me.id,
      blocked_user_id: params.id,
    });

    if (error) {
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(params.id);
        return next;
      });
      showToast("Failed to block user");
      return;
    }

    showToast("User blocked", "success");
    navigate(-1 as any);
  };

  const submitReport = async () => {
    const me = myProfile();
    if (!me || !reportReason()) return;

    setSubmittingReport(true);

    const { error } = await supabase.from("reports").insert({
      reporter_id: me.id,
      reported_user_id: params.id,
      reason: reportReason(),
      description: reportDescription() || null,
    });

    setSubmittingReport(false);

    if (error) {
      showToast("Failed to submit report");
      return;
    }

    showToast("Report submitted. Thanks for keeping Friendly safe.", "success");
    setShowReportSheet(false);
    setReportReason("");
    setReportDescription("");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header with back button + menu */}
      <div class="convo-header">
        <button class="convo-back" onClick={() => navigate(-1 as any)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <span class="convo-name">Profile</span>
        <div style="flex:1" />
        <button class="profile-menu-btn" onClick={() => setShowMenu(true)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
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
                  <Show when={(p() as any).gender}>
                    <div class="profile-gender">{(p() as any).gender}</div>
                  </Show>
                  <Show when={p().location}>
                    <div class="profile-location">{p().location}</div>
                  </Show>
                  <Show when={myCoords() && (p() as any).latitude && (p() as any).longitude}>
                    <div class="profile-distance">
                      {formatDistance(
                        distanceMiles(
                          myCoords()!.latitude, myCoords()!.longitude,
                          (p() as any).latitude, (p() as any).longitude
                        )
                      )} away
                    </div>
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

                {/* Wave / Message button */}
                <button
                  class={`user-profile-wave-btn${hasSentWave() ? " messaged" : ""}`}
                  onClick={handleWaveClick}
                  disabled={waving()}
                >
                  <Show when={!hasSentWave()}>
                    <WaveIcon />
                  </Show>
                  <Show when={hasSentWave()}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                  </Show>
                  {hasSentWave() ? "Message" : "Wave"}
                </button>
              </div>
            )}
          </Show>
        </Show>
      </Show>

      {/* Action Menu Sheet */}
      <Show when={showMenu()}>
        <div class="modal-overlay" onClick={() => setShowMenu(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div
              class="action-sheet-option"
              onClick={() => { setShowMenu(false); setShowReportSheet(true); }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
              </svg>
              Report
            </div>
            <div class="action-sheet-option danger" onClick={blockUser}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 014 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0120 12c0 4.42-3.58 8-8 8z" />
              </svg>
              Block
            </div>
          </div>
        </div>
      </Show>

      {/* Report Sheet */}
      <Show when={showReportSheet()}>
        <div class="modal-overlay" onClick={() => setShowReportSheet(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Report User</h2>
            <p style="font-size:14px;color:var(--text-secondary);margin-bottom:14px">
              Why are you reporting this person?
            </p>
            <div class="report-reasons">
              <For each={REPORT_REASONS}>
                {(reason) => (
                  <button
                    class={`report-reason-chip${reportReason() === reason ? " selected" : ""}`}
                    onClick={() => setReportReason(reason)}
                  >
                    {reason}
                  </button>
                )}
              </For>
            </div>
            <div class="sheet-field">
              <label>Details (optional)</label>
              <textarea
                placeholder="Tell us more..."
                value={reportDescription()}
                onInput={(e) => setReportDescription(e.currentTarget.value)}
                rows={3}
              />
            </div>
            <div class="sheet-actions">
              <button
                class="sheet-btn sheet-btn-cancel"
                onClick={() => setShowReportSheet(false)}
              >
                Cancel
              </button>
              <button
                class="sheet-btn sheet-btn-submit"
                onClick={submitReport}
                disabled={!reportReason() || submittingReport()}
              >
                {submittingReport() ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

export default UserProfilePage;
