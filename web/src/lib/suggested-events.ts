import type { UserProfile } from "../context/AuthContext";
import { searchNearbyVenue } from "./google-places";
import { supabase } from "./supabase";

export interface SuggestedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // ISO string
  timeLabel: string; // e.g. "Sat, Mar 15 · 9:00 AM"
  isFree: boolean;
  score: number;
  source: "template" | "community"; // where this suggestion came from
  communityEventId?: string; // if source === "community", the real event id
}

interface EventTemplate {
  id: string;
  title: string;
  description: string;
  interests: string[];
  hangouts: string[];
  intent: string[];
  searchQuery: string; // Google Places search query (e.g. "coffee shops")
  fallbackLocation: string; // Shown if Google Places unavailable
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
    searchQuery: "public parks with fitness equipment",
    fallbackLocation: "Local park",
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
    searchQuery: "running trails and paths",
    fallbackLocation: "Local running trail",
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
    searchQuery: "parks with basketball courts",
    fallbackLocation: "Local basketball courts",
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
    searchQuery: "hiking trails",
    fallbackLocation: "Local trailhead",
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
    searchQuery: "nature trails and walking paths",
    fallbackLocation: "Local trail",
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
    searchQuery: "fishing spots lakes and piers",
    fallbackLocation: "Local fishing spot",
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
    searchQuery: "driving range golf",
    fallbackLocation: "Local driving range",
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
    searchQuery: "golf courses",
    fallbackLocation: "Local golf course",
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
    searchQuery: "coffee shops",
    fallbackLocation: "Local coffee shop",
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
    searchQuery: "popular cafes",
    fallbackLocation: "Downtown cafe district",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "happy-hour",
    title: "Wednesday Happy Hour",
    description: "Mid-week wind-down with new faces. Appetizers, drinks, and zero awkwardness — everyone's here to meet people.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    searchQuery: "bars with happy hour specials",
    fallbackLocation: "Local bar & grill",
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
    searchQuery: "bars with trivia night",
    fallbackLocation: "Local pub",
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
    searchQuery: "popular bars and lounges",
    fallbackLocation: "Popular local bar",
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
    searchQuery: "parks with barbecue grills and picnic areas",
    fallbackLocation: "Local park pavilion",
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
    searchQuery: "community centers with event space",
    fallbackLocation: "Community center",
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
    searchQuery: "hiking trails near breweries",
    fallbackLocation: "Local trailhead",
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
    searchQuery: "board game cafes",
    fallbackLocation: "Local board game cafe",
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
    searchQuery: "gaming lounges and arcades",
    fallbackLocation: "Local gaming lounge",
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
    searchQuery: "venues with open mic nights",
    fallbackLocation: "Local open mic venue",
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
    searchQuery: "live music venues",
    fallbackLocation: "Local music venue",
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
    searchQuery: "sports bars with big screens",
    fallbackLocation: "Local sports bar",
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
    searchQuery: "sports bars",
    fallbackLocation: "Neighborhood sports bar",
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
    searchQuery: "cars and coffee meetup locations",
    fallbackLocation: "Local parking lot meetup",
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
    searchQuery: "scenic drive starting points",
    fallbackLocation: "Local meetup point",
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
    searchQuery: "coworking spaces",
    fallbackLocation: "Local coworking space",
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
    searchQuery: "restaurants popular for lunch",
    fallbackLocation: "Local restaurant",
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
    searchQuery: "popular parks",
    fallbackLocation: "Local park",
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
    searchQuery: "coffee shops near walking trails",
    fallbackLocation: "Local coffee shop",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },

  // ============ EXPANDED TEMPLATES ============

  // ---- FITNESS / ACTIVE (new) ----
  {
    id: "yoga-park",
    title: "Morning Yoga in the Park",
    description: "Gentle flow session on the grass — bring a mat or towel. All levels welcome. We stretch, breathe, and start the day right.",
    interests: ["Yoga", "Outdoors"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    searchQuery: "parks with open grass areas",
    fallbackLocation: "Local park",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "pickup-soccer",
    title: "Pickup Soccer Match",
    description: "Casual kickabout — we split into teams and play. All skill levels, just bring cleats and water.",
    interests: ["Soccer"],
    hangouts: ["Sports"],
    intent: ["Pickup sports"],
    searchQuery: "soccer fields and parks",
    fallbackLocation: "Local soccer fields",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "volleyball-beach",
    title: "Beach Volleyball Pickup",
    description: "Drop-in volleyball on the sand. Rotating teams, no commitments — just show up and play.",
    interests: ["Volleyball", "Outdoors"],
    hangouts: ["Sports"],
    intent: ["Pickup sports", "Weekend plans"],
    searchQuery: "beach volleyball courts",
    fallbackLocation: "Local beach courts",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "bike-ride",
    title: "Weekend Group Bike Ride",
    description: "Chill 10-15 mile ride through the neighborhood. Moderate pace, plenty of stops. Bring your own bike and helmet.",
    interests: ["Cycling", "Outdoors"],
    hangouts: ["Trail"],
    intent: ["Weekend plans", "Gym partner"],
    searchQuery: "bike trails and cycling paths",
    fallbackLocation: "Local bike trail",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "rock-climbing",
    title: "Climbing Gym Session",
    description: "Indoor bouldering and top-rope climbing. Beginners welcome — rentals available. We'll teach you the ropes (literally).",
    interests: ["Climbing", "Lifting"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    searchQuery: "rock climbing gyms",
    fallbackLocation: "Local climbing gym",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "tennis-doubles",
    title: "Tennis Doubles Mixer",
    description: "Rotating doubles matches — we'll pair you up. All skill levels welcome. Bring a racket or borrow one.",
    interests: ["Tennis"],
    hangouts: ["Sports"],
    intent: ["Pickup sports"],
    searchQuery: "public tennis courts",
    fallbackLocation: "Local tennis courts",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "swimming-laps",
    title: "Morning Swim Meetup",
    description: "Lap swim or just hang in the pool. Great way to start the day and meet people who love the water.",
    interests: ["Swimming"],
    hangouts: ["Gym"],
    intent: ["Gym partner"],
    searchQuery: "public swimming pools",
    fallbackLocation: "Community pool",
    timeSlot: "morning",
    preferredDay: "weekday",
    isFree: false,
  },

  // ---- FOOD & DRINK (new) ----
  {
    id: "brunch-crawl",
    title: "Sunday Brunch Crawl",
    description: "Hit 2-3 brunch spots in the neighborhood. Mimosas, pancakes, and good vibes. Come hungry.",
    interests: ["Cooking", "Coffee"],
    hangouts: ["Coffee", "Bar"],
    intent: ["Weekend plans"],
    searchQuery: "popular brunch restaurants",
    fallbackLocation: "Local brunch spot",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "food-truck-friday",
    title: "Food Truck Friday",
    description: "A different food truck lineup every week. Grab a bite, sit on the grass, and meet your neighbors.",
    interests: ["Cooking"],
    hangouts: [],
    intent: ["Weekend plans"],
    searchQuery: "food truck parks and gatherings",
    fallbackLocation: "Local food truck park",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: false,
  },
  {
    id: "wine-tasting",
    title: "Wine Tasting Evening",
    description: "Sample 4-5 wines at a local wine bar. No expertise needed — just an open palate and good conversation.",
    interests: [],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    searchQuery: "wine bars and tasting rooms",
    fallbackLocation: "Local wine bar",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "cooking-class",
    title: "Group Cooking Class",
    description: "Learn a new recipe together and eat what you make. Perfect for foodies who want to meet people over a shared meal.",
    interests: ["Cooking"],
    hangouts: [],
    intent: [],
    searchQuery: "cooking classes",
    fallbackLocation: "Local cooking school",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "farmers-market",
    title: "Farmers Market Walk",
    description: "Stroll through the market, sample local produce, and grab breakfast. Easygoing way to start the weekend.",
    interests: ["Cooking", "Outdoors"],
    hangouts: ["Coffee"],
    intent: ["Weekend plans"],
    searchQuery: "farmers markets",
    fallbackLocation: "Local farmers market",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: true,
  },

  // ---- GAMES & ENTERTAINMENT (new) ----
  {
    id: "karaoke-night",
    title: "Karaoke Night Out",
    description: "Private room or bar stage — doesn't matter if you can sing. It's about the energy. Liquid courage provided at the bar.",
    interests: ["Music"],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    searchQuery: "karaoke bars",
    fallbackLocation: "Local karaoke bar",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: false,
  },
  {
    id: "movie-night",
    title: "Outdoor Movie Night",
    description: "Blankets, popcorn, and a movie under the stars. Bring a chair or blanket and something to share.",
    interests: [],
    hangouts: [],
    intent: ["Weekend plans"],
    searchQuery: "outdoor movie screenings and venues",
    fallbackLocation: "Local park amphitheater",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "arcade-bar",
    title: "Arcade Bar Night",
    description: "Retro arcade games, pinball, and drinks. Challenge strangers to Street Fighter or team up for co-op. All tokens on you.",
    interests: ["Gaming"],
    hangouts: ["Bar", "Game night"],
    intent: ["Grab a drink"],
    searchQuery: "arcade bars barcade",
    fallbackLocation: "Local arcade bar",
    timeSlot: "evening",
    preferredDay: "friday",
    isFree: false,
  },
  {
    id: "escape-room",
    title: "Escape Room Challenge",
    description: "Team up with strangers to solve puzzles and escape. Great icebreaker — nothing bonds people like shared panic.",
    interests: ["Gaming"],
    hangouts: ["Game night"],
    intent: [],
    searchQuery: "escape rooms",
    fallbackLocation: "Local escape room",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "comedy-show",
    title: "Local Comedy Show",
    description: "Live standup at a local bar or comedy club. Grab a drink, grab a seat, and laugh with new people.",
    interests: ["Music"],
    hangouts: ["Bar"],
    intent: ["Grab a drink"],
    searchQuery: "comedy clubs and shows",
    fallbackLocation: "Local comedy club",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: false,
  },

  // ---- CREATIVE / LEARNING (new) ----
  {
    id: "photography-walk",
    title: "Photo Walk",
    description: "Explore the neighborhood through a lens. Phone cameras welcome. We'll share our best shots at a coffee stop after.",
    interests: ["Photography", "Outdoors"],
    hangouts: ["Trail", "Coffee"],
    intent: [],
    searchQuery: "scenic walkable neighborhoods",
    fallbackLocation: "Downtown meetup point",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "book-club",
    title: "Casual Book Club Meetup",
    description: "Didn't finish the book? That's fine. Come discuss whatever you read this month over coffee or drinks.",
    interests: ["Reading"],
    hangouts: ["Coffee"],
    intent: [],
    searchQuery: "bookstores with seating areas",
    fallbackLocation: "Local bookstore cafe",
    timeSlot: "evening",
    preferredDay: "weekday",
    isFree: false,
  },
  {
    id: "art-gallery",
    title: "Gallery Walk & Drinks",
    description: "Explore a local gallery or art show, then grab drinks nearby. No art knowledge required — just curiosity.",
    interests: ["Art"],
    hangouts: [],
    intent: [],
    searchQuery: "art galleries",
    fallbackLocation: "Local art gallery",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },

  // ---- OUTDOOR / ADVENTURE (new) ----
  {
    id: "kayak-morning",
    title: "Morning Kayak Session",
    description: "Paddle out for an hour or two on calm water. Rentals available. Peaceful way to start the day with new people.",
    interests: ["Outdoors"],
    hangouts: [],
    intent: ["Weekend plans"],
    searchQuery: "kayak rental locations",
    fallbackLocation: "Local lake or river",
    timeSlot: "morning",
    preferredDay: "weekend",
    isFree: false,
  },
  {
    id: "dog-park",
    title: "Dog Park Social",
    description: "Bring your pup and meet other dog owners. Dogs are the ultimate icebreaker. Treats and tennis balls provided.",
    interests: ["Dogs", "Outdoors"],
    hangouts: [],
    intent: [],
    searchQuery: "off-leash dog parks",
    fallbackLocation: "Local dog park",
    timeSlot: "afternoon",
    preferredDay: "weekend",
    isFree: true,
  },
  {
    id: "sunset-picnic",
    title: "Sunset Picnic in the Park",
    description: "BYOB and a snack to share. We'll stake out a spot with a view and watch the sunset. Blankets and good vibes required.",
    interests: ["Outdoors"],
    hangouts: [],
    intent: ["Weekend plans"],
    searchQuery: "parks with sunset views",
    fallbackLocation: "Local scenic park",
    timeSlot: "evening",
    preferredDay: "weekend",
    isFree: true,
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ---- Dismissed / Seen tracking via localStorage ----

const DISMISSED_KEY = "friendly_dismissed_suggestions";
const SEEN_KEY = "friendly_seen_suggestions";

function getDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function dismissSuggestion(id: string): void {
  const dismissed = getDismissedIds();
  dismissed.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]): void {
  const seen = getSeenIds();
  for (const id of ids) seen.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

// ---- Scoring with randomness ----

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

  // Add weighted randomness (0 to 3 points) so suggestions rotate
  score += Math.random() * 3;

  // Penalize previously seen suggestions slightly so fresh ones surface
  const seen = getSeenIds();
  if (seen.has(template.id)) {
    score -= 1.5;
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

// ---- Community events (user-created events surfaced as suggestions) ----

async function getCommunityEvents(userId: string): Promise<SuggestedEvent[]> {
  const now = new Date();

  // Fetch upcoming public events created by OTHER users that we haven't RSVP'd to
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, description, location, date, price, event_rsvps(count)")
    .neq("creator_id", userId)
    .gte("date", now.toISOString())
    .order("date", { ascending: true })
    .limit(20);

  if (error || !events?.length) return [];

  // Filter out events we've already RSVP'd to
  const { data: myRsvps } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("user_id", userId);

  const rsvpSet = new Set((myRsvps ?? []).map((r: { event_id: string }) => r.event_id));
  const dismissed = getDismissedIds();

  const available = (events as any[]).filter(
    (e) => !rsvpSet.has(e.id) && !dismissed.has(`community-${e.id}`)
  );

  // Sort by popularity (RSVP count), then take top results
  available.sort((a, b) => {
    const countA = a.event_rsvps?.[0]?.count ?? 0;
    const countB = b.event_rsvps?.[0]?.count ?? 0;
    return countB - countA;
  });

  return available.slice(0, 4).map((e) => {
    const d = new Date(e.date);
    const dayName = WEEKDAYS[d.getDay()];
    const monthName = MONTHS[d.getMonth()];
    const dayNum = d.getDate();
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    const timeStr = `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;

    const isFree = !e.price || e.price === "0" || e.price.toLowerCase() === "free";

    return {
      id: `community-${e.id}`,
      title: e.title,
      description: e.description ?? "",
      location: e.location ?? "TBD",
      date: e.date,
      timeLabel: `${dayName}, ${monthName} ${dayNum} · ${timeStr}`,
      isFree,
      score: 10 + (e.event_rsvps?.[0]?.count ?? 0), // boost community events
      source: "community" as const,
      communityEventId: e.id,
    };
  });
}

/**
 * Generate personalized event suggestions for a user based on their profile.
 * Combines template-based suggestions with community-created events.
 * Uses Google Places API to find real venues near the user's location.
 * Returns up to 6 relevant events with realistic dates and real venue names.
 */
export async function getSuggestedEvents(user: UserProfile): Promise<SuggestedEvent[]> {
  const dismissed = getDismissedIds();

  // Score and filter templates, excluding dismissed ones
  const scored = TEMPLATES
    .filter((t) => !dismissed.has(t.id))
    .map((t) => ({ template: t, score: scoreTemplate(user, t) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Fetch community events in parallel with venue lookups
  const communityPromise = getCommunityEvents(user.id);

  // Take top 4 template suggestions (leaving room for community events)
  const top = scored.slice(0, 4);
  const now = new Date();

  // Build location suffix from user profile for geographic relevance
  const locationSuffix = user.location ? ` in ${user.location}` : "";

  // Resolve all venue lookups in parallel
  const venuePromises = top.map((item) =>
    searchNearbyVenue(item.template.searchQuery + locationSuffix)
  );
  const [venues, communityEvents] = await Promise.all([
    Promise.all(venuePromises),
    communityPromise,
  ]);

  const templateSuggestions: SuggestedEvent[] = top.map((item, i) => {
    const { template, score } = item;
    const time = getTimeForSlot(template.timeSlot);

    // Spread events across the next 2 weeks with proper day matching
    const baseOffset = 2 + i * 2;
    const eventDate = getNextDate(now, baseOffset, template.preferredDay);
    eventDate.setHours(time.hours, time.minutes, 0, 0);

    const dayName = WEEKDAYS[eventDate.getDay()];
    const monthName = MONTHS[eventDate.getMonth()];
    const dayNum = eventDate.getDate();

    // Use real venue from Google Places, or fallback
    const venue = venues[i];
    const location = venue
      ? `${venue.name} — ${venue.address}`
      : template.fallbackLocation;

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      location,
      date: eventDate.toISOString(),
      timeLabel: `${dayName}, ${monthName} ${dayNum} · ${time.label}`,
      isFree: template.isFree,
      score,
      source: "template" as const,
    };
  });

  // Merge: community events first (they're real), then templates
  const combined = [...communityEvents, ...templateSuggestions];

  // De-dup by id and cap at 6
  const seen = new Set<string>();
  const results: SuggestedEvent[] = [];
  for (const s of combined) {
    if (!seen.has(s.id) && results.length < 6) {
      seen.add(s.id);
      results.push(s);
    }
  }

  // Track these as seen for future rotation
  markSeen(results.map((r) => r.id));

  return results;
}
