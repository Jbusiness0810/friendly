import { createSignal, For, type Component } from "solid-js";

const people = [
  { initials: "SK", name: "Sam K.", location: "Park Slope · 0.3 mi", bio: "Morning runner and coffee enthusiast. New to the neighborhood!", tags: ["Running", "Coffee"], matched: true },
  { initials: "MR", name: "Maya R.", location: "Park Slope · 0.5 mi", bio: "Foodie and gallery hopper. Always down for a coffee walk.", tags: ["Cooking", "Art"], matched: false },
  { initials: "TJ", name: "Tyler J.", location: "Prospect Heights · 0.8 mi", bio: "Book nerd and board game lover. Looking for game night crew!", tags: ["Books", "Games"], matched: false },
  { initials: "AL", name: "Alex L.", location: "Park Slope · 0.2 mi", bio: "Dog parent, yoga beginner. Love meeting neighbors on walks!", tags: ["Pets", "Yoga"], matched: false },
];

const VerifiedBadge = () => (
  <div class="verified-badge">
    <svg viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l.7-.7L4.5 7.1l4.8-4.8.7.7z" /></svg>
  </div>
);

const Home: Component = () => {
  const [waved, setWaved] = createSignal<Set<string>>(new Set());

  const wave = (name: string) => {
    setWaved((prev) => new Set(prev).add(name));
  };

  return (
    <>
      <div class="nav-header">
        <div>
          <h1>Discover</h1>
          <div class="neighborhood-tag">Park Slope, Brooklyn · 12 people nearby</div>
        </div>
        <div class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
      </div>
      <div>
        <For each={people}>
          {(person) => (
            <div class="discover-card">
              <div class={`discover-avatar${person.matched ? " avatar-photo" : ""}`}>
                {person.initials}
                <VerifiedBadge />
              </div>
              <div class="discover-info">
                <div class="discover-name">{person.name}</div>
                <div class="discover-location">{person.location}</div>
                <div class="discover-bio">{person.bio}</div>
                <div class="discover-bottom">
                  <div class="discover-tags">
                    <For each={person.tags}>
                      {(tag) => <span class="interest-tag">{tag}</span>}
                    </For>
                  </div>
                  <button
                    class="wave-btn"
                    onClick={() => wave(person.name)}
                    style={person.matched || waved().has(person.name) ? "color: var(--text-secondary)" : ""}
                  >
                    {person.matched ? "Matched" : waved().has(person.name) ? "Waved ✓" : "Wave"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </>
  );
};

export default Home;
