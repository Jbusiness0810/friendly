export interface Circle {
  id: string;
  name: string;
  description: string;
  category: CircleCategory;
  iconName: string;
  coverImageURL?: string;
  neighborhoodId: string;
  creatorId: string;
  memberIds: string[];
  maxMembers: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  nextEventDate?: Date;
}

export type CircleCategory =
  | "Fitness"
  | "Food & Cooking"
  | "Book Club"
  | "Games"
  | "Outdoors"
  | "Arts & Crafts"
  | "Music"
  | "Tech"
  | "Pets"
  | "Parents"
  | "Wellness"
  | "Social"
  | "Volunteer"
  | "Other";

export const circleCategoryIcons: Record<CircleCategory, string> = {
  Fitness: "🏃",
  "Food & Cooking": "🍴",
  "Book Club": "📚",
  Games: "🎮",
  Outdoors: "🌿",
  "Arts & Crafts": "🎨",
  Music: "🎵",
  Tech: "💻",
  Pets: "🐾",
  Parents: "👨‍👩‍👧",
  Wellness: "❤️",
  Social: "☕",
  Volunteer: "🤝",
  Other: "⭐",
};

export const allCircleCategories: CircleCategory[] = [
  "Fitness",
  "Food & Cooking",
  "Book Club",
  "Games",
  "Outdoors",
  "Arts & Crafts",
  "Music",
  "Tech",
  "Pets",
  "Parents",
  "Wellness",
  "Social",
  "Volunteer",
  "Other",
];

export function getMemberCount(circle: Circle): number {
  return circle.memberIds.length;
}

export function isCircleFull(circle: Circle): boolean {
  return circle.memberIds.length >= circle.maxMembers;
}
