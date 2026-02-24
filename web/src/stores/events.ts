import { createSignal } from "solid-js";
import type { FriendlyEvent } from "../types";

const mockEvents: FriendlyEvent[] = [
  {
    id: "event_1",
    title: "Morning 5K Run",
    description: "A casual 5K run through the park. All levels welcome!",
    circleId: "circle_1",
    circleName: "Morning Runners",
    hostId: "user_2",
    hostName: "Alex",
    location: { name: "Prospect Park", address: "95 Prospect Park W", latitude: 40.6602, longitude: -73.9690 },
    startDate: new Date("2026-03-01T07:00:00"),
    endDate: new Date("2026-03-01T08:30:00"),
    maxAttendees: 15,
    attendeeIds: ["user_1", "user_2", "user_3"],
    waitlistIds: [],
    category: "Fitness",
    isOutdoor: true,
    cost: { type: "free" },
    createdAt: new Date("2026-02-15"),
    isCancelled: false,
  },
  {
    id: "event_2",
    title: "Book Club: February Pick",
    description: "Discussing 'Tomorrow, and Tomorrow, and Tomorrow'",
    circleId: "circle_2",
    circleName: "Neighborhood Book Club",
    hostId: "user_3",
    hostName: "Maria",
    location: { name: "Café Grumpy", address: "383 7th Ave", latitude: 40.6688, longitude: -73.9802 },
    startDate: new Date("2026-03-05T19:00:00"),
    endDate: new Date("2026-03-05T21:00:00"),
    maxAttendees: 12,
    attendeeIds: ["user_1", "user_3", "user_5"],
    waitlistIds: [],
    category: "Book Club",
    isOutdoor: false,
    cost: { type: "free" },
    createdAt: new Date("2026-02-10"),
    isCancelled: false,
  },
  {
    id: "event_3",
    title: "Pasta Making Workshop",
    description: "Learn to make fresh pasta from scratch!",
    circleId: "circle_3",
    circleName: "Sunday Cooks",
    hostId: "user_4",
    hostName: "Jamie",
    location: { name: "Community Kitchen", address: "210 5th Ave", latitude: 40.6720, longitude: -73.9845 },
    startDate: new Date("2026-03-08T14:00:00"),
    endDate: new Date("2026-03-08T17:00:00"),
    maxAttendees: 8,
    attendeeIds: ["user_2", "user_4", "user_5", "user_6", "user_7"],
    waitlistIds: ["user_8"],
    category: "Food & Cooking",
    isOutdoor: false,
    cost: { type: "fixed", amount: 15 },
    createdAt: new Date("2026-02-12"),
    isCancelled: false,
  },
  {
    id: "event_4",
    title: "Board Game Night",
    description: "Catan, Ticket to Ride, and more. BYOB!",
    circleId: "circle_4",
    circleName: "Park Slope Board Gamers",
    hostId: "user_1",
    hostName: "You",
    location: { name: "The Brew Bar", address: "456 Bergen St", latitude: 40.6810, longitude: -73.9750 },
    startDate: new Date("2026-03-12T19:30:00"),
    endDate: new Date("2026-03-12T23:00:00"),
    maxAttendees: 10,
    attendeeIds: ["user_1", "user_6"],
    waitlistIds: [],
    category: "Games",
    isOutdoor: false,
    cost: { type: "splitEvenly" },
    createdAt: new Date("2026-02-20"),
    isCancelled: false,
  },
];

const [events, setEvents] = createSignal<FriendlyEvent[]>(mockEvents);
const [isLoading, setIsLoading] = createSignal(false);

export function useEvents() {
  async function fetchEvents() {
    setIsLoading(true);
    try {
      // TODO: Fetch from Firebase
    } finally {
      setIsLoading(false);
    }
  }

  function upcomingEvents(): FriendlyEvent[] {
    return events()
      .filter((e) => e.startDate > new Date() && !e.isCancelled)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  function getEventById(id: string): FriendlyEvent | undefined {
    return events().find((e) => e.id === id);
  }

  async function rsvp(eventId: string, userId: string) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        if (e.attendeeIds.length >= e.maxAttendees) {
          return { ...e, waitlistIds: [...e.waitlistIds, userId] };
        }
        return { ...e, attendeeIds: [...e.attendeeIds, userId] };
      })
    );
    // TODO: Update Firebase
  }

  async function cancelRsvp(eventId: string, userId: string) {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const newAttendees = e.attendeeIds.filter((id) => id !== userId);
        const newWaitlist = e.waitlistIds.filter((id) => id !== userId);
        // Promote from waitlist if a spot opened
        if (newAttendees.length < e.attendeeIds.length && newWaitlist.length > 0) {
          const promoted = newWaitlist.shift()!;
          newAttendees.push(promoted);
        }
        return { ...e, attendeeIds: newAttendees, waitlistIds: newWaitlist };
      })
    );
  }

  return {
    events,
    isLoading,
    fetchEvents,
    upcomingEvents,
    getEventById,
    rsvp,
    cancelRsvp,
  };
}
