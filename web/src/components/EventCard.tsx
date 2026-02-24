import type { Component } from "solid-js";
import type { FriendlyEvent } from "../types";
import { formatEventCost } from "../types";

/** Compact event row for lists and the Home feed. */
export const EventRow: Component<{ event: FriendlyEvent; onClick?: () => void }> = (props) => {
  const month = () =>
    props.event.startDate.toLocaleDateString("en-US", { month: "short" });
  const day = () =>
    props.event.startDate.toLocaleDateString("en-US", { day: "numeric" });

  return (
    <div
      class="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={props.onClick}
    >
      {/* Date badge */}
      <div class="flex flex-col items-center w-12 shrink-0">
        <span class="text-xs text-green-600 font-medium uppercase">{month()}</span>
        <span class="text-xl font-bold">{day()}</span>
      </div>

      {/* Event info */}
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold truncate">{props.event.title}</h3>
        <p class="text-xs text-gray-500 truncate">{props.event.location.name}</p>
        <div class="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
          <span>👥</span>
          <span>
            {props.event.attendeeIds.length}/{props.event.maxAttendees}
          </span>
        </div>
      </div>

      {/* Cost pill */}
      <span class="text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 rounded-md shrink-0">
        {formatEventCost(props.event.cost)}
      </span>
    </div>
  );
};

/** Larger event card with more details for detail/browse views. */
export const EventCard: Component<{
  event: FriendlyEvent;
  isAttending?: boolean;
  onRsvp?: () => void;
  onCancel?: () => void;
  onClick?: () => void;
}> = (props) => {
  const timeRange = () => {
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${fmt(props.event.startDate)} – ${fmt(props.event.endDate)}`;
  };

  return (
    <div
      class="p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={props.onClick}
    >
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-semibold">{props.event.title}</h3>
          {props.event.circleName && (
            <span class="text-xs text-green-600">{props.event.circleName}</span>
          )}
        </div>
        <span class="text-xs font-medium px-2.5 py-1 bg-green-50 text-green-700 rounded-md">
          {formatEventCost(props.event.cost)}
        </span>
      </div>

      <p class="text-sm text-gray-600 mb-3">{props.event.description}</p>

      <div class="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
        <span>📅 {props.event.startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
        <span>⏰ {timeRange()}</span>
        <span>📍 {props.event.location.name}</span>
        <span>👥 {props.event.attendeeIds.length}/{props.event.maxAttendees}</span>
        {props.event.isOutdoor && <span>🌿 Outdoor</span>}
      </div>

      {props.event.waitlistIds.length > 0 && (
        <p class="text-xs text-amber-600 mb-3">
          {props.event.waitlistIds.length} on waitlist
        </p>
      )}

      {props.isAttending ? (
        <button
          class="w-full text-sm py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          onClick={(e) => { e.stopPropagation(); props.onCancel?.(); }}
        >
          Cancel RSVP
        </button>
      ) : (
        <button
          class="w-full text-sm py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
          onClick={(e) => { e.stopPropagation(); props.onRsvp?.(); }}
        >
          {props.event.attendeeIds.length >= props.event.maxAttendees
            ? "Join Waitlist"
            : "RSVP"}
        </button>
      )}
    </div>
  );
};
