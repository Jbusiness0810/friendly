import type { CircleCategory } from "./circle";

export interface FriendlyEvent {
  id: string;
  title: string;
  description: string;
  circleId?: string;
  circleName?: string;
  hostId: string;
  hostName: string;
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  maxAttendees: number;
  attendeeIds: string[];
  waitlistIds: string[];
  category: CircleCategory;
  imageURL?: string;
  isOutdoor: boolean;
  cost: EventCost;
  createdAt: Date;
  isCancelled: boolean;
}

export interface EventLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type EventCost =
  | { type: "free" }
  | { type: "fixed"; amount: number }
  | { type: "splitEvenly" };

export function formatEventCost(cost: EventCost): string {
  switch (cost.type) {
    case "free":
      return "Free";
    case "fixed":
      return `$${cost.amount.toFixed(0)}`;
    case "splitEvenly":
      return "Split evenly";
  }
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function isEventUpcoming(event: FriendlyEvent): boolean {
  return event.startDate > new Date();
}

export function isEventFull(event: FriendlyEvent): boolean {
  return event.attendeeIds.length >= event.maxAttendees;
}
