import type { BadgeTier } from "../types";

/** Point values for actions in the Friendly app. */
export const PointValues = {
  joinCircle: 10,
  createCircle: 25,
  attendEvent: 15,
  hostEvent: 30,
  acceptMatch: 10,
  dailyLogin: 5,
  completeProfile: 20,
} as const;

/** Level thresholds — index is the level (1-indexed). */
const LEVEL_THRESHOLDS = [0, 0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 1; i--) {
    if (points >= LEVEL_THRESHOLDS[i]!) return i;
  }
  return 1;
}

export function pointsToNextLevel(points: number): {
  current: number;
  needed: number;
  progress: number;
} {
  const currentLevel = calculateLevel(points);
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel]!;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? (points - currentThreshold) / range : 1;

  return { current: points - currentThreshold, needed: range, progress };
}

export function badgePoints(tier: BadgeTier): number {
  switch (tier) {
    case "bronze":
      return 25;
    case "silver":
      return 50;
    case "gold":
      return 100;
    case "special":
      return 75;
  }
}

export function currentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

export function seasonalActivities(): string[] {
  switch (currentSeason()) {
    case "spring":
      return ["Cherry blossom walk", "Community garden planting", "Outdoor yoga", "Farmers market"];
    case "summer":
      return ["Rooftop hangout", "Beach volleyball", "Ice cream social", "Sunset picnic"];
    case "fall":
      return ["Apple picking", "Fall foliage hike", "Pumpkin carving", "Book club by the fire"];
    case "winter":
      return ["Hot cocoa meetup", "Ice skating", "Holiday cookie swap", "Board game night"];
    default:
      return [];
  }
}
