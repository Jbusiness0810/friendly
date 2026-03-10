import type { UserProfile } from "../context/AuthContext";

export interface SuggestedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // ISO string
  timeLabel: string; // e.g. "Sat, Mar 15 · 9:00 AM"
  isFree: boolean;
  score: number;
}

interface EventTemplate {
  id: string;
  title: string;
  description: string;
  interests: string[];
  hangouts: string[];
  intent: string[];
  locationDesc: string;
  timeSlot: "morning" | "afternoon" | "evening";
  preferredDay: "weekday" | "weekend" | "friday" | "any";
  isFree: boolean;
}

const TEMPLATES: EventTemplate[] = [
  // ---- FITNESS / ACTIVE ----
  {
    id: "park-workout",
    title: "Outdoor Park Workout",
    description: "Bodyweight circuit in the park — pushups, pull-ups, sprints. All fitness levels welcome. Bring water and a towel.",
    interests: ["Lifting", "Running"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    locationDesc: "Meet at the park pavilion",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "run-club",
    title: "Friendly Run Club",
    description: "Group run at your own pace — 2 to 5 miles. We regroup at the end and grab water or coffee. No one gets left behind.",
    interests: ["Running"],
    hangouts: ["Trail", "Coffee"],
    intent: ["Gym partner"],
    locationDesc: "Meet at the park entrance",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "pickup-basketball",
    title: "Pickup Basketball at the Park",
    description: "Casual 5v5 runs — we split teams on the spot. All skill levels, just come ready to play and have fun.",
    interests: ["Basketball"],
    hangouts: ["Sports"],
    intent: ["Pickup sports"],
    locationDesc: "Outdoor basketball courts at the park",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "sunset-hike",
    title: "Golden Hour Hike",
    description: "Easy-to-moderate hike timed for golden hour. Great views, good conversation, and a chill vibe. Bring a water bottle.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail"],
    intent: ["Weekend plans"],
    locationDesc: "Meet at the trailhead parking lot",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "morning-trail",
    title: "Saturday Morning Trail Walk",
    description: "Relaxed group walk on a local trail. Not a race — just fresh air, nature, and meeting new people nearby.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail"],
    intent: [],
    locationDesc: "Local trail",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "fishing-morning",
    title: "Sunrise Fishing Meetup",
    description: "Early morning session at the lake. Bring your own gear or just come hang. Beginners welcome — we'll share tips and tackle.",
    interests: ["Fishing"],
    hangouts: [],
    intent: ["Weekend plans"],
    locationDesc: "Meet at the lake dock",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "golf-range",
    title: "Driving Range & Drinks After",
    description: "Hit a bucket of balls together, then grab a drink at the clubhouse. Perfect if you're learning or just want to swing and socialize.",
    interests: ["Golf"],
    hangouts: [],
    intent: [],
    locationDesc: "Local driving range",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "golf-9-holes",
    title: "Casual 9 Holes Saturday",
    description: "Relaxed 9-hole round — no pressure, just good company on the course. Grab lunch at the turn.",
    interests: ["Golf"],
    hangouts: [],
    intent: ["Weekend plans"],
    locationDesc: "Local golf course",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },

  // ---- FOOD & DRINK ----
  {
    id: "coffee-morning",
    title: "Saturday Morning Coffee",
    description: "Meet a few new people over coffee at a local spot. Low-key, no agenda — just good conversation and caffeine.",
    interests: ["Coffee"],
    hangouts: ["Coffee"],
    intent: [],
    locationDesc: "Local coffee shop",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "cafe-hop",
    title: "Neighborhood Cafe Hop",
    description: "Walk to 2-3 cafes in the area, try something new at each one. Great way to explore the neighborhood and meet people.",
    interests: ["Coffee"],
    hangouts: ["Coffee"],
    intent: ["Weekend plans"],
    locationDesc: "Meet at first cafe downtown",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "happy-hour",
    title: "Wednesday Happy Hour",
    description: "Mid-week wind-down with new faces. $5 apps, half-price drinks, and zero awkwardness — everyone's here to meet people.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    locationDesc: "Local bar & grill",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "trivia-night",
    title: "Bar Trivia Team-Up",
    description: "We form a team of strangers and compete. No trivia knowledge required — just a sense of humor. Winning team gets bragging rights.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    locationDesc: "Local pub with trivia night",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "friday-drinks",
    title: "Friday Night Kickoff",
    description: "Start the weekend right — cold drinks, good music, and new friends. Show up whenever, stay as long as you want.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink", "Weekend plans"],
    locationDesc: "Popular local spot",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: false,
  },
  {
    id: "bbq-park",
    title: "Saturday Park BBQ",
    description: "BYOB and bring something to throw on the grill. We'll have charcoal, plates, and music. Everyone's welcome.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: ["Weekend plans"],
    locationDesc: "Park grill area / pavilion",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "potluck",
    title: "Neighborhood Potluck",
    description: "Everyone brings a dish to share — homemade or store-bought, doesn't matter. Come hungry, leave with new friends and maybe a recipe.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: [],
    locationDesc: "Community center / host's place",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "hike-brews",
    title: "Hike Then Brews",
    description: "Moderate morning hike followed by craft beers at the nearest taproom. The best of both worlds.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail", "Bar"],
    intent: ["Grab a drink", "Weekend plans"],
    locationDesc: "Meet at the trailhead",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },

  // ---- GAMES & ENTERTAINMENT ----
  {
    id: "board-games",
    title: "Board Game Night",
    description: "Settlers of Catan, Codenames, Exploding Kittens — we'll have a stack of games. Just show up and pick a table.",
    interests: ["Gaming"],
    hangouts: ["Game night"],
    intent: [],
    locationDesc: "Local board game cafe or host's place",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: true,
  },
  {
    id: "gaming-session",
    title: "Couch Gaming Night",
    description: "Mario Kart, Smash Bros, or whatever the group votes on. Snacks provided, just bring your competitive spirit.",
    interests: ["Gaming"],
    hangouts: ["Game night"],
    intent: [],
    locationDesc: "Host's place (address shared in chat)",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "open-mic",
    title: "Open Mic Night Out",
    description: "Whether you perform or just watch — come enjoy live music, comedy, or poetry with new people. Grab a drink and a good seat.",
    interests: ["Music"],
    hangouts: [],
    intent: [],
    locationDesc: "Local venue or cafe with open mic",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: true,
  },
  {
    id: "live-music",
    title: "Live Music + Drinks",
    description: "Local band playing tonight — come for the music, stay for the company. We'll grab a table up front.",
    interests: ["Music"],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    locationDesc: "Local music venue",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: false,
  },
  {
    id: "watch-party",
    title: "Game Day Watch Party",
    description: "Big game on the big screen. Wings, nachos, and cheering with new people who actually care about the game.",
    interests: [],
    hangouts: ["Sports"],
    intent: ["Watch the game"],
    locationDesc: "Local sports bar",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "sports-bar",
    title: "Thursday Night Sports Bar",
    description: "TNF or whatever's on — come watch the game with people from the neighborhood. First round of apps on whoever arrives last.",
    interests: [],
    hangouts: ["Sports", "Bar"],
    intent: ["Watch the game", "Grab a drink"],
    locationDesc: "Neighborhood sports bar",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },

  // ---- CARS ----
  {
    id: "cars-coffee",
    title: "Cars & Coffee Saturday",
    description: "Drive or ride along — park your car, walk the lot, talk shop. Coffee provided. All makes and models welcome.",
    interests: ["Cars"],
    hangouts: ["Coffee"],
    intent: [],
    locationDesc: "Shopping center lot (east side)",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "scenic-cruise",
    title: "Sunday Scenic Cruise",
    description: "Chill group cruise through the backroads. No speed demons — just good music, good views, and a pit stop for lunch.",
    interests: ["Cars"],
    hangouts: [],
    intent: ["Weekend plans"],
    locationDesc: "Meet at gas station off the highway",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },

  // ---- NETWORKING / PROFESSIONAL ----
  {
    id: "coworking-coffee",
    title: "Coworking Coffee Hour",
    description: "Bring your laptop or just yourself. Work alongside new people, swap ideas, and make connections over coffee.",
    interests: [],
    hangouts: ["Coffee"],
    intent: ["Networking"],
    locationDesc: "Local coworking space or cafe",
    timeSlot: "afternoon",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "lunch-connect",
    title: "Lunch & Connect",
    description: "Casual lunch with other local professionals. No pitch decks or business cards required — just real conversation.",
    interests: [],
    hangouts: [],
    intent: ["Networking"],
    locationDesc: "Local restaurant downtown",
    timeSlot: "afternoon",
    preferredDay: "weekday",
    isFree: false,
  },

  // ---- GENERAL SOCIAL ----
  {
    id: "weekend-hangout",
    title: "Saturday Afternoon Hangout",
    description: "Open invite — the group decides what to do. Could be a walk, food, or just sitting in the park. The point is meeting people.",
    interests: [],
    hangouts: [],
    intent: ["Weekend plans"],
    locationDesc: "Meet at the park",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "trail-coffee",
    title: "Walk & Talk Coffee",
    description: "Grab a coffee to-go and walk the neighborhood trail. Easy pace, good conversation, no commitment beyond an hour.",
    interests: ["Coffee", "Running"],
    hangouts: ["Coffee", "Trail"],
    intent: [],
    locationDesc: "Meet at the coffee shop near the trail",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getTimeForSlot(slot: "morning" | "afternoon" | "evening"): { hours: number; minutes: number; label: string } {
  switch (slot) {
    case "morning": return { hours: 9, minutes: 30, label: "9:30 AM" };
    case "afternoon": return { hours: 14, minutes: 0, label: "2:00 PM" };
    case "evening": return { hours: 19, minutes: 0, label: "7:00 PM" };
  }
}

function scoreTemplate(user: UserProfile, template: EventTemplate): number {
  let score = 0;

  const userInterests = new Set(user.interests.map((s) => s.toLowerCase()));
  const userHangouts = new Set(user.ideal_hangouts.map((s) => s.toLowerCase()));
  const userIntent = new Set(user.intent.map((s) => s.toLowerCase()));

  for (const i of template.interests) {
    if (userInterests.has(i.toLowerCase())) score += 3;
  }
  for (const h of template.hangouts) {
    if (userHangouts.has(h.toLowerCase())) score += 2;
  }
  for (const t of template.intent) {
    if (userIntent.has(t.toLowerCase())) score += 2;
  }

  return score;
}

/**
 * Find the next date matching the preferred day pattern, starting from a base offset.
 */
function getNextDate(now: Date, baseOffset: number, preferred: "weekday" | "weekend" | "friday" | "any"): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + baseOffset);

  if (preferred === "any") return d;

  // Scan forward up to 7 days to find a matching day
  for (let i = 0; i < 7; i++) {
    const day = d.getDay();
    if (preferred === "weekend" && (day === 0 || day === 6)) return d;
    if (preferred === "friday" && day === 5) return d;
    if (preferred === "weekday" && day >= 1 && day <= 4) return d;
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Generate personalized event suggestions for a user based on their profile.
 * Returns up to 6 relevant events with realistic dates.
 */
export function getSuggestedEvents(user: UserProfile): SuggestedEvent[] {
  const scored = TEMPLATES
    .map((t) => ({ template: t, score: scoreTemplate(user, t) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 6);
  if (top.length === 0) return [];

  const now = new Date();

  return top.map((item, i) => {
    const { template, score } = item;
    const time = getTimeForSlot(template.timeSlot);

    // Spread events across the next 2 weeks with proper day matching
    const baseOffset = 2 + i * 2;
    const eventDate = getNextDate(now, baseOffset, template.preferredDay);
    eventDate.setHours(time.hours, time.minutes, 0, 0);

    const dayName = WEEKDAYS[eventDate.getDay()];
    const monthName = MONTHS[eventDate.getMonth()];
    const dayNum = eventDate.getDate();

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      location: template.locationDesc,
      date: eventDate.toISOString(),
      timeLabel: `${dayName}, ${monthName} ${dayNum} · ${time.label}`,
      isFree: template.isFree,
      score,
    };
  });
}
