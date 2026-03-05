import type { Component } from "solid-js";

const Events: Component = () => {
  return (
    <>
      <div class="nav-header">
        <h1>Events</h1>
        <div class="nav-icon" style="background:none;font-size:28px;color:var(--primary)">+</div>
      </div>
      <div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">5</div></div>
          <div class="event-info"><h3>Morning Run Club</h3><div class="meta">Prospect Park · 7:00 AM</div><div class="meta">8/15</div></div>
          <div class="event-badge">Free</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">8</div></div>
          <div class="event-info"><h3>Pasta Making Night</h3><div class="meta">Community Kitchen · 6:30 PM</div><div class="meta">12/12</div></div>
          <div class="event-badge">$15</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">10</div></div>
          <div class="event-info"><h3>Book Club: Klara and the Sun</h3><div class="meta">Local Café · 2:00 PM</div><div class="meta">5/8</div></div>
          <div class="event-badge">Free</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">12</div></div>
          <div class="event-info"><h3>Sunset Yoga in the Park</h3><div class="meta">Prospect Park · 5:30 PM</div><div class="meta">6/20</div></div>
          <div class="event-badge">Free</div>
        </div>
        <div class="event-row">
          <div class="event-date"><div class="month">Mar</div><div class="day">15</div></div>
          <div class="event-info"><h3>Trivia Night</h3><div class="meta">The Local Pub · 7:30 PM</div><div class="meta">16/24</div></div>
          <div class="event-badge">$5</div>
        </div>
      </div>
    </>
  );
};

export default Events;
