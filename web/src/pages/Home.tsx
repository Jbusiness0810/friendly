import type { Component } from "solid-js";
import { A } from "@solidjs/router";

const Home: Component = () => {
  return (
    <>
      <div class="nav-header">
        <div>
          <div class="welcome-text">Good morning!</div>
          <h1>Hey, Jordan!</h1>
          <div class="neighborhood-tag">📍 Park Slope, Brooklyn</div>
        </div>
        <div class="nav-icon">🔔</div>
      </div>
      <div class="content">
        <div class="section-header">
          <h2>❤️ New Matches</h2>
          <A href="/matches">See All</A>
        </div>
        <div class="h-scroll">
          <div class="match-card-small">
            <div class="avatar-circle">SK</div>
            <div class="match-score">92%</div>
            <div style="font-size:11px;color:var(--text-secondary)">Running, Yoga</div>
          </div>
          <div class="match-card-small">
            <div class="avatar-circle">MR</div>
            <div class="match-score">87%</div>
            <div style="font-size:11px;color:var(--text-secondary)">Cooking, Art</div>
          </div>
          <div class="match-card-small">
            <div class="avatar-circle">TJ</div>
            <div class="match-score">81%</div>
            <div style="font-size:11px;color:var(--text-secondary)">Books, Coffee</div>
          </div>
        </div>

        <div class="section-header">
          <h2>📅 Upcoming Events</h2>
          <A href="/events">See All</A>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Feb</div><div class="day">25</div></div>
          <div class="event-info"><h3>Morning Run Club</h3><div class="meta">Prospect Park · 7:00 AM</div><div class="meta">👥 8/15</div></div>
          <div class="event-badge">Free</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Feb</div><div class="day">27</div></div>
          <div class="event-info"><h3>Pasta Making Workshop</h3><div class="meta">Community Kitchen · 6:30 PM</div><div class="meta">👥 12/12</div></div>
          <div class="event-badge">$15</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">1</div></div>
          <div class="event-info"><h3>Book Club: Klara and the Sun</h3><div class="meta">Local Café · 2:00 PM</div><div class="meta">👥 5/8</div></div>
          <div class="event-badge">Free</div>
        </div>

        <div class="section-header">
          <h2>🟢 Popular Circles</h2>
          <A href="/circles">See All</A>
        </div>
        <div class="h-scroll">
          <div class="circle-card">
            <div class="circle-icon">🏃</div>
            <h3>Morning Runners</h3>
            <div class="meta">18 members</div>
          </div>
          <div class="circle-card">
            <div class="circle-icon">🍳</div>
            <h3>Cooking Circle</h3>
            <div class="meta">12 members</div>
          </div>
          <div class="circle-card">
            <div class="circle-icon">📚</div>
            <h3>Page Turners</h3>
            <div class="meta">9 members</div>
          </div>
          <div class="circle-card">
            <div class="circle-icon">🎨</div>
            <h3>Art Walk</h3>
            <div class="meta">7 members</div>
          </div>
        </div>
        <div style="height:20px"></div>
      </div>
    </>
  );
};

export default Home;
