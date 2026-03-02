import { createSignal, For, type Component } from "solid-js";

const matchData = [
  { initials: "SK", name: "Sam Kim", score: 92, reason: "You share 4 interests and live nearby", interests: ["Running", "Yoga", "Cooking", "Hiking"], circle: "Morning Runners" },
  { initials: "MR", name: "Maya Rodriguez", score: 87, reason: "You're in 2 circles together", interests: ["Cooking", "Art", "Coffee"], circle: "Cooking Circle" },
  { initials: "TJ", name: "Tyler James", score: 81, reason: "Your schedules align perfectly", interests: ["Books", "Coffee", "Board Games"], circle: "Page Turners" },
];

const Matches: Component = () => {
  const [matchIndex, setMatchIndex] = createSignal(0);
  let cardRef: HTMLDivElement | undefined;

  const current = () => matchData[matchIndex()];

  const nextMatch = () => {
    if (!cardRef) return;
    cardRef.style.transition = "transform 0.3s, opacity 0.3s";
    cardRef.style.transform = "translateX(100px)";
    cardRef.style.opacity = "0";
    setTimeout(() => {
      setMatchIndex((i) => (i + 1) % matchData.length);
      if (!cardRef) return;
      cardRef.style.transition = "none";
      cardRef.style.transform = "translateX(-100px)";
      cardRef.style.opacity = "0";
      setTimeout(() => {
        if (!cardRef) return;
        cardRef.style.transition = "transform 0.3s, opacity 0.3s";
        cardRef.style.transform = "translateX(0)";
        cardRef.style.opacity = "1";
      }, 50);
    }, 300);
  };

  return (
    <>
      <div class="nav-header">
        <h1>Matches</h1>
      </div>
      <div class="content" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="match-full" ref={cardRef}>
          <div class="avatar-circle">{current().initials}</div>
          <h2>{current().name}</h2>
          <div class="score">{current().score}% match</div>
          <div class="reason">{current().reason}</div>
          <div class="interest-tags">
            <For each={current().interests}>
              {(interest) => <span class="interest-tag">{interest}</span>}
            </For>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:12px">Member of {current().circle}</div>
          <div class="match-actions">
            <button class="match-btn decline" onClick={nextMatch}>✕</button>
            <button class="match-btn accept" onClick={nextMatch}>♥</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Matches;
