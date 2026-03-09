import { createSignal, type Component, Show, For } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";

const INTEREST_OPTIONS = [
  "Lifting", "Running", "Cooking", "Gaming", "Music", "Hiking",
  "Coffee", "Basketball", "Golf", "Outdoors", "Fishing", "Cars",
];

const HANGOUT_OPTIONS = [
  "Coffee", "Gym", "Bar", "Sports", "BBQ", "Game night", "Trail",
];

const STYLE_OPTIONS = ["Spontaneous", "Planner", "Bit of both"];

const INTENT_OPTIONS = [
  "Gym partner", "Grab a drink", "Watch the game",
  "Pickup sports", "Weekend plans", "Networking",
];

const POLITICAL_OPTIONS = [
  "Progressive", "Liberal", "Moderate",
  "Conservative", "Libertarian", "Rather not say",
];

const Profile: Component = () => {
  const { profile, signOut, refreshProfile, updateProfileField } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [editing, setEditing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [showAbout, setShowAbout] = createSignal(false);
  const [uploadingAvatar, setUploadingAvatar] = createSignal(false);

  let fileInputRef: HTMLInputElement | undefined;

  // Edit form state
  const [editName, setEditName] = createSignal("");
  const [editBio, setEditBio] = createSignal("");
  const [editLocation, setEditLocation] = createSignal("");
  const [editFunFact, setEditFunFact] = createSignal("");
  const [editInterests, setEditInterests] = createSignal<string[]>([]);
  const [editHangouts, setEditHangouts] = createSignal<string[]>([]);
  const [editStyle, setEditStyle] = createSignal("");
  const [editIntent, setEditIntent] = createSignal<string[]>([]);
  const [editPolitical, setEditPolitical] = createSignal("");

  const initials = () => {
    const p = profile();
    if (!p || !p.name) return "??";
    return p.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = async (file: File) => {
    const p = profile();
    if (!p) return;

    setUploadingAvatar(true);

    try {
      // Upload to Supabase Storage: avatars/{userId}/avatar.{ext}
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${p.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        showToast("Failed to upload photo");
        setUploadingAvatar(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-buster so browser loads the new image
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();

      // Update user record in database
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", p.id);

      if (updateError) {
        showToast("Failed to update profile photo");
      } else {
        // Update in-memory profile so it reflects everywhere immediately
        updateProfileField({ avatar_url: publicUrl });
        showToast("Photo updated!");
      }
    } catch {
      showToast("Something went wrong");
    }

    setUploadingAvatar(false);
  };

  const onFileSelected = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handleAvatarUpload(file);
    // Reset so the same file can be selected again
    input.value = "";
  };

  const startEditing = () => {
    const p = profile();
    if (!p) return;
    setEditName(p.name ?? "");
    setEditBio(p.bio ?? "");
    setEditLocation(p.location ?? "");
    setEditFunFact(p.fun_fact ?? "");
    setEditInterests([...(p.interests ?? [])]);
    setEditHangouts([...(p.ideal_hangouts ?? [])]);
    setEditStyle(p.social_style ?? "");
    setEditIntent([...(p.intent ?? [])]);
    setEditPolitical(p.political_alignment ?? "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const toggleChip = (
    list: () => string[],
    setList: (v: string[]) => void,
    value: string
  ) => {
    const current = list();
    if (current.includes(value)) {
      setList(current.filter((v2) => v2 !== value));
    } else {
      setList([...current, value]);
    }
  };

  const saveProfile = async () => {
    const p = profile();
    if (!p) return;

    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({
        name: editName().trim(),
        bio: editBio().trim() || null,
        location: editLocation().trim() || null,
        fun_fact: editFunFact().trim() || null,
        interests: editInterests(),
        ideal_hangouts: editHangouts(),
        social_style: editStyle() || null,
        intent: editIntent(),
        political_alignment: editPolitical() || null,
      })
      .eq("id", p.id);

    if (!error) {
      await refreshProfile();
      setEditing(false);
    } else {
      showToast("Failed to save profile");
    }

    setSaving(false);
  };

  return (
    <>
      <div class="nav-header">
        <h1>Profile</h1>
      </div>
      <div class="content">
        <Show when={profile()} fallback={<div>Loading...</div>}>
          {(p) => (
            <Show when={!editing()} fallback={
              /* ==================== EDIT MODE ==================== */
              <>
                {/* Avatar upload */}
                <div class="avatar-upload-section" onClick={() => fileInputRef?.click()}>
                  <div class={`profile-avatar${p().avatar_url ? " avatar-photo" : ""}`}>
                    <Show when={p().avatar_url} fallback={initials()}>
                      <img src={p().avatar_url!} alt={p().name} />
                    </Show>
                  </div>
                  <div class="avatar-upload-overlay">
                    <Show when={uploadingAvatar()} fallback={
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        <path d="M20 15v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3z" opacity="0.8"/>
                      </svg>
                    }>
                      <div class="loading-spinner" style="width:24px;height:24px;border-width:2px" />
                    </Show>
                  </div>
                  <span class="avatar-upload-label">
                    {uploadingAvatar() ? "Uploading..." : "Change Photo"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style="display:none"
                    onChange={onFileSelected}
                  />
                </div>

                <div class="edit-profile-section">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editName()}
                    onInput={(e) => setEditName(e.currentTarget.value)}
                  />
                </div>

                <div class="edit-profile-section">
                  <label>Bio</label>
                  <textarea
                    value={editBio()}
                    onInput={(e) => setEditBio(e.currentTarget.value)}
                    placeholder="Tell people about yourself"
                  />
                </div>

                <div class="edit-profile-section">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editLocation()}
                    onInput={(e) => setEditLocation(e.currentTarget.value)}
                    placeholder="Your neighborhood"
                  />
                </div>

                <div class="edit-profile-section">
                  <label>Fun Fact</label>
                  <input
                    type="text"
                    value={editFunFact()}
                    onInput={(e) => setEditFunFact(e.currentTarget.value)}
                    placeholder="Something interesting about you"
                  />
                </div>

                <div class="edit-profile-section">
                  <label>Interests</label>
                  <div class="edit-chips">
                    <For each={INTEREST_OPTIONS}>
                      {(opt) => (
                        <button
                          class={`onboard-chip${editInterests().includes(opt) ? " selected" : ""}`}
                          onClick={() => toggleChip(editInterests, setEditInterests, opt)}
                        >
                          {opt}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="edit-profile-section">
                  <label>Ideal Hangouts</label>
                  <div class="edit-chips">
                    <For each={HANGOUT_OPTIONS}>
                      {(opt) => (
                        <button
                          class={`onboard-chip${editHangouts().includes(opt) ? " selected" : ""}`}
                          onClick={() => toggleChip(editHangouts, setEditHangouts, opt)}
                        >
                          {opt}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="edit-profile-section">
                  <label>Social Style</label>
                  <div class="edit-chips">
                    <For each={STYLE_OPTIONS}>
                      {(opt) => (
                        <button
                          class={`onboard-chip${editStyle() === opt ? " selected" : ""}`}
                          onClick={() => setEditStyle(opt)}
                        >
                          {opt}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="edit-profile-section">
                  <label>Looking For</label>
                  <div class="edit-chips">
                    <For each={INTENT_OPTIONS}>
                      {(opt) => (
                        <button
                          class={`onboard-chip${editIntent().includes(opt) ? " selected" : ""}`}
                          onClick={() => toggleChip(editIntent, setEditIntent, opt)}
                        >
                          {opt}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="edit-profile-section">
                  <label>Political Views</label>
                  <div class="edit-chips">
                    <For each={POLITICAL_OPTIONS}>
                      {(opt) => (
                        <button
                          class={`onboard-chip${editPolitical() === opt ? " selected" : ""}`}
                          onClick={() => setEditPolitical(opt)}
                        >
                          {opt}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="edit-actions">
                  <button class="sheet-btn sheet-btn-cancel" onClick={cancelEditing}>
                    Cancel
                  </button>
                  <button
                    class="sheet-btn sheet-btn-submit"
                    onClick={saveProfile}
                    disabled={saving() || !editName().trim()}
                  >
                    {saving() ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            }>
              {/* ==================== VIEW MODE ==================== */}
              <>
                <div class="profile-header">
                  <div
                    class="avatar-upload-section avatar-upload-compact"
                    onClick={() => fileInputRef?.click()}
                  >
                    <div class={`profile-avatar${p().avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={p().avatar_url} fallback={initials()}>
                        <img src={p().avatar_url!} alt={p().name} />
                      </Show>
                    </div>
                    <div class="avatar-upload-overlay">
                      <Show when={uploadingAvatar()} fallback={
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                          <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
                        </svg>
                      }>
                        <div class="loading-spinner" style="width:20px;height:20px;border-width:2px" />
                      </Show>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style="display:none"
                      onChange={onFileSelected}
                    />
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
                    <div class="profile-bio" style="font-style:italic;margin-top:4px">"{p().fun_fact}"</div>
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

                <div class="settings-list">
                  <div class="settings-item" onClick={toggleTheme}>
                    Dark Mode
                    <div class={`toggle-switch ${theme() === "dark" ? "on" : ""}`}>
                      <div class="toggle-knob" />
                    </div>
                  </div>
                  <div class="settings-item" onClick={startEditing}>Edit Profile <span class="chevron">›</span></div>
                  <div class="settings-item" onClick={() => setShowAbout(true)}>About Friendly <span class="chevron">›</span></div>
                  <div class="settings-item danger" onClick={signOut}>Sign Out</div>
                </div>

                <Show when={showAbout()}>
                  <div class="modal-overlay" onClick={() => setShowAbout(false)}>
                    <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
                      <h2>About Friendly</h2>
                      <p style="color:var(--text-secondary);font-size:14px;line-height:1.5;margin-bottom:12px">
                        Friendly helps you meet real people in your neighborhood.
                        Wave at someone, find common ground, and make plans.
                      </p>
                      <p style="color:var(--text-secondary);font-size:13px">Version 1.0.0</p>
                      <div class="sheet-actions">
                        <button class="sheet-btn sheet-btn-cancel" onClick={() => setShowAbout(false)}>Close</button>
                      </div>
                    </div>
                  </div>
                </Show>
              </>
            </Show>
          )}
        </Show>
      </div>
    </>
  );
};

export default Profile;
