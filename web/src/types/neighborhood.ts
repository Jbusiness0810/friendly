export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMiles: number;
  memberCount: number;
  circleCount: number;
  activeEventCount: number;
  description: string;
  imageURL?: string;
}

export type ActivityLevel = "Quiet" | "Moderate" | "Active" | "Thriving";

export function getActivityLevel(neighborhood: Neighborhood): ActivityLevel {
  const score =
    neighborhood.memberCount +
    neighborhood.circleCount * 5 +
    neighborhood.activeEventCount * 10;
  if (score < 20) return "Quiet";
  if (score < 50) return "Moderate";
  if (score < 100) return "Active";
  return "Thriving";
}

export function getFullLocationName(neighborhood: Neighborhood): string {
  return `${neighborhood.name}, ${neighborhood.city}`;
}

export const activityLevelColors: Record<ActivityLevel, string> = {
  Quiet: "#9E9E9E",
  Moderate: "#FF9800",
  Active: "#4CAF50",
  Thriving: "#2196F3",
};
