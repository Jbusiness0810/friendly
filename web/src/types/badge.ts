export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: BadgeCategory;
  tier: BadgeTier;
  requirement: BadgeRequirement;
  earnedAt?: Date;
}

export type BadgeCategory =
  | "Social"
  | "Events"
  | "Matching"
  | "Seasonal"
  | "Streaks";

export type BadgeTier = "bronze" | "silver" | "gold" | "special";

export type BadgeRequirement =
  | { type: "joinCircles"; count: number }
  | { type: "attendEvents"; count: number }
  | { type: "hostEvents"; count: number }
  | { type: "acceptMatches"; count: number }
  | { type: "seasonalEvent"; season: string }
  | { type: "activityStreak"; days: number };

export const badgeTierEmoji: Record<BadgeTier, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  special: "✨",
};

export const allBadges: Badge[] = [
  // Social badges
  {
    id: "first_circle",
    name: "Circle Starter",
    description: "Join your first circle",
    iconName: "badge-circle-starter",
    category: "Social",
    tier: "bronze",
    requirement: { type: "joinCircles", count: 1 },
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Join 5 circles",
    iconName: "badge-social-butterfly",
    category: "Social",
    tier: "silver",
    requirement: { type: "joinCircles", count: 5 },
  },
  {
    id: "community_pillar",
    name: "Community Pillar",
    description: "Join 10 circles",
    iconName: "badge-community-pillar",
    category: "Social",
    tier: "gold",
    requirement: { type: "joinCircles", count: 10 },
  },

  // Event badges
  {
    id: "first_event",
    name: "Event Explorer",
    description: "Attend your first event",
    iconName: "badge-event-explorer",
    category: "Events",
    tier: "bronze",
    requirement: { type: "attendEvents", count: 1 },
  },
  {
    id: "regular",
    name: "Regular",
    description: "Attend 10 events",
    iconName: "badge-regular",
    category: "Events",
    tier: "silver",
    requirement: { type: "attendEvents", count: 10 },
  },
  {
    id: "event_host",
    name: "Event Host",
    description: "Host your first event",
    iconName: "badge-event-host",
    category: "Events",
    tier: "bronze",
    requirement: { type: "hostEvents", count: 1 },
  },

  // Match badges
  {
    id: "first_match",
    name: "First Connection",
    description: "Accept your first match",
    iconName: "badge-first-connection",
    category: "Matching",
    tier: "bronze",
    requirement: { type: "acceptMatches", count: 1 },
  },
  {
    id: "connector",
    name: "Connector",
    description: "Accept 10 matches",
    iconName: "badge-connector",
    category: "Matching",
    tier: "silver",
    requirement: { type: "acceptMatches", count: 10 },
  },

  // Seasonal badges
  {
    id: "spring_bloom",
    name: "Spring Bloom",
    description: "Attend a spring event",
    iconName: "badge-spring-bloom",
    category: "Seasonal",
    tier: "special",
    requirement: { type: "seasonalEvent", season: "spring" },
  },
  {
    id: "summer_sun",
    name: "Summer Sun",
    description: "Attend a summer event",
    iconName: "badge-summer-sun",
    category: "Seasonal",
    tier: "special",
    requirement: { type: "seasonalEvent", season: "summer" },
  },
  {
    id: "fall_harvest",
    name: "Fall Harvest",
    description: "Attend a fall event",
    iconName: "badge-fall-harvest",
    category: "Seasonal",
    tier: "special",
    requirement: { type: "seasonalEvent", season: "fall" },
  },
  {
    id: "winter_cozy",
    name: "Winter Cozy",
    description: "Attend a winter event",
    iconName: "badge-winter-cozy",
    category: "Seasonal",
    tier: "special",
    requirement: { type: "seasonalEvent", season: "winter" },
  },

  // Streak badges
  {
    id: "week_streak",
    name: "Week Warrior",
    description: "7-day activity streak",
    iconName: "badge-week-warrior",
    category: "Streaks",
    tier: "bronze",
    requirement: { type: "activityStreak", days: 7 },
  },
  {
    id: "month_streak",
    name: "Month Master",
    description: "30-day activity streak",
    iconName: "badge-month-master",
    category: "Streaks",
    tier: "gold",
    requirement: { type: "activityStreak", days: 30 },
  },
];
