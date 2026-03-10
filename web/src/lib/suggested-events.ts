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
  defaultLocation: string;
  timeSlot: "morning" | "afternoon" | "evening";
  isFree: boolean;
}

const TEMPLATES: EventTemplate[] = [
  // Lifting / Gym
  {
    id: "lift-morning",
    title: "Morning Lift Session",
    description: "Start your day with a solid lift. All levels welcome.",
    interests: ["Lifting"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    defaultLocation: "Local Gym",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "push-pull-meetup",
    title: "Push Pull Legs Meetup",
    description: "Find a lifting buddy and hit a PPL split together.",
    interests: ["Lifting"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    defaultLocation: "Local Gym",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "gym-smoothies",
    title: "Gym & Smoothies",
    description: "Workout followed by smoothies. Great way to meet people.",
    interests: ["Lifting"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    defaultLocation: "Local Gym",
    timeSlot: "morning",
    isFree: true,
  },

  // Running / Trail
  {
    id: "saturday-run",
    title: "Saturday Morning Run",
    description: "Easy-paced group run. All distances welcome.",
    interests: ["Running"],
    hangouts: ["Trail"],
    intent: [],
    defaultLocation: "Nearby Park",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "trail-run-coffee",
    title: "Trail Run & Coffee After",
    description: "Hit the trail, then grab coffee together.",
    interests: ["Running"],
    hangouts: ["Trail", "Coffee"],
    intent: [],
    defaultLocation: "Local Trail",
    timeSlot: "morning",
    isFree: true,
  },

  // Coffee
  {
    id: "coffee-convo",
    title: "Coffee & Conversation",
    description: "Grab a coffee and meet someone new. Low-key and chill.",
    interests: ["Coffee"],
    hangouts: ["Coffee"],
    intent: [],
    defaultLocation: "Local Coffee Shop",
    timeSlot: "morning",
    isFree: false,
  },
  {
    id: "cafe-crawl",
    title: "New Cafe Crawl",
    description: "Explore 2-3 new cafes together. Good vibes only.",
    interests: ["Coffee"],
    hangouts: ["Coffee"],
    intent: ["Weekend plans"],
    defaultLocation: "Downtown",
    timeSlot: "afternoon",
    isFree: false,
  },
  {
    id: "morning-coffee-walk",
    title: "Morning Coffee Walk",
    description: "Grab-and-go coffee with a chill walk around the neighborhood.",
    interests: ["Coffee"],
    hangouts: ["Coffee"],
    intent: [],
    defaultLocation: "Neighborhood Coffee Spot",
    timeSlot: "morning",
    isFree: false,
  },

  // Basketball / Sports / Pickup
  {
    id: "pickup-basketball",
    title: "Pickup Basketball",
    description: "Casual pickup game. Need all skill levels.",
    interests: ["Basketball"],
    hangouts: ["Sports"],
    intent: ["Pickup sports"],
    defaultLocation: "Local Basketball Court",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "3v3-hoops",
    title: "3v3 Hoops",
    description: "Small team basketball — fast games, good competition.",
    interests: ["Basketball"],
    hangouts: ["Sports"],
    intent: ["Pickup sports"],
    defaultLocation: "Local Basketball Court",
    timeSlot: "evening",
    isFree: true,
  },

  // Golf
  {
    id: "driving-range",
    title: "Driving Range Hangout",
    description: "Hit some balls, share some tips, make a friend.",
    interests: ["Golf"],
    hangouts: [],
    intent: [],
    defaultLocation: "Local Driving Range",
    timeSlot: "afternoon",
    isFree: false,
  },
  {
    id: "9-hole-saturday",
    title: "9-Hole Saturday Morning",
    description: "Quick round of golf with new people. Keep it casual.",
    interests: ["Golf"],
    hangouts: [],
    intent: ["Weekend plans"],
    defaultLocation: "Local Golf Course",
    timeSlot: "morning",
    isFree: false,
  },

  // Hiking / Outdoors
  {
    id: "sunset-hike",
    title: "Sunset Hike",
    description: "Scenic evening hike. Bring water and good energy.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail"],
    intent: [],
    defaultLocation: "Nearby Trail",
    timeSlot: "evening",
    isFree: true,
  },
  {
    id: "weekend-trail",
    title: "Weekend Trail Exploration",
    description: "Discover a new trail together. Moderate difficulty.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail"],
    intent: ["Weekend plans"],
    defaultLocation: "Local Trailhead",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "nature-walk",
    title: "Nature Walk & Talk",
    description: "Easy walk through nature. Great for conversation.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail"],
    intent: [],
    defaultLocation: "Nearby Park",
    timeSlot: "morning",
    isFree: true,
  },

  // Cooking / BBQ
  {
    id: "bbq-cookout",
    title: "BBQ Cookout",
    description: "Bring your best dish or just come hungry. BYOB welcome.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: ["Weekend plans"],
    defaultLocation: "Local Park Grill Area",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "potluck-dinner",
    title: "Potluck Dinner Night",
    description: "Everyone brings something. Recipes and stories shared.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: [],
    defaultLocation: "TBD (Host's Place)",
    timeSlot: "evening",
    isFree: true,
  },
  {
    id: "grill-chill",
    title: "Grill & Chill",
    description: "Fire up the grill, bring some food, and hang out.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: ["Weekend plans"],
    defaultLocation: "Local Park",
    timeSlot: "afternoon",
    isFree: true,
  },

  // Gaming / Game Night
  {
    id: "game-night",
    title: "Game Night",
    description: "Board games, card games, or video games. Your pick.",
    interests: ["Gaming"],
    hangouts: ["Game night"],
    intent: [],
    defaultLocation: "TBD (Host's Place)",
    timeSlot: "evening",
    isFree: true,
  },
  {
    id: "couch-coop",
    title: "Couch Co-op Session",
    description: "Grab a controller and game with new friends.",
    interests: ["Gaming"],
    hangouts: ["Game night"],
    intent: [],
    defaultLocation: "TBD (Host's Place)",
    timeSlot: "evening",
    isFree: true,
  },

  // Music
  {
    id: "open-mic",
    title: "Open Mic Night",
    description: "Perform or just enjoy the show. All welcome.",
    interests: ["Music"],
    hangouts: [],
    intent: [],
    defaultLocation: "Local Venue",
    timeSlot: "evening",
    isFree: true,
  },
  {
    id: "live-music",
    title: "Live Music Outing",
    description: "Check out a local band or artist together.",
    interests: ["Music"],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    defaultLocation: "Local Music Venue",
    timeSlot: "evening",
    isFree: false,
  },

  // Fishing
  {
    id: "morning-fish",
    title: "Early Morning Fish",
    description: "Sunrise fishing session. Bring your own gear or share.",
    interests: ["Fishing"],
    hangouts: [],
    intent: [],
    defaultLocation: "Local Lake / Pier",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "weekend-fishing",
    title: "Weekend Fishing Trip",
    description: "Half-day fishing adventure. All skill levels.",
    interests: ["Fishing"],
    hangouts: [],
    intent: ["Weekend plans"],
    defaultLocation: "Local Lake",
    timeSlot: "morning",
    isFree: true,
  },

  // Cars
  {
    id: "cars-coffee",
    title: "Cars & Coffee Meet",
    description: "Show off your ride, check out others, and grab a coffee.",
    interests: ["Cars"],
    hangouts: ["Coffee"],
    intent: [],
    defaultLocation: "Local Parking Lot / Meetup Spot",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "weekend-cruise",
    title: "Weekend Cruise",
    description: "Scenic drive with fellow car enthusiasts.",
    interests: ["Cars"],
    hangouts: [],
    intent: ["Weekend plans"],
    defaultLocation: "TBD (Starting Point)",
    timeSlot: "afternoon",
    isFree: true,
  },

  // Bar / Grab a Drink
  {
    id: "happy-hour",
    title: "Happy Hour Meetup",
    description: "Drinks and conversation after work. Casual and fun.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    defaultLocation: "Local Bar",
    timeSlot: "evening",
    isFree: false,
  },
  {
    id: "trivia-night",
    title: "Trivia Night",
    description: "Team up with new people for bar trivia.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    defaultLocation: "Local Bar",
    timeSlot: "evening",
    isFree: false,
  },
  {
    id: "friday-night-out",
    title: "Friday Night Out",
    description: "Kick off the weekend with good people and good drinks.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink", "Weekend plans"],
    defaultLocation: "Local Bar",
    timeSlot: "evening",
    isFree: false,
  },

  // Watch the Game
  {
    id: "game-day-watch",
    title: "Game Day Watch Party",
    description: "Catch the game with fellow fans. Wings and cheering included.",
    interests: [],
    hangouts: ["Sports"],
    intent: ["Watch the game"],
    defaultLocation: "Sports Bar",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "sports-bar-meetup",
    title: "Sports Bar Meetup",
    description: "Watch the game, meet new people, enjoy the atmosphere.",
    interests: [],
    hangouts: ["Sports", "Bar"],
    intent: ["Watch the game", "Grab a drink"],
    defaultLocation: "Local Sports Bar",
    timeSlot: "evening",
    isFree: false,
  },

  // Networking
  {
    id: "professional-mixer",
    title: "Professional Mixer",
    description: "Expand your network in a relaxed setting.",
    interests: [],
    hangouts: ["Coffee"],
    intent: ["Networking"],
    defaultLocation: "Local Coworking Space",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "lunch-networking",
    title: "Lunch Networking",
    description: "Grab lunch and connect with local professionals.",
    interests: [],
    hangouts: [],
    intent: ["Networking"],
    defaultLocation: "Local Restaurant",
    timeSlot: "afternoon",
    isFree: false,
  },

  // Weekend Plans (general)
  {
    id: "weekend-adventure",
    title: "Weekend Adventure",
    description: "Open-ended weekend plans. Vote on what to do together.",
    interests: [],
    hangouts: [],
    intent: ["Weekend plans"],
    defaultLocation: "TBD",
    timeSlot: "afternoon",
    isFree: true,
  },
  {
    id: "saturday-plans",
    title: "Saturday Plans Open Invite",
    description: "No set plan yet — just good people looking to hang.",
    interests: [],
    hangouts: [],
    intent: ["Weekend plans"],
    defaultLocation: "TBD",
    timeSlot: "afternoon",
    isFree: true,
  },

  // Cross-category combos
  {
    id: "outdoor-gym",
    title: "Outdoor Workout",
    description: "Bodyweight workout in the park. Fresh air and gains.",
    interests: ["Lifting", "Outdoors"],
    hangouts: ["Gym", "Trail"],
    intent: ["Gym partner"],
    defaultLocation: "Nearby Park",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "hike-and-brews",
    title: "Hike & Brews",
    description: "Hit a trail then grab a beer after. Best combo.",
    interests: ["Hiking", "Outdoors"],
    hangouts: ["Trail", "Bar"],
    intent: ["Grab a drink", "Weekend plans"],
    defaultLocation: "Local Trail",
    timeSlot: "afternoon",
    isFree: false,
  },
  {
    id: "run-club",
    title: "Friendly Run Club",
    description: "Weekly group run — all paces, all people.",
    interests: ["Running"],
    hangouts: ["Trail"],
    intent: ["Gym partner"],
    defaultLocation: "Nearby Park",
    timeSlot: "morning",
    isFree: true,
  },
  {
    id: "cooking-hangout",
    title: "Cook Together Night",
    description: "Pick a recipe, cook it together, eat it together.",
    interests: ["Cooking"],
    hangouts: ["BBQ"],
    intent: [],
    defaultLocation: "TBD (Host's Place)",
    timeSlot: "evening",
    isFree: true,
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getTimeForSlot(slot: "morning" | "afternoon" | "evening"): { hours: number; minutes: number; label: string } {
  switch (slot) {
    case "morning": return { hours: 9, minutes: 0, label: "9:00 AM" };
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

/** Deterministic but varied day offsets based on template index */
function getDayOffsets(count: number): number[] {
  const offsets: number[] = [];
  // Spread events across the next 14 days
  for (let i = 0; i < count; i++) {
    offsets.push(1 + ((i * 2 + (i % 3)) % 14));
  }
  return offsets;
}

/**
 * Generate personalized event suggestions for a user based on their profile.
 * Returns up to 8 relevant events with dates spread across the next 2 weeks.
 */
export function getSuggestedEvents(user: UserProfile): SuggestedEvent[] {
  // Score and filter templates
  const scored = TEMPLATES
    .map((t) => ({ template: t, score: scoreTemplate(user, t) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Take top 8
  const top = scored.slice(0, 8);
  if (top.length === 0) return [];

  const now = new Date();
  const dayOffsets = getDayOffsets(top.length);
  const userLocation = user.location || "Nearby";

  return top.map((item, i) => {
    const { template, score } = item;
    const time = getTimeForSlot(template.timeSlot);

    // Create date for this event
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + dayOffsets[i]);
    eventDate.setHours(time.hours, time.minutes, 0, 0);

    const dayName = WEEKDAYS[eventDate.getDay()];
    const monthName = MONTHS[eventDate.getMonth()];
    const dayNum = eventDate.getDate();

    // Use user's location context for the location
    const location = template.defaultLocation === "TBD"
      ? "TBD"
      : template.defaultLocation.includes("Local") || template.defaultLocation.includes("Nearby")
        ? `${template.defaultLocation} · ${userLocation}`
        : template.defaultLocation;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      location,
      date: eventDate.toISOString(),
      timeLabel: `${dayName}, ${monthName} ${dayNum} · ${time.label}`,
      isFree: template.isFree,
      score,
    };
  });
}
