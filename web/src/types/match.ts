import type { CircleCategory } from "./circle";

export interface Match {
  id: string;
  userIds: string[];
  matchScore: number;
  sharedInterests: string[];
  sharedCircles: string[];
  matchReason: string;
  status: MatchStatus;
  createdAt: Date;
  respondedAt?: Date;
  conversationId?: string;
}

export type MatchStatus = "pending" | "accepted" | "declined" | "expired";

export const matchStatusLabels: Record<MatchStatus, string> = {
  pending: "New Match",
  accepted: "Connected",
  declined: "Passed",
  expired: "Expired",
};

export interface MatchPreferences {
  maxDistance: number; // miles
  ageRange: { min: number; max: number };
  preferredCategories: CircleCategory[];
  matchFrequency: MatchFrequency;
}

export type MatchFrequency = "daily" | "weekly" | "biweekly";

export const matchFrequencyLabels: Record<MatchFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
};

export function getScorePercentage(match: Match): number {
  return Math.round(match.matchScore * 100);
}

export function getOtherUserId(
  match: Match,
  currentUserId: string
): string | undefined {
  return match.userIds.find((id) => id !== currentUserId);
}
