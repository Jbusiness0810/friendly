import { createSignal, type Component } from "solid-js";

const categories = ["All", "Fitness", "Food", "Books", "Outdoors", "Games"] as const;

const circles = [
  { icon: "🏃", name: "Morning Runners", desc: "Early morning running for all levels", members: "18/20", category: "Fitness" },
  { icon: "🍳", name: "Cooking Circle", desc: "Weekly potlucks and recipe swaps", members: "12/15", category: "Food" },
  { icon: "📚", name: "Page Turners", desc: "Monthly book club with diverse genres", members: "9/12", category: "Books" },
  { icon: "🎨", name: "Art Walk", desc: "Explore local galleries and street art", members: "7/10", category: "Arts" },
  { icon: "🎮", name: "Board Game Night", desc: "Weekly game nights at rotating homes", members: "14/16", category: "Games" },
  { icon: "🐕", name: "Dog Walker Crew", desc: "Morning and evening group dog walks", members: "11/20", category: "Pets" },
];

const Circles: Component = () => {
  const [selected, setSelected] = createSignal("All");

  const filtered = () => {
    if (selected() === "All") return circles;
    return circles.filter((c) => c.category === selected());
  };

  return (
    <>
      <div class="nav-header">
        <h1>Circles</h1>
        <div class="nav-icon">+</div>
      </div>
      <div class="content">
        <div class="h-scroll" style="margin-bottom:16px">
          {categories.map((cat) => (
            <span
              class="interest-tag"
              style={
                selected() === cat
                  ? "background:var(--green);color:white;padding:6px 14px;cursor:pointer"
                  : "padding:6px 14px;cursor:pointer"
              }
              onClick={() => setSelected(cat)}
            >
              {cat}
            </span>
          ))}
        </div>

        {filtered().map((c) => (
          <div class="card" style="display:flex;gap:12px;align-items:center">
            <div class="circle-icon" style="min-width:44px;height:44px;background:var(--green);color:white;border-radius:12px">{c.icon}</div>
            <div style="flex:1">
              <h3 style="font-size:15px">{c.name}</h3>
              <div style="font-size:12px;color:var(--text-secondary)">{c.desc}</div>
              <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">👥 {c.members} · {c.category}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Circles;
