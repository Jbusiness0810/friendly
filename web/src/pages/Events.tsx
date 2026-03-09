import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import {
  loadGoogleMaps,
  isGoogleMapsLoaded,
  createAutocomplete,
  getPlacePhoto,
  searchPlacePhoto,
  type PlaceResult,
} from "../lib/google-places";

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
  place_id: string | null;
  created_at: string;
  event_rsvps: { count: number }[];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const Events: Component = () => {
  const { user } = useAuth();

  const [events, setEvents] = createSignal<EventRow[]>([]);
  const [myRsvps, setMyRsvps] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [showModal, setShowModal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  // Event detail modal
  const [selectedEvent, setSelectedEvent] = createSignal<EventRow | null>(null);
  const [detailPhoto, setDetailPhoto] = createSignal<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = createSignal(false);

  // Form fields
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [eventDate, setEventDate] = createSignal("");
  const [eventTime, setEventTime] = createSignal("");
  const [capacity, setCapacity] = createSignal("");
  const [price, setPrice] = createSignal("");
  const [placeId, setPlaceId] = createSignal<string | null>(null);

  let locationContainerRef: HTMLDivElement | undefined;

  onMount(async () => {
    loadGoogleMaps().catch(() => {});
    await loadAll();
  });

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

  const toggleRsvp = async (eventId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const myId = user()?.id;
    if (!myId) return;

    const isGoing = myRsvps().has(eventId);

    // Optimistic update
    setMyRsvps((prev) => {
      const next = new Set(prev);
      if (isGoing) next.delete(eventId);
      else next.add(eventId);
      return next;
    });

    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const currentCount = ev.event_rsvps[0]?.count ?? 0;
        const newCount = isGoing ? Math.max(0, currentCount - 1) : currentCount + 1;
        return { ...ev, event_rsvps: [{ count: newCount }] };
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
      setMyRsvps((prev) => {
        const next = new Set(prev);
        if (isGoing) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== eventId) return ev;
          const currentCount = ev.event_rsvps[0]?.count ?? 0;
          const newCount = isGoing ? currentCount + 1 : Math.max(0, currentCount - 1);
          return { ...ev, event_rsvps: [{ count: newCount }] };
        })
      );
      showToast("Failed to update RSVP");
    }
  };

  // -- Event Detail Modal --
  const openEventDetail = async (event: EventRow) => {
    setSelectedEvent(event);
    setDetailPhoto(null);
    setLoadingPhoto(true);

    if (isGoogleMapsLoaded()) {
      let photo: string | null = null;

      // Try place_id first, then location text, then event title
      if (event.place_id) {
        photo = await getPlacePhoto(event.place_id);
      }
      if (!photo && event.location) {
        photo = await searchPlacePhoto(event.location);
      }
      if (!photo && event.title) {
        photo = await searchPlacePhoto(event.title);
      }

      setDetailPhoto(photo);
    }
    setLoadingPhoto(false);
  };

  const closeDetail = () => {
    setSelectedEvent(null);
    setDetailPhoto(null);
  };

  // -- Create Event Form --
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate("");
    setEventTime("");
    setCapacity("");
    setPrice("");
    setPlaceId(null);
  };

  const openCreateModal = () => {
    setShowModal(true);
    // Create autocomplete element after DOM updates
    setTimeout(() => {
      if (locationContainerRef && isGoogleMapsLoaded()) {
        createAutocomplete(locationContainerRef, (place: PlaceResult) => {
          setLocation(place.name + (place.formatted_address ? " — " + place.formatted_address : ""));
          setPlaceId(place.place_id);
        });
      }
    }, 100);
  };

  const handleCreate = async (e: Event) => {
    e.preventDefault();
    const myId = user()?.id;
    if (!myId || !title().trim() || !eventDate()) return;

    setSubmitting(true);

    // Combine date + time (default to 12:00 PM if no time set)
    const timeStr = eventTime() || "12:00";
    const combined = `${eventDate()}T${timeStr}`;

    const payload: Record<string, unknown> = {
      creator_id: myId,
      title: title().trim(),
      description: description().trim() || null,
      location: location().trim() || null,
      date: new Date(combined).toISOString(),
      capacity: capacity() ? parseInt(capacity(), 10) : null,
      price: price().trim() || null,
      place_id: placeId(),
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

  const getRsvpCount = (event: EventRow): number => event.event_rsvps[0]?.count ?? 0;

  const getCapacityDisplay = (event: EventRow): string => {
    const count = getRsvpCount(event);
    if (event.capacity) return `${count}/${event.capacity}`;
    return count > 0 ? `${count} going` : "Open";
  };

  const getPriceDisplay = (event: EventRow): string => {
    if (!event.price || event.price === "0" || event.price.toLowerCase() === "free") return "Free";
    return event.price.startsWith("$") ? event.price : `$${event.price}`;
  };

  return (
    <>
      <div class="nav-header">
        <h1>Events</h1>
        <div
          class="nav-icon"
          style="background:none;font-size:28px;color:var(--primary)"
          onClick={openCreateModal}
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
                  <div class="event-row event-row-clickable" onClick={() => openEventDetail(event)}>
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
                          onClick={(e) => toggleRsvp(event.id, e)}
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

      {/* ========== Event Detail Modal ========== */}
      <Show when={selectedEvent()}>
        {(ev) => {
          const isGoing = () => myRsvps().has(ev().id);
          const isFull = () =>
            ev().capacity != null &&
            getRsvpCount(ev()) >= ev().capacity &&
            !isGoing();

          return (
            <div class="modal-overlay" onClick={closeDetail}>
              <div class="event-detail-sheet" onClick={(e) => e.stopPropagation()}>
                {/* Place photo hero */}
                <div class="event-detail-hero">
                  <Show when={detailPhoto()} fallback={
                    <Show when={loadingPhoto()} fallback={
                      <div class="event-detail-hero-placeholder">
                        <span>📍</span>
                        <span>{ev().location ?? "Event"}</span>
                      </div>
                    }>
                      <div class="event-detail-hero-placeholder">
                        <div class="loading-spinner" />
                      </div>
                    </Show>
                  }>
                    <img src={detailPhoto()!} alt={ev().location ?? ev().title} class="event-detail-hero-img" />
                  </Show>
                  <button class="event-detail-close" onClick={closeDetail}>✕</button>
                </div>

                <div class="event-detail-body">
                  <h2 class="event-detail-title">{ev().title}</h2>

                  <div class="event-detail-row">
                    <span class="event-detail-icon">📅</span>
                    <div>
                      <div class="event-detail-label">{formatFullDate(ev().date)}</div>
                      <div class="event-detail-sub">{formatTime(ev().date)}</div>
                    </div>
                  </div>

                  <Show when={ev().location}>
                    <div class="event-detail-row">
                      <span class="event-detail-icon">📍</span>
                      <div>
                        <div class="event-detail-label">{ev().location}</div>
                      </div>
                    </div>
                  </Show>

                  <div class="event-detail-row">
                    <span class="event-detail-icon">👥</span>
                    <div>
                      <div class="event-detail-label">{getCapacityDisplay(ev())}</div>
                    </div>
                  </div>

                  <div class="event-detail-row">
                    <span class="event-detail-icon">💰</span>
                    <div>
                      <div class="event-detail-label">{getPriceDisplay(ev())}</div>
                    </div>
                  </div>

                  <Show when={ev().description}>
                    <div class="event-detail-description">
                      {ev().description}
                    </div>
                  </Show>

                  <Show when={user()}>
                    <button
                      class={`event-detail-rsvp ${isGoing() ? "event-detail-rsvp-going" : isFull() ? "event-detail-rsvp-full" : ""}`}
                      onClick={() => toggleRsvp(ev().id)}
                      disabled={isFull()}
                    >
                      {isGoing() ? "✓ Going" : isFull() ? "Full" : "RSVP to this event"}
                    </button>
                  </Show>
                </div>
              </div>
            </div>
          );
        }}
      </Show>

      {/* ========== Create Event Bottom Sheet ========== */}
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
                <Show when={isGoogleMapsLoaded()} fallback={
                  <input
                    type="text"
                    value={location()}
                    onInput={(e) => {
                      setLocation(e.currentTarget.value);
                      setPlaceId(null);
                    }}
                    placeholder="Type a location..."
                    autocomplete="off"
                  />
                }>
                  <div ref={locationContainerRef} class="places-autocomplete-container" />
                </Show>
              </div>
              <div class="sheet-row">
                <div class="sheet-field" style="flex:1.2">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={eventDate()}
                    onInput={(e) => setEventDate(e.currentTarget.value)}
                    required
                  />
                </div>
                <div class="sheet-field" style="flex:0.8">
                  <label>Time</label>
                  <input
                    type="time"
                    value={eventTime()}
                    onInput={(e) => setEventTime(e.currentTarget.value)}
                  />
                </div>
              </div>
              <div class="sheet-row">
                <div class="sheet-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity()}
                    onInput={(e) => setCapacity(e.currentTarget.value)}
                    placeholder="No limit"
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
                  disabled={submitting() || !title().trim() || !eventDate()}
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
