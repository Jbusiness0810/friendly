import type { UserProfile } from "../context/AuthContext";
import { myCoords, distanceMiles } from "./geolocation";

/**
 * Calculate a compatibility score between two users based on their onboarding preferences.
 * Returns a score from 0 to 100, where 100 = perfect match.
 *
 * Weights:
 * - Shared interests:       35%  (most important — this is what people do together)
 * - Political alignment:    25%  (key identity factor the user specifically requested)
 * - Shared ideal hangouts:  20%  (how they'd spend time)
 * - Same social style:      10%  (spontaneous vs planner)
 * - Overlapping intent:     10%  (what they're looking for)
 */

const WEIGHTS = {
  interests: 35,
  political: 25,
  hangouts: 20,
  socialStyle: 10,
  intent: 10,
};

/** How many items two arrays share in common, as a ratio of the smaller array's length */
function overlapRatio(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const shared = [...setA].filter((x) => setB.has(x)).length;
  // Normalize against the smaller array so having fewer selections isn't penalized
  const minLen = Math.min(setA.size, setB.size);
  return minLen === 0 ? 0 : shared / minLen;
}

/** Political alignment compatibility */
function politicalScore(a: string | null, b: string | null): number {
  // If either declined to say, give a neutral middle score (not penalized, not rewarded)
  if (!a || !b || a === "Rather not say" || b === "Rather not say") {
    return 0.5;
  }

  const spectrum = [
    "progressive",
    "liberal",
    "moderate",
    "conservative",
    "libertarian",
  ];

  const idxA = spectrum.indexOf(a.toLowerCase());
  const idxB = spectrum.indexOf(b.toLowerCase());

  if (idxA === -1 || idxB === -1) return 0.5; // Unknown values get neutral score

  const distance = Math.abs(idxA - idxB);
  // 0 distance = 1.0, 1 = 0.75, 2 = 0.5, 3 = 0.25, 4 = 0.0
  return 1 - distance / (spectrum.length - 1);
}

/**
 * Calculate compatibility score between current user and a candidate.
 */
export function calculateCompatibility(
  me: UserProfile,
  them: UserProfile
): number {
  // Interests overlap (e.g., both like Running, Coffee, Hiking)
  const interestsScore = overlapRatio(me.interests, them.interests);

  // Political alignment
  const polScore = politicalScore(
    me.political_alignment,
    them.political_alignment
  );

  // Ideal hangouts overlap
  const hangoutsScore = overlapRatio(me.ideal_hangouts, them.ideal_hangouts);

  // Social style match (exact match = 1, different = 0, "Bit of both" = 0.5 with anything)
  let styleScore = 0;
  if (me.social_style && them.social_style) {
    if (
      me.social_style.toLowerCase() === them.social_style.toLowerCase()
    ) {
      styleScore = 1;
    } else if (
      me.social_style.toLowerCase() === "bit of both" ||
      them.social_style.toLowerCase() === "bit of both"
    ) {
      styleScore = 0.5;
    }
  }

  // Intent overlap
  const intentScore = overlapRatio(me.intent, them.intent);

  // Weighted total
  const total =
    interestsScore * WEIGHTS.interests +
    polScore * WEIGHTS.political +
    hangoutsScore * WEIGHTS.hangouts +
    styleScore * WEIGHTS.socialStyle +
    intentScore * WEIGHTS.intent;

  return Math.round(total);
}

/**
 * Sort a list of candidate users by compatibility with the current user.
 * Returns users sorted by score descending, with the score attached.
 */
export function rankUsersByCompatibility(
  me: UserProfile,
  candidates: UserProfile[]
): Array<UserProfile & { compatibilityScore: number }> {
  const coords = myCoords();

  return candidates
    .filter((c) => c.id !== me.id) // Exclude self
    .map((candidate) => {
      let score = calculateCompatibility(me, candidate);

      // Proximity boost: up to 10 bonus points for nearby users
      if (coords && candidate.latitude && candidate.longitude) {
        const dist = distanceMiles(
          coords.latitude,
          coords.longitude,
          candidate.latitude,
          candidate.longitude
        );
        // 0 mi → +10, 5 mi → +5, 10+ mi → +0
        score += Math.round(Math.max(0, 10 - dist));
      }

      return { ...candidate, compatibilityScore: score };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}
