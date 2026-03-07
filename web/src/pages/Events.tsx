import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";

interface EventRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location: string | null;
  date: string;
  capacity: number | null;
  price: string | null;
  image_url: string | null;
  created_at: string;
  event_rsvps: { count: number }[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const Events: Component = () => {
  const { user } = useAuth();

  const [events, setEvents] = createSignal<EventRow[]>([]);
  const [myRsvps, setMyRsvps] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [showModal, setShowModal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  // Form fields
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [date, setDate] = createSignal("");
  const [capacity, setCapacity] = createSignal("");
  const [price, setPrice] = createSignal("");

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*, event_rsvps(count)")
      .order("date", { ascending: true })
      .gte("date", new Date().toISOString());

    if (error) {
      showToast("Failed to load events");
      return;
    }
    setEvents((data as EventRow[]) ?? []);
  };

  const fetchMyRsvps = async () => {
    const myId = user()?.id;
    if (!myId) return;
    const { data } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("user_id", myId);

    const ids = new Set((data ?? []).map((r: { event_id: string }) => r.event_id));
    setMyRsvps(ids);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchMyRsvps()]);
    setLoading(false);
  };

  onMount(() => {
    loadAll();
  });

  const toggleRsvp = async (eventId: string) => {
    const myId = user()?.id;
    if (!myId) return;

    const isGoing = myRsvps().has(eventId);

    // Optimistic update
    setMyRsvps((prev) => {
      const next = new Set(prev);
      if (isGoing) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });

    // Optimistic count update
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const currentCount = e.event_rsvps[0]?.count ?? 0;
        const newCount = isGoing ? Math.max(0, currentCount - 1) : currentCount + 1;
        return { ...e, event_rsvps: [{ count: newCount }] };
      })
    );

    let error;
    if (isGoing) {
      ({ error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", myId));
    } else {
      ({ error } = await supabase
        .from("event_rsvps")
        .insert({ event_id: eventId, user_id: myId }));
    }

    if (error) {
      // Revert optimistic updates
      setMyRsvps((prev) => {
        const next = new Set(prev);
        if (isGoing) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((e) => {
          if (e.id !== eventId) return e;
          const currentCount = e.event_rsvps[0]?.count ?? 0;
          const newCount = isGoing ? currentCount + 1 : Math.max(0, currentCount - 1);
          return { ...e, event_rsvps: [{ count: newCount }] };
        })
      );
      showToast("Failed to update RSVP");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setDate("");
    setCapacity("");
    setPrice("");
  };

  const handleCreate = async (e: Event) => {
    e.preventDefault();
    const myId = user()?.id;
    if (!myId || !title().trim() || !date()) return;

    setSubmitting(true);

    const payload: Record<string, unknown> = {
      creator_id: myId,
      title: title().trim(),
      description: description().trim() || null,
      location: location().trim() || null,
      date: new Date(date()).toISOString(),
      capacity: capacity() ? parseInt(capacity(), 10) : null,
      price: price().trim() || null,
    };

    const { error } = await supabase.from("events").insert(payload);

    if (error) {
      showToast("Failed to create event");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowModal(false);
    resetForm();
    await loadAll();
  };

  const getRsvpCount = (event: EventRow): number => {
    return event.event_rsvps[0]?.count ?? 0;
  };

  const getCapacityDisplay = (event: EventRow): string => {
    const count = getRsvpCount(event);
    if (event.capacity) {
      return `${count}/${event.capacity}`;
    }
    return count > 0 ? `${count} going` : "Open";
  };

  const getPriceDisplay = (event: EventRow): string => {
    if (!event.price || event.price === "0" || event.price.toLowerCase() === "free") {
      return "Free";
    }
    // If price already has $, use as-is; otherwise prepend $
    return event.price.startsWith("$") ? event.price : `$${event.price}`;
  };

  return (
    <>
      <div class="nav-header">
        <h1>Events</h1>
        <div
          class="nav-icon"
          style="background:none;font-size:28px;color:var(--primary)"
          onClick={() => setShowModal(true)}
        >
          +
        </div>
      </div>

      <Show when={!loading()} fallback={
        <div style="display:flex;justify-content:center;padding:60px 0">
          <div class="loading-spinner" />
        </div>
      }>
        <Show when={events().length > 0} fallback={
          <div class="empty-state">
            No upcoming events.<br />Create one!
          </div>
        }>
          <div>
            <For each={events()}>
              {(event) => {
                const d = new Date(event.date);
                const month = MONTHS[d.getMonth()];
                const day = d.getDate();
                const isGoing = () => myRsvps().has(event.id);
                const isFull = () =>
                  event.capacity != null &&
                  getRsvpCount(event) >= event.capacity &&
                  !isGoing();

                return (
                  <div class="event-row">
                    <div class="event-date">
                      <div class="month">{month}</div>
                      <div class="day">{day}</div>
                    </div>
                    <div class="event-info">
                      <h3>{event.title}</h3>
                      <div class="meta">
                        {event.location ? `${event.location} · ` : ""}
                        {formatTime(event.date)}
                      </div>
                      <div class="meta">{getCapacityDisplay(event)}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                      <div class="event-badge">{getPriceDisplay(event)}</div>
                      <Show when={user()}>
                        <button
                          class={`rsvp-btn ${isGoing() ? "rsvp-btn-going" : isFull() ? "rsvp-btn-full" : "rsvp-btn-default"}`}
                          onClick={() => toggleRsvp(event.id)}
                          disabled={isFull()}
                        >
                          {isGoing() ? "Going" : isFull() ? "Full" : "RSVP"}
                        </button>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>

      {/* Create Event Bottom Sheet */}
      <Show when={showModal()}>
        <div class="modal-overlay" onClick={() => setShowModal(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>New Event</h2>
            <form onSubmit={handleCreate}>
              <div class="sheet-field">
                <label>Title *</label>
                <input
                  type="text"
                  value={title()}
                  onInput={(e) => setTitle(e.currentTarget.value)}
                  placeholder="What's happening?"
                  required
                />
              </div>
              <div class="sheet-field">
                <label>Description</label>
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  placeholder="Tell people more..."
                />
              </div>
              <div class="sheet-field">
                <label>Location</label>
                <input
                  type="text"
                  value={location()}
                  onInput={(e) => setLocation(e.currentTarget.value)}
                  placeholder="Where is it?"
                />
              </div>
              <div class="sheet-field">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  value={date()}
                  onInput={(e) => setDate(e.currentTarget.value)}
                  required
                />
              </div>
              <div class="sheet-row">
                <div class="sheet-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity()}
                    onInput={(e) => setCapacity(e.currentTarget.value)}
                    placeholder="Unlimited"
                  />
                </div>
                <div class="sheet-field">
                  <label>Price</label>
                  <input
                    type="text"
                    value={price()}
                    onInput={(e) => setPrice(e.currentTarget.value)}
                    placeholder="Free"
                  />
                </div>
              </div>
              <div class="sheet-actions">
                <button
                  type="button"
                  class="sheet-btn sheet-btn-cancel"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="sheet-btn sheet-btn-submit"
                  disabled={submitting() || !title().trim() || !date()}
                >
                  {submitting() ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </>
  );
};

export default Events;
