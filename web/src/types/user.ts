export interface FriendlyUser {
  id: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  bio: string;
  interests: string[];
  neighborhoodId?: string;
  location?: { latitude: number; longitude: number };
  circleIds: string[];
  badges: string[];
  points: number;
  level: number;
  joinedAt: Date;
  lastActiveAt: Date;
  hasCompletedOnboarding: boolean;
  availability: Availability;
  notificationPreferences: NotificationPreferences;
}

export interface Availability {
  weekdayMornings: boolean;
  weekdayAfternoons: boolean;
  weekdayEvenings: boolean;
  weekendMornings: boolean;
  weekendAfternoons: boolean;
  weekendEvenings: boolean;
}

export interface NotificationPreferences {
  newMatches: boolean;
  circleActivity: boolean;
  eventReminders: boolean;
  badges: boolean;
  weeklyDigest: boolean;
}

export function getUserInitials(displayName: string): string {
  const parts = displayName.split(" ");
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : "";
  return `${first}${last}`.toUpperCase();
}

export const defaultAvailability: Availability = {
  weekdayMornings: false,
  weekdayAfternoons: false,
  weekdayEvenings: true,
  weekendMornings: true,
  weekendAfternoons: true,
  weekendEvenings: true,
};

export const defaultNotificationPreferences: NotificationPreferences = {
  newMatches: true,
  circleActivity: true,
  eventReminders: true,
  badges: true,
  weeklyDigest: true,
};
