import { createSignal, type Component } from "solid-js";

const Events: Component = () => {
  const [tab, setTab] = createSignal<"upcoming" | "my">("upcoming");

  return (
    <>
      <div class="nav-header">
        <h1>Events</h1>
        <div class="nav-icon">+</div>
      </div>
      <div class="content">
        <div style="display:flex;background:#F0F0F0;border-radius:8px;padding:3px;margin-bottom:16px">
          <div
            style={
              tab() === "upcoming"
                ? "flex:1;text-align:center;padding:6px;background:white;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer"
                : "flex:1;text-align:center;padding:6px;font-size:13px;color:var(--text-secondary);cursor:pointer"
            }
            onClick={() => setTab("upcoming")}
          >
            Upcoming
          </div>
          <div
            style={
              tab() === "my"
                ? "flex:1;text-align:center;padding:6px;background:white;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer"
                : "flex:1;text-align:center;padding:6px;font-size:13px;color:var(--text-secondary);cursor:pointer"
            }
            onClick={() => setTab("my")}
          >
            My Events
          </div>
        </div>

        {tab() === "upcoming" ? (
          <>
            <div class="event-row">
              <div class="event-date"><div class="month">Feb</div><div class="day">25</div></div>
              <div class="event-info"><h3>Morning Run Club</h3><div class="meta">Prospect Park · 7:00 AM</div><div class="meta">👥 8/15 · 🏃 Fitness</div></div>
              <div class="event-badge">Free</div>
            </div>
            <div class="event-row">
              <div class="event-date"><div class="month">Feb</div><div class="day">27</div></div>
              <div class="event-info"><h3>Pasta Making Workshop</h3><div class="meta">Community Kitchen · 6:30 PM</div><div class="meta">👥 12/12 · 🍳 Food</div></div>
              <div class="event-badge">$15</div>
            </div>
            <div class="event-row">
              <div class="event-date"><div class="month">Mar</div><div class="day">1</div></div>
              <div class="event-info"><h3>Book Club: Klara and the Sun</h3><div class="meta">Local Café · 2:00 PM</div><div class="meta">👥 5/8 · 📚 Books</div></div>
              <div class="event-badge">Free</div>
            </div>
            <div class="event-row">
              <div class="event-date"><div class="month">Mar</div><div class="day">3</div></div>
              <div class="event-info"><h3>Sunset Yoga in the Park</h3><div class="meta">Prospect Park · 5:30 PM</div><div class="meta">👥 6/20 · 🧘 Wellness</div></div>
              <div class="event-badge">Free</div>
            </div>
            <div class="event-row">
              <div class="event-date"><div class="month">Mar</div><div class="day">5</div></div>
              <div class="event-info"><h3>Trivia Night</h3><div class="meta">The Local Pub · 7:30 PM</div><div class="meta">👥 16/24 · 🎮 Games</div></div>
              <div class="event-badge">$5</div>
            </div>
            <div class="event-row">
              <div class="event-date"><div class="month">Mar</div><div class="day">8</div></div>
              <div class="event-info"><h3>Gallery Walk: Spring Show</h3><div class="meta">5th Ave Galleries · 11:00 AM</div><div class="meta">👥 4/10 · 🎨 Arts</div></div>
              <div class="event-badge">Free</div>
            </div>
          </>
        ) : (
          <div style="text-align:center;padding:40px 0;color:var(--text-secondary)">
            <div style="font-size:32px;margin-bottom:8px">📅</div>
            <div style="font-size:14px">No events yet — RSVP to see them here</div>
          </div>
        )}
      </div>
    </>
  );
};

export default Events;
