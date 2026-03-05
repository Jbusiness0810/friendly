import { type Component, Show, For } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Profile: Component = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

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

  return (
    <>
      <div class="nav-header">
        <h1>Profile</h1>
      </div>
      <div class="content">
        <Show when={profile()} fallback={<div>Loading...</div>}>
          {(p) => (
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
                <div class="settings-item">Edit Profile <span class="chevron">›</span></div>
                <div class="settings-item">Notifications <span class="chevron">›</span></div>
                <div class="settings-item">Safety &amp; Reporting <span class="chevron">›</span></div>
                <div class="settings-item">About Friendly <span class="chevron">›</span></div>
                <div class="settings-item danger" onClick={signOut}>Sign Out</div>
              </div>
            </>
          )}
        </Show>
      </div>
    </>
  );
};

export default Profile;
