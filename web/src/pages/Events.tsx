import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import { getSuggestedEvents, type SuggestedEvent } from "../lib/suggested-events";
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
  visibility: string | null;
  created_at: string;
  event_rsvps: { count: number }[];
}

interface FriendProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface AttendeeProfile {
  id: string;
  name: string;
  avatar_url: string | null;
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

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const Events: Component = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = createSignal<EventRow[]>([]);
  const [myRsvps, setMyRsvps] = createSignal<Set<string>>(new Set());
  const [loading, setLoading] = createSignal(true);
  const [suggested, setSuggested] = createSignal<SuggestedEvent[]>([]);
  const [loadingSuggested, setLoadingSuggested] = createSignal(false);
  const [joiningSuggested, setJoiningSuggested] = createSignal<string | null>(null);
  const [showModal, setShowModal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  // Event detail modal
  const [selectedEvent, setSelectedEvent] = createSignal<EventRow | null>(null);
  const [detailPhoto, setDetailPhoto] = createSignal<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = createSignal(false);
  const [attendees, setAttendees] = createSignal<AttendeeProfile[]>([]);
  const [eventConvoId, setEventConvoId] = createSignal<string | null>(null);

  // Form fields
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [location, setLocation] = createSignal("");
  const [eventDate, setEventDate] = createSignal("");
  const [eventTime, setEventTime] = createSignal("");
  const [capacity, setCapacity] = createSignal("");
  const [price, setPrice] = createSignal("");
  const [placeId, setPlaceId] = createSignal<string | null>(null);
  const [photoFile, setPhotoFile] = createSignal<File | null>(null);
  const [photoPreview, setPhotoPreview] = createSignal<string | null>(null);
  const [capacityMode, setCapacityMode] = createSignal<"open" | "limited">("open");
  const [visibility, setVisibility] = createSignal<"public" | "friends" | "invite">("public");
  const [inviteFriends, setInviteFriends] = createSignal<FriendProfile[]>([]);
  const [selectedInvites, setSelectedInvites] = createSignal<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = createSignal(false);

  let locationContainerRef: HTMLDivElement | undefined;
  let photoInputRef: HTMLInputElement | undefined;

  onMount(async () => {
    // Load Google Maps first so venue search works for suggestions
    await loadGoogleMaps().catch(() => {});
    await loadAll();

    // Generate suggested events based on user profile (async — uses Google Places)
    const p = profile();
    if (p) {
      setLoadingSuggested(true);
      getSuggestedEvents(p)
        .then((events) => setSuggested(events))
        .catch((e) => console.warn("[Friendly] Failed to load suggestions:", e))
        .finally(() => setLoadingSuggested(false));
    }
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

  // ---- Event Group Chat helpers ----
  // Uses event_conversations linking table. Run scripts/add-event-conversations.sql first.

  /** Find an existing group chat for an event via the linking table */
  const findEventGroupChat = async (eventId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("event_conversations")
      .select("conversation_id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) return null; // Table may not exist yet
    return data?.conversation_id ?? null;
  };

  /** Create a group conversation (tries with group_name, falls back without) */
  const createConversation = async (eventTitle: string, creatorId: string): Promise<string | null> => {
    // Try with group_name for nice display in Chat
    const { data, error } = await supabase
      .from("conversations")
      .insert({ type: "group", participants: [creatorId], group_name: eventTitle })
      .select("id")
      .single();

    if (!error && data) return data.id;

    // Fallback: create without group_name (column may not exist)
    const { data: data2, error: error2 } = await supabase
      .from("conversations")
      .insert({ type: "group", participants: [creatorId] })
      .select("id")
      .single();

    if (error2) {
      console.error("Failed to create group chat:", error2.message);
      return null;
    }
    return data2?.id ?? null;
  };

  /** Find or create the group chat for an event, ensure userId is a participant */
  const ensureEventGroupChat = async (eventId: string, eventTitle: string, userId: string): Promise<string | null> => {
    let convoId = await findEventGroupChat(eventId);

    if (!convoId) {
      // Create a new conversation
      convoId = await createConversation(eventTitle, userId);
      if (!convoId) return null;

      // Link it in the event_conversations table
      const { error: linkErr } = await supabase
        .from("event_conversations")
        .insert({ event_id: eventId, conversation_id: convoId });
      if (linkErr) {
        console.warn("Could not link event to chat (run scripts/add-event-conversations.sql):", linkErr.message);
      }
    } else {
      // Add user to participants if not already in
      const { data: convo } = await supabase
        .from("conversations")
        .select("participants")
        .eq("id", convoId)
        .single();

      if (convo && !convo.participants.includes(userId)) {
        await supabase
          .from("conversations")
          .update({ participants: [...convo.participants, userId] })
          .eq("id", convoId);
      }
    }

    return convoId;
  };

  /** Remove a user from an event's group chat */
  const removeFromEventGroupChat = async (eventId: string, userId: string) => {
    const convoId = await findEventGroupChat(eventId);
    if (!convoId) return;

    const { data: convo } = await supabase
      .from("conversations")
      .select("participants")
      .eq("id", convoId)
      .single();

    if (convo) {
      const updated = convo.participants.filter((p: string) => p !== userId);
      await supabase
        .from("conversations")
        .update({ participants: updated })
        .eq("id", convoId);
    }
  };

  const joinSuggestedEvent = async (suggestion: SuggestedEvent) => {
    const myId = user()?.id;
    if (!myId) return;

    setJoiningSuggested(suggestion.id);

    const payload: Record<string, unknown> = {
      creator_id: myId,
      title: suggestion.title,
      description: suggestion.description + "\n\nSuggested by Friendly",
      location: suggestion.location,
      date: suggestion.date,
    };

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Join suggested event error:", error);
      showToast("Failed to create event");
      setJoiningSuggested(null);
      return;
    }

    // Auto-RSVP
    const eventId = (newEvent as any).id;
    if (newEvent) {
      await supabase.from("event_rsvps").insert({
        event_id: eventId,
        user_id: myId,
      });
      setMyRsvps((prev) => new Set(prev).add(eventId));
    }

    // Create/join the event group chat
    await ensureEventGroupChat(eventId, suggestion.title, myId);

    // Remove from suggestions
    setSuggested((prev) => prev.filter((s) => s.id !== suggestion.id));
    setJoiningSuggested(null);

    showToast("You're in! Check Chat for the event group.", "success");
    await fetchEvents();
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

    // Sync group chat membership in background
    const ev = events().find((e) => e.id === eventId);
    if (ev && !error) {
      if (isGoing) {
        removeFromEventGroupChat(ev.id, myId).catch(() => {});
      } else {
        ensureEventGroupChat(ev.id, ev.title, myId).catch(() => {});
      }
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
    setAttendees([]);
    setEventConvoId(null);

    // Look up the event's group chat
    findEventGroupChat(event.id).then((id) => setEventConvoId(id));

    // Fetch attendees
    supabase
      .from("event_rsvps")
      .select("user_id, users(id, name, avatar_url)")
      .eq("event_id", event.id)
      .then(({ data }) => {
        if (data) {
          const profiles = data.map((r: any) => r.users as AttendeeProfile).filter(Boolean);
          setAttendees(profiles);
        }
      });

    // Priority: user-uploaded photo > Google Places by place_id > location search
    if (event.image_url) {
      setDetailPhoto(event.image_url);
      setLoadingPhoto(false);
      return;
    }

    if (isGoogleMapsLoaded()) {
      let photo: string | null = null;

      if (event.place_id) {
        photo = await getPlacePhoto(event.place_id);
      }
      if (!photo && event.location) {
        photo = await searchPlacePhoto(event.location);
      }
      // Don't search by title — it produces irrelevant photos

      setDetailPhoto(photo);
    }
    setLoadingPhoto(false);
  };

  const closeDetail = () => {
    setSelectedEvent(null);
    setDetailPhoto(null);
    setAttendees([]);
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
    setPhotoFile(null);
    setPhotoPreview(null);
    setCapacityMode("open");
    setVisibility("public");
    setSelectedInvites(new Set());
    if (photoInputRef) photoInputRef.value = "";
  };

  const fetchInviteFriends = async () => {
    const myId = user()?.id;
    if (!myId) return;
    setLoadingFriends(true);
    try {
      const { data } = await supabase.rpc("get_mutual_friends", { my_id: myId });
      setInviteFriends((data ?? []) as FriendProfile[]);
    } catch {
      // Fallback if RPC not available
      const { data: waves } = await supabase
        .from("waves")
        .select("target_id")
        .eq("user_id", myId);
      const myTargets = new Set((waves ?? []).map((w: any) => w.target_id));
      const { data: incoming } = await supabase
        .from("waves")
        .select("user_id")
        .eq("target_id", myId);
      const mutualIds = (incoming ?? [])
        .map((w: any) => w.user_id)
        .filter((uid: string) => myTargets.has(uid));
      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("users")
          .select("id, name, avatar_url")
          .in("id", mutualIds);
        setInviteFriends((profiles ?? []) as FriendProfile[]);
      } else {
        setInviteFriends([]);
      }
    }
    setLoadingFriends(false);
  };

  const toggleInvite = (id: string) => {
    setSelectedInvites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePhotoSelect = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
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

    // Upload photo if selected
    let imageUrl: string | null = null;
    const file = photoFile();
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${myId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("event-photos")
        .upload(path, file, { contentType: file.type });

      if (uploadErr) {
        showToast("Failed to upload photo");
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("event-photos")
        .getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

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
      image_url: imageUrl,
      visibility: visibility(),
    };

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();

    if (error) {
      showToast("Failed to create event");
      setSubmitting(false);
      return;
    }

    // Insert invites for invite-only events
    if (visibility() === "invite" && newEvent && selectedInvites().size > 0) {
      const inviteRows = [...selectedInvites()].map((uid) => ({
        event_id: (newEvent as any).id,
        user_id: uid,
      }));
      await supabase.from("event_invites").insert(inviteRows);
    }

    // Create group chat for this event
    if (newEvent) {
      await ensureEventGroupChat((newEvent as any).id, (newEvent as any).title, myId);
    }

    setSubmitting(false);
    setShowModal(false);
    resetForm();
    await loadAll();
  };

  const getRsvpCount = (event: EventRow): number => event.event_rsvps[0]?.count ?? 0;

  const getCapacityDisplay = (event: EventRow): string => {
    const count = getRsvpCount(event);
    if (event.capacity) return `${count}/${event.capacity} spots`;
    return count > 0 ? `${count} going` : "Open to all";
  };

  const getPriceDisplay = (event: EventRow): string => {
    if (!event.price || event.price === "0" || event.price.toLowerCase() === "free") return "Free";
    return event.price.startsWith("$") ? event.price : `$${event.price}`;
  };

  return (
    <>
      <div class="nav-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="nav-logo"><img src="/icon.png" alt="Friendly" /></div>
          <h1>Events</h1>
        </div>
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
        {/* Suggested for You */}
        <Show when={loadingSuggested()}>
          <div class="suggested-section">
            <div class="suggested-header">
              <span>Suggested for You</span>
            </div>
            <div style="display:flex;justify-content:center;padding:16px 0">
              <div class="loading-spinner" />
            </div>
          </div>
        </Show>
        <Show when={suggested().length > 0}>
          <div class="suggested-section">
            <div class="suggested-header">
              <span>Suggested for You</span>
            </div>
            <div class="suggested-scroll">
              <For each={suggested()}>
                {(s) => (
                  <div class="suggested-card">
                    <div class="suggested-card-badge">
                      <div class="suggested-badge-icon"><img src="/icon.png" alt="" /></div>
                      Friendly
                    </div>
                    <div class="suggested-card-title">{s.title}</div>
                    <div class="suggested-card-meta">{s.timeLabel}</div>
                    <div class="suggested-card-meta">{s.location}</div>
                    <Show when={!s.isFree}>
                      <div class="suggested-card-price">Paid</div>
                    </Show>
                    <button
                      class="suggested-join-btn"
                      onClick={() => joinSuggestedEvent(s)}
                      disabled={joiningSuggested() === s.id}
                    >
                      {joiningSuggested() === s.id ? "Joining..." : "Join"}
                    </button>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

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
                    <Show when={event.image_url} fallback={
                      <div class="event-date">
                        <div class="month">{month}</div>
                        <div class="day">{day}</div>
                      </div>
                    }>
                      <div class="event-thumb">
                        <img src={event.image_url!} alt="" />
                      </div>
                    </Show>
                    <div class="event-info">
                      <h3>
                        {event.title}
                        <Show when={event.visibility && event.visibility !== "public"}>
                          <span class="visibility-badge">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            {event.visibility === "friends" ? "Friends" : "Invite"}
                          </span>
                        </Show>
                      </h3>
                      <div class="meta">
                        {event.location ? `${event.location} · ` : ""}
                        {formatTime(event.date)}
                      </div>
                      <div class="meta">
                        <Show when={!event.capacity} fallback={<span>{getCapacityDisplay(event)}</span>}>
                          <span class="open-badge">&#8734; Open</span>
                          <Show when={getRsvpCount(event) > 0}>
                            <span> · {getRsvpCount(event)} going</span>
                          </Show>
                        </Show>
                      </div>
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
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style="opacity:0.4">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span>{ev().location ?? ev().title}</span>
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
                  <h2 class="event-detail-title">
                    {ev().title}
                    <Show when={ev().visibility && ev().visibility !== "public"}>
                      <span class="visibility-badge" style="margin-left:8px;vertical-align:middle">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        {ev().visibility === "friends" ? "Friends Only" : "Invite Only"}
                      </span>
                    </Show>
                  </h2>

                  <div class="event-detail-row">
                    <span class="event-detail-icon-label">Date</span>
                    <div>
                      <div class="event-detail-label">{formatFullDate(ev().date)}</div>
                      <div class="event-detail-sub">{formatTime(ev().date)}</div>
                    </div>
                  </div>

                  <div class="event-detail-row">
                    <span class="event-detail-icon-label">Location</span>
                    <div>
                      <div class="event-detail-label">{ev().location || "TBD"}</div>
                    </div>
                  </div>

                  <div class="event-detail-row">
                    <span class="event-detail-icon-label">Capacity</span>
                    <div>
                      <div class="event-detail-label">
                        <Show when={!ev().capacity} fallback={<span>{getCapacityDisplay(ev())}</span>}>
                          <span class="open-badge">&#8734; Open to all</span>
                          <Show when={getRsvpCount(ev()) > 0}>
                            <span style="margin-left:8px;color:var(--text-secondary);font-weight:400">
                              · {getRsvpCount(ev())} going
                            </span>
                          </Show>
                        </Show>
                      </div>
                    </div>
                  </div>

                  <div class="event-detail-row">
                    <span class="event-detail-icon-label">Price</span>
                    <div>
                      <div class="event-detail-label">{getPriceDisplay(ev())}</div>
                    </div>
                  </div>

                  {/* Attendees */}
                  <Show when={attendees().length > 0}>
                    <div class="event-attendees">
                      <div class="event-attendees-label">Who's going</div>
                      <div class="event-attendees-scroll">
                        <For each={attendees()}>
                          {(att) => (
                            <div
                              class="event-attendee"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/user/${att.id}`);
                              }}
                            >
                              <div class={`event-attendee-avatar${att.avatar_url ? " avatar-photo" : ""}`}>
                                <Show when={att.avatar_url} fallback={getInitials(att.name)}>
                                  <img src={att.avatar_url!} alt={att.name} />
                                </Show>
                              </div>
                              <span class="event-attendee-name">{att.name.split(" ")[0]}</span>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  {/* Group Chat button */}
                  <Show when={eventConvoId()}>
                    <button
                      class="event-group-chat-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDetail();
                        navigate(`/chat?convo=${eventConvoId()}`);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                      </svg>
                      Group Chat
                    </button>
                  </Show>

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
              {/* Photo upload */}
              <div
                class="event-photo-upload"
                onClick={() => photoInputRef?.click()}
              >
                <Show when={photoPreview()} fallback={
                  <div class="event-photo-upload-placeholder">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-7 13c.22-.72 3.31-2 7-2s6.78 1.28 7 2H5zm9-6.43V16h4v2H6v-2h4v-3.43c-3.61.46-7 2.06-8 4.43v2h20v-2c-1-2.37-4.39-3.97-8-4.43z M20 4V1h-2v3h-3v2h3v3h2V6h3V4h-3z" />
                    </svg>
                    <span>Add Photo</span>
                  </div>
                }>
                  <img src={photoPreview()!} alt="Preview" class="event-photo-upload-preview" />
                  <div class="event-photo-upload-change">Change Photo</div>
                </Show>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style="display:none"
                  onChange={handlePhotoSelect}
                />
              </div>

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
              <div class="sheet-field">
                <label>Capacity</label>
                <div class="capacity-toggle">
                  <button
                    type="button"
                    class={`capacity-toggle-btn${capacityMode() === "open" ? " capacity-toggle-active" : ""}`}
                    onClick={() => { setCapacityMode("open"); setCapacity(""); }}
                  >
                    Open to all
                  </button>
                  <button
                    type="button"
                    class={`capacity-toggle-btn${capacityMode() === "limited" ? " capacity-toggle-active" : ""}`}
                    onClick={() => setCapacityMode("limited")}
                  >
                    Limited spots
                  </button>
                </div>
                <Show when={capacityMode() === "limited"}>
                  <input
                    type="number"
                    min="1"
                    value={capacity()}
                    onInput={(e) => setCapacity(e.currentTarget.value)}
                    placeholder="Max attendees"
                    style="margin-top:8px"
                  />
                </Show>
              </div>
              <div class="sheet-field">
                <label>Visibility</label>
                <div class="capacity-toggle">
                  <button
                    type="button"
                    class={`capacity-toggle-btn${visibility() === "public" ? " capacity-toggle-active" : ""}`}
                    onClick={() => setVisibility("public")}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    class={`capacity-toggle-btn${visibility() === "friends" ? " capacity-toggle-active" : ""}`}
                    onClick={() => setVisibility("friends")}
                  >
                    Friends
                  </button>
                  <button
                    type="button"
                    class={`capacity-toggle-btn${visibility() === "invite" ? " capacity-toggle-active" : ""}`}
                    onClick={() => { setVisibility("invite"); fetchInviteFriends(); }}
                  >
                    Invite Only
                  </button>
                </div>
                <Show when={visibility() === "invite"}>
                  <div class="invite-picker" style="margin-top:8px">
                    <Show when={!loadingFriends()} fallback={
                      <div style="display:flex;justify-content:center;padding:12px">
                        <div class="loading-spinner" />
                      </div>
                    }>
                      <Show when={inviteFriends().length > 0} fallback={
                        <div style="font-size:13px;color:var(--text-secondary);padding:8px 0">
                          No mutual waves yet
                        </div>
                      }>
                        <div class="invite-friend-list">
                          <For each={inviteFriends()}>
                            {(friend) => {
                              const isSelected = () => selectedInvites().has(friend.id);
                              return (
                                <div
                                  class={`invite-friend-item${isSelected() ? " invite-selected" : ""}`}
                                  onClick={() => toggleInvite(friend.id)}
                                >
                                  <div class={`invite-friend-avatar${friend.avatar_url ? " avatar-photo" : ""}`}>
                                    <Show when={friend.avatar_url} fallback={getInitials(friend.name)}>
                                      <img src={friend.avatar_url!} alt={friend.name} />
                                    </Show>
                                  </div>
                                  <span>{friend.name}</span>
                                  <Show when={isSelected()}>
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary)" style="margin-left:auto">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                  </Show>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </Show>
                  </div>
                </Show>
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
