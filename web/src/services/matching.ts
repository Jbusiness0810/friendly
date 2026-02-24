import type { FriendlyUser, Availability } from "../types";

export interface MatchResult {
  score: number;
  sharedInterests: string[];
  sharedCircleIds: string[];
  reason: string;
}

/**
 * Calculate match score between two users based on shared interests,
 * circles, availability overlap, and proximity.
 *
 * Scoring:
 *   Interest overlap:    0–40 points
 *   Circle overlap:      0–30 points
 *   Availability match:  0–20 points
 *   Same neighborhood:   0–10 points
 */
export function calculateMatchScore(
  user1: FriendlyUser,
  user2: FriendlyUser
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Interest overlap (0-40 points)
  const set1 = new Set(user1.interests);
  const sharedInterests = user2.interests.filter((i) => set1.has(i));
  const interestScore = Math.min(sharedInterests.length * 10, 40);
  score += interestScore;
  if (sharedInterests.length > 0) {
    reasons.push(
      `You share ${sharedInterests.length} interest${sharedInterests.length === 1 ? "" : "s"}`
    );
  }

  // Circle overlap (0-30 points)
  const circleSet1 = new Set(user1.circleIds);
  const sharedCircles = user2.circleIds.filter((c) => circleSet1.has(c));
  const circleScore = Math.min(sharedCircles.length * 15, 30);
  score += circleScore;
  if (sharedCircles.length > 0) {
    reasons.push(
      `You're in ${sharedCircles.length} circle${sharedCircles.length === 1 ? "" : "s"} together`
    );
  }

  // Availability overlap (0-20 points)
  const availabilityScore = calculateAvailabilityOverlap(
    user1.availability,
    user2.availability
  );
  score += availabilityScore * 20;
  if (availabilityScore > 0.5) {
    reasons.push("Your schedules align well");
  }

  // Same neighborhood bonus (0-10 points)
  if (
    user1.neighborhoodId &&
    user1.neighborhoodId === user2.neighborhoodId
  ) {
    score += 10;
    reasons.push("You're in the same neighborhood");
  }

  const normalizedScore = Math.min(score / 100, 1);

  return {
    score: normalizedScore,
    sharedInterests,
    sharedCircleIds: sharedCircles,
    reason: reasons.join(" · "),
  };
}

function calculateAvailabilityOverlap(a1: Availability, a2: Availability): number {
  let matches = 0;
  const total = 6;

  if (a1.weekdayMornings && a2.weekdayMornings) matches++;
  if (a1.weekdayAfternoons && a2.weekdayAfternoons) matches++;
  if (a1.weekdayEvenings && a2.weekdayEvenings) matches++;
  if (a1.weekendMornings && a2.weekendMornings) matches++;
  if (a1.weekendAfternoons && a2.weekendAfternoons) matches++;
  if (a1.weekendEvenings && a2.weekendEvenings) matches++;

  return matches / total;
}

/** Generate top matches for a user from a list of candidates. */
export function generateMatches(
  user: FriendlyUser,
  candidates: FriendlyUser[],
  maxMatches = 5
): MatchResult[] {
  return candidates
    .filter((c) => c.id !== user.id)
    .map((c) => calculateMatchScore(user, c))
    .filter((r) => r.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMatches);
}
