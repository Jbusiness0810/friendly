import { createSignal, type Component, Show, For } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

const INTEREST_OPTIONS = [
  "Lifting", "Running", "Cooking", "Gaming", "Music", "Hiking",
  "Coffee", "Basketball", "Golf", "Outdoors", "Fishing", "Cars",
];

const HANGOUT_OPTIONS = [
  "Coffee", "Gym", "Bar", "Sports", "BBQ", "Game night", "Trail",
];

const STYLE_OPTIONS = ["Spontaneous", "Planner", "Bit of both"];

const Profile: Component = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [editing, setEditing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  // Edit form state
  const [editName, setEditName] = createSignal("");
  const [editBio, setEditBio] = createSignal("");
  const [editLocation, setEditLocation] = createSignal("");
  const [editFunFact, setEditFunFact] = createSignal("");
  const [editInterests, setEditInterests] = createSignal<string[]>([]);
  const [editHangouts, setEditHangouts] = createSignal<string[]>([]);
  const [editStyle, setEditStyle] = createSignal("");

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
      })
      .eq("id", p.id);

    if (!error) {
      await refreshProfile();
      setEditing(false);
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
                  <div class="profile-avatar avatar-photo">{initials()}</div>
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

                <div class="settings-list">
                  <div class="settings-item" onClick={toggleTheme}>
                    Dark Mode
                    <div class={`toggle-switch ${theme() === "dark" ? "on" : ""}`}>
                      <div class="toggle-knob" />
                    </div>
                  </div>
                  <div class="settings-item" onClick={startEditing}>Edit Profile <span class="chevron">›</span></div>
                  <div class="settings-item">Notifications <span class="chevron">›</span></div>
                  <div class="settings-item">Safety &amp; Reporting <span class="chevron">›</span></div>
                  <div class="settings-item">About Friendly <span class="chevron">›</span></div>
                  <div class="settings-item danger" onClick={signOut}>Sign Out</div>
                </div>
              </>
            </Show>
          )}
        </Show>
      </div>
    </>
  );
};

export default Profile;
