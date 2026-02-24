import { createSignal } from "solid-js";
import type { Match, FriendlyUser } from "../types";

const mockMatches: Match[] = [
  {
    id: "match_1",
    userIds: ["user_1", "user_9"],
    matchScore: 0.87,
    sharedInterests: ["running", "cooking", "reading"],
    sharedCircles: ["Morning Runners"],
    matchReason: "You share 3 interests · You're in 1 circle together · Your schedules align well",
    status: "pending",
    createdAt: new Date("2026-02-22"),
  },
  {
    id: "match_2",
    userIds: ["user_1", "user_10"],
    matchScore: 0.72,
    sharedInterests: ["board games", "tech"],
    sharedCircles: [],
    matchReason: "You share 2 interests · You're in the same neighborhood",
    status: "pending",
    createdAt: new Date("2026-02-21"),
  },
  {
    id: "match_3",
    userIds: ["user_1", "user_11"],
    matchScore: 0.65,
    sharedInterests: ["dogs", "outdoors"],
    sharedCircles: ["Dog Park Regulars"],
    matchReason: "You share 2 interests · You're in 1 circle together",
    status: "pending",
    createdAt: new Date("2026-02-20"),
  },
  {
    id: "match_4",
    userIds: ["user_1", "user_12"],
    matchScore: 0.91,
    sharedInterests: ["cooking", "books", "fitness", "outdoors"],
    sharedCircles: ["Morning Runners", "Sunday Cooks"],
    matchReason: "You share 4 interests · You're in 2 circles together · Your schedules align well · You're in the same neighborhood",
    status: "accepted",
    createdAt: new Date("2026-02-10"),
    respondedAt: new Date("2026-02-11"),
  },
];

const mockMatchedUsers: Record<string, FriendlyUser> = {
  user_9: {
    id: "user_9",
    email: "sam@example.com",
    displayName: "Sam Rivera",
    bio: "Runner, foodie, always looking for a good book",
    interests: ["running", "cooking", "reading", "yoga"],
    circleIds: ["circle_1"],
    badges: ["first_circle", "first_event"],
    points: 85,
    level: 1,
    joinedAt: new Date("2025-11-01"),
    lastActiveAt: new Date("2026-02-22"),
    hasCompletedOnboarding: true,
    availability: { weekdayMornings: true, weekdayAfternoons: false, weekdayEvenings: true, weekendMornings: true, weekendAfternoons: true, weekendEvenings: false },
    notificationPreferences: { newMatches: true, circleActivity: true, eventReminders: true, badges: true, weeklyDigest: true },
  },
  user_10: {
    id: "user_10",
    email: "jordan@example.com",
    displayName: "Jordan Lee",
    bio: "Tech nerd and board game enthusiast",
    interests: ["board games", "tech", "coffee", "music"],
    circleIds: [],
    badges: [],
    points: 20,
    level: 1,
    joinedAt: new Date("2026-01-15"),
    lastActiveAt: new Date("2026-02-21"),
    hasCompletedOnboarding: true,
    availability: { weekdayMornings: false, weekdayAfternoons: false, weekdayEvenings: true, weekendMornings: false, weekendAfternoons: true, weekendEvenings: true },
    notificationPreferences: { newMatches: true, circleActivity: true, eventReminders: true, badges: true, weeklyDigest: false },
  },
  user_11: {
    id: "user_11",
    email: "riley@example.com",
    displayName: "Riley Chen",
    bio: "Dog mom. Nature lover. Weekend warrior.",
    interests: ["dogs", "outdoors", "hiking", "photography"],
    circleIds: ["circle_5"],
    badges: ["first_circle"],
    points: 45,
    level: 1,
    joinedAt: new Date("2025-12-20"),
    lastActiveAt: new Date("2026-02-20"),
    hasCompletedOnboarding: true,
    availability: { weekdayMornings: true, weekdayAfternoons: false, weekdayEvenings: false, weekendMornings: true, weekendAfternoons: true, weekendEvenings: false },
    notificationPreferences: { newMatches: true, circleActivity: true, eventReminders: true, badges: true, weeklyDigest: true },
  },
  user_12: {
    id: "user_12",
    email: "casey@example.com",
    displayName: "Casey Park",
    bio: "New to the neighborhood. Looking to make friends!",
    interests: ["cooking", "books", "fitness", "outdoors"],
    circleIds: ["circle_1", "circle_3"],
    badges: ["first_circle", "social_butterfly"],
    points: 210,
    level: 3,
    joinedAt: new Date("2025-10-01"),
    lastActiveAt: new Date("2026-02-23"),
    hasCompletedOnboarding: true,
    availability: { weekdayMornings: true, weekdayAfternoons: false, weekdayEvenings: true, weekendMornings: true, weekendAfternoons: true, weekendEvenings: true },
    notificationPreferences: { newMatches: true, circleActivity: true, eventReminders: true, badges: true, weeklyDigest: true },
  },
};

const [matches, setMatches] = createSignal<Match[]>(mockMatches);
const [matchedUsers] = createSignal<Record<string, FriendlyUser>>(mockMatchedUsers);
const [currentMatchIndex, setCurrentMatchIndex] = createSignal(0);
const [isLoading, setIsLoading] = createSignal(false);

export function useMatches() {
  function pendingMatches(): Match[] {
    return matches().filter((m) => m.status === "pending");
  }

  function acceptedMatches(): Match[] {
    return matches().filter((m) => m.status === "accepted");
  }

  async function respondToMatch(matchId: string, accept: boolean) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: accept ? "accepted" as const : "declined" as const, respondedAt: new Date() }
          : m
      )
    );
    // TODO: Update Firebase
  }

  function nextMatch() {
    setCurrentMatchIndex((i) => i + 1);
  }

  function getMatchedUser(userId: string): FriendlyUser | undefined {
    return matchedUsers()[userId];
  }

  return {
    matches,
    matchedUsers,
    currentMatchIndex,
    isLoading,
    pendingMatches,
    acceptedMatches,
    respondToMatch,
    nextMatch,
    getMatchedUser,
  };
}
