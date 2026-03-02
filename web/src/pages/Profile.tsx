import type { Component } from "solid-js";

const Profile: Component = () => {
  return (
    <>
      <div class="nav-header">
        <h1>Profile</h1>
        <div class="nav-icon" style="font-size:14px">⚙</div>
      </div>
      <div class="content">
        <div class="profile-header">
          <div class="avatar-circle" style="width:80px;height:80px;font-size:28px;margin:0 auto 12px">JT</div>
          <h2>Jordan Taylor</h2>
          <div class="bio">Coffee lover, morning runner, and amateur chef. Always looking for new friends in the neighborhood!</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="value">4</div><div class="label">Circles</div></div>
          <div class="stat-card"><div class="value">12</div><div class="label">Events</div></div>
          <div class="stat-card"><div class="value">8</div><div class="label">Friends</div></div>
        </div>

        <div style="padding:12px;background:#F5F5F5;border-radius:var(--radius);margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">Level 3</span>
            <span style="font-size:13px;color:var(--text-secondary)">340 pts</span>
          </div>
          <div style="height:6px;background:#E0E0E0;border-radius:3px;margin-top:8px">
            <div style="height:6px;background:var(--green);border-radius:3px;width:40%"></div>
          </div>
        </div>

        <div class="section-header"><h2>Interests</h2></div>
        <div class="interest-tags" style="margin-bottom:16px">
          <span class="interest-tag">Running</span>
          <span class="interest-tag">Cooking</span>
          <span class="interest-tag">Reading</span>
          <span class="interest-tag">Yoga</span>
          <span class="interest-tag">Coffee</span>
          <span class="interest-tag">Hiking</span>
        </div>

        <div class="section-header"><h2>Badges</h2><a href="#">5/14</a></div>
        <div class="badge-scroll">
          <div class="badge-item"><div class="badge-icon">🌱</div><div class="badge-name">Circle Starter</div></div>
          <div class="badge-item"><div class="badge-icon">🎪</div><div class="badge-name">Event Explorer</div></div>
          <div class="badge-item"><div class="badge-icon">🤝</div><div class="badge-name">First Connection</div></div>
          <div class="badge-item"><div class="badge-icon">🔥</div><div class="badge-name">Week Warrior</div></div>
          <div class="badge-item"><div class="badge-icon">🌸</div><div class="badge-name">Spring Bloom</div></div>
        </div>
        <div style="height:20px"></div>
      </div>
    </>
  );
};

export default Profile;
