import { createSignal, For, Show, type Component } from "solid-js";
import { useAuth } from "../stores/auth";
import { useEvents } from "../stores/events";
import { EventCard } from "../components/EventCard";

const EventsPage: Component = () => {
  const { currentUser } = useAuth();
  const { upcomingEvents, rsvp, cancelRsvp } = useEvents();
  const [tab, setTab] = createSignal<"upcoming" | "my">("upcoming");

  const displayEvents = () => {
    const all = upcomingEvents();
    if (tab() === "my") {
      const userId = currentUser()?.id ?? "";
      return all.filter(
        (e) => e.attendeeIds.includes(userId) || e.waitlistIds.includes(userId)
      );
    }
    return all;
  };

  const isAttending = (eventId: string) => {
    const e = upcomingEvents().find((ev) => ev.id === eventId);
    if (!e) return false;
    const userId = currentUser()?.id ?? "";
    return e.attendeeIds.includes(userId);
  };

  return (
    <div class="flex flex-col gap-4 pb-6">
      <div class="px-4 pt-2">
        <h1 class="text-2xl font-bold">Events</h1>
        <p class="text-sm text-gray-500 mt-1">What's happening nearby</p>
      </div>

      {/* Tabs */}
      <div class="flex px-4 gap-1 bg-gray-100 rounded-lg mx-4 p-1">
        <button
          class="flex-1 py-2 text-sm rounded-md font-medium transition-colors"
          classList={{
            "bg-white shadow-sm": tab() === "upcoming",
            "text-gray-500": tab() !== "upcoming",
          }}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          class="flex-1 py-2 text-sm rounded-md font-medium transition-colors"
          classList={{
            "bg-white shadow-sm": tab() === "my",
            "text-gray-500": tab() !== "my",
          }}
          onClick={() => setTab("my")}
        >
          My Events
        </button>
      </div>

      {/* Event list */}
      <div class="flex flex-col gap-3 px-4">
        <Show
          when={displayEvents().length > 0}
          fallback={
            <div class="text-center py-12 text-gray-400">
              <p class="text-4xl mb-2">📅</p>
              <p class="font-medium">
                {tab() === "my" ? "No events yet" : "No upcoming events"}
              </p>
              <p class="text-sm">
                {tab() === "my"
                  ? "RSVP to an event to see it here"
                  : "Check back soon!"}
              </p>
            </div>
          }
        >
          <For each={displayEvents()}>
            {(event) => (
              <EventCard
                event={event}
                isAttending={isAttending(event.id)}
                onRsvp={() => rsvp(event.id, currentUser()?.id ?? "")}
                onCancel={() => cancelRsvp(event.id, currentUser()?.id ?? "")}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default EventsPage;
