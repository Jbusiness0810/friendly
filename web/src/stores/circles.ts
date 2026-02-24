import { createSignal } from "solid-js";
import type { Circle, CircleCategory } from "../types";

// Mock data for development
const mockCircles: Circle[] = [
  {
    id: "circle_1",
    name: "Morning Runners",
    description: "Early morning running group for all levels",
    category: "Fitness",
    iconName: "figure.run",
    neighborhoodId: "hood_1",
    creatorId: "user_2",
    memberIds: ["user_1", "user_2", "user_3", "user_4"],
    maxMembers: 20,
    isPublic: true,
    tags: ["running", "fitness", "outdoors"],
    createdAt: new Date("2025-12-01"),
    nextEventDate: new Date("2026-03-01"),
  },
  {
    id: "circle_2",
    name: "Neighborhood Book Club",
    description: "Monthly reads and cozy discussions",
    category: "Book Club",
    iconName: "book.fill",
    neighborhoodId: "hood_1",
    creatorId: "user_3",
    memberIds: ["user_1", "user_3", "user_5"],
    maxMembers: 12,
    isPublic: true,
    tags: ["books", "reading", "discussions"],
    createdAt: new Date("2025-11-15"),
  },
  {
    id: "circle_3",
    name: "Sunday Cooks",
    description: "Cook together every Sunday and share recipes",
    category: "Food & Cooking",
    iconName: "fork.knife",
    neighborhoodId: "hood_1",
    creatorId: "user_4",
    memberIds: ["user_2", "user_4", "user_5", "user_6", "user_7"],
    maxMembers: 15,
    isPublic: true,
    tags: ["cooking", "food", "recipes", "social"],
    createdAt: new Date("2025-10-20"),
  },
  {
    id: "circle_4",
    name: "Park Slope Board Gamers",
    description: "Weekly board game nights — beginners welcome!",
    category: "Games",
    iconName: "gamecontroller.fill",
    neighborhoodId: "hood_1",
    creatorId: "user_1",
    memberIds: ["user_1", "user_6"],
    maxMembers: 10,
    isPublic: true,
    tags: ["board games", "games", "social"],
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "circle_5",
    name: "Dog Park Regulars",
    description: "For those who frequent the neighborhood dog park",
    category: "Pets",
    iconName: "pawprint.fill",
    neighborhoodId: "hood_1",
    creatorId: "user_5",
    memberIds: ["user_3", "user_5", "user_7", "user_8"],
    maxMembers: 30,
    isPublic: true,
    tags: ["dogs", "pets", "outdoors"],
    createdAt: new Date("2025-09-05"),
  },
];

const [circles, setCircles] = createSignal<Circle[]>(mockCircles);
const [isLoading, setIsLoading] = createSignal(false);

export function useCircles() {
  async function fetchCircles(neighborhoodId?: string) {
    setIsLoading(true);
    try {
      // TODO: Fetch from Firebase
      // For now, use mock data filtered by neighborhood
      if (neighborhoodId) {
        setCircles(mockCircles.filter((c) => c.neighborhoodId === neighborhoodId));
      }
    } finally {
      setIsLoading(false);
    }
  }

  function getCirclesByCategory(category: CircleCategory): Circle[] {
    return circles().filter((c) => c.category === category);
  }

  function getCircleById(id: string): Circle | undefined {
    return circles().find((c) => c.id === id);
  }

  async function joinCircle(circleId: string, userId: string) {
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, memberIds: [...c.memberIds, userId] }
          : c
      )
    );
    // TODO: Update Firebase
  }

  async function leaveCircle(circleId: string, userId: string) {
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, memberIds: c.memberIds.filter((id) => id !== userId) }
          : c
      )
    );
    // TODO: Update Firebase
  }

  return {
    circles,
    isLoading,
    fetchCircles,
    getCirclesByCategory,
    getCircleById,
    joinCircle,
    leaveCircle,
  };
}
