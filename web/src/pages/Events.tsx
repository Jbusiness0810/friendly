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

// ---- Types ----

type RsvpStatus = "going" | "maybe" | "cant_go";

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
  theme: string;
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
  status: RsvpStatus;
  guest_count: number;
}

interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: { name: string; avatar_url: string | null } | null;
}

// ---- Event Themes ----

interface EventTheme {
  id: string;
  label: string;
  gradient: string;
  accent: string;
  emoji: string;
}

const EVENT_THEMES: EventTheme[] = [
  { id: "default",   label: "Default",    gradient: "linear-gradient(135deg, #007AFF 0%, #0051D5 100%)",                   accent: "#007AFF", emoji: "" },
  { id: "sunset",    label: "Sunset",     gradient: "linear-gradient(135deg, #FF6B6B 0%, #FFB347 50%, #FF4E50 100%)",      accent: "#FF6B6B", emoji: "" },
  { id: "neon",      label: "Neon Night", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",      accent: "#764ba2", emoji: "" },
  { id: "garden",    label: "Garden",     gradient: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",                   accent: "#56ab2f", emoji: "" },
  { id: "ocean",     label: "Ocean",      gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",                   accent: "#2193b0", emoji: "" },
  { id: "party",     label: "Party",      gradient: "linear-gradient(135deg, #f857a6 0%, #ff5858 50%, #ffc371 100%)",      accent: "#f857a6", emoji: "" },
  { id: "cozy",      label: "Cozy",       gradient: "linear-gradient(135deg, #614385 0%, #516395 100%)",                   accent: "#614385", emoji: "" },
  { id: "golden",    label: "Golden Hour", gradient: "linear-gradient(135deg, #F2994A 0%, #F2C94C 100%)",                  accent: "#F2994A", emoji: "" },
];

const getTheme = (id: string): EventTheme =>
  EVENT_THEMES.find((t) => t.id === id) ?? EVENT_THEMES[0];

// ---- Confetti ----

function launchConfetti(container: HTMLElement) {
  const colors = ["#FF6B6B", "#FFB347", "#4ECDC4", "#45B7D1", "#96E6A1", "#DDA0DD", "#F7DC6F", "#FF69B4"];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti-piece";
    confetti.style.setProperty("--x", `${(Math.random() - 0.5) * 300}px`);
    confetti.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${40 + Math.random() * 20}%`;
    confetti.style.animationDelay = `${Math.random() * 0.3}s`;
    confetti.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = "50%";
      confetti.style.width = "8px";
      confetti.style.height = "8px";
    }
    container.appendChild(confetti);
    setTimeout(() => confetti.remove(), 1500);
  }
}

// ---- Helpers ----

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

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ---- Component ----

const Events: Component = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = createSignal<EventRow[]>([]);
  const [myRsvps, setMyRsvps] = createSignal<Map<string, RsvpStatus>>(new Map());
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

  // RSVP detail
  const [showRsvpSheet, setShowRsvpSheet] = createSignal(false);
  const [rsvpGuestCount, setRsvpGuestCount] = createSignal(0);

  // Comments (wall)
  const [comments, setComments] = createSignal<EventComment[]>([]);
  const [commentText, setCommentText] = createSignal("");
  const [postingComment, setPostingComment] = createSignal(false);

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
  const [selectedTheme, setSelectedTheme] = createSignal("default");
  const [inviteFriends, setInviteFriends] = createSignal<FriendProfile[]>([]);
  const [selectedInvites, setSelectedInvites] = createSignal<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = createSignal(false);

  let locationContainerRef: HTMLDivElement | undefined;
  let photoInputRef: HTMLInputElement | undefined;
  let detailSheetRef: HTMLDivElement | undefined;

  onMount(async () => {
    await loadGoogleMaps().catch(() => {});
    await loadAll();

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
      .select("event_id, status")
      .eq("user_id", myId);

    const map = new Map<string, RsvpStatus>();
    for (const r of data ?? []) {
      map.set(r.event_id, (r as any).status ?? "going");
    }
    setMyRsvps(map);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchMyRsvps()]);
    setLoading(false);
  };

  // ---- Event Group Chat helpers ----

  const findEventGroupChat = async (eventId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("event_conversations")
      .select("conversation_id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (error) return null;
    return data?.conversation_id ?? null;
  };

  const createConversation = async (eventTitle: string, creatorId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ type: "group", participants: [creatorId], group_name: eventTitle })
      .select("id")
      .single();

    if (!error && data) return data.id;

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

  const ensureEventGroupChat = async (eventId: string, eventTitle: string, userId: string): Promise<string | null> => {
    let convoId = await findEventGroupChat(eventId);

    if (!convoId) {
      convoId = await createConversation(eventTitle, userId);
      if (!convoId) return null;

      const { error: linkErr } = await supabase
        .from("event_conversations")
        .insert({ event_id: eventId, conversation_id: convoId });
      if (linkErr) {
        console.warn("Could not link event to chat:", linkErr.message);
      }
    } else {
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

  // ---- Suggested Events ----

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

    const eventId = (newEvent as any).id;
    if (newEvent) {
      await supabase.from("event_rsvps").insert({
        event_id: eventId,
        user_id: myId,
        status: "going",
        guest_count: 0,
      });
      setMyRsvps((prev) => new Map(prev).set(eventId, "going"));
    }

    await ensureEventGroupChat(eventId, suggestion.title, myId);
    setSuggested((prev) => prev.filter((s) => s.id !== suggestion.id));
    setJoiningSuggested(null);

    showToast("You're in! Check Chat for the event group.", "success");
    await fetchEvents();
  };

  // ---- RSVP with status ----

  const handleRsvp = async (eventId: string, status: RsvpStatus, guestCount: number = 0, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const myId = user()?.id;
    if (!myId) return;

    const currentStatus = myRsvps().get(eventId);
    const isAlreadyRsvpd = currentStatus !== undefined;

    if (status === "cant_go" && isAlreadyRsvpd) {
      // Remove RSVP entirely
      setMyRsvps((prev) => {
        const next = new Map(prev);
        next.delete(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== eventId) return ev;
          const currentCount = ev.event_rsvps[0]?.count ?? 0;
          return { ...ev, event_rsvps: [{ count: Math.max(0, currentCount - 1) }] };
        })
      );

      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", myId);

      if (error) {
        setMyRsvps((prev) => new Map(prev).set(eventId, currentStatus!));
        showToast("Failed to update RSVP");
        return;
      }

      const ev = events().find((e) => e.id === eventId);
      if (ev) removeFromEventGroupChat(ev.id, myId).catch(() => {});
      return;
    }

    // Upsert RSVP
    setMyRsvps((prev) => new Map(prev).set(eventId, status));
    if (!isAlreadyRsvpd) {
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== eventId) return ev;
          const currentCount = ev.event_rsvps[0]?.count ?? 0;
          return { ...ev, event_rsvps: [{ count: currentCount + 1 }] };
        })
      );
    }

    let error;
    if (isAlreadyRsvpd) {
      ({ error } = await supabase
        .from("event_rsvps")
        .update({ status, guest_count: guestCount })
        .eq("event_id", eventId)
        .eq("user_id", myId));
    } else {
      ({ error } = await supabase
        .from("event_rsvps")
        .insert({ event_id: eventId, user_id: myId, status, guest_count: guestCount }));
    }

    if (error) {
      if (isAlreadyRsvpd) {
        setMyRsvps((prev) => new Map(prev).set(eventId, currentStatus!));
      } else {
        setMyRsvps((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
      }
      showToast("Failed to update RSVP");
      return;
    }

    // Confetti on "going"!
    if (status === "going" && !isAlreadyRsvpd && detailSheetRef) {
      launchConfetti(detailSheetRef);
    }

    const ev = events().find((e) => e.id === eventId);
    if (ev) {
      if (status === "going") {
        ensureEventGroupChat(ev.id, ev.title, myId).catch(() => {});
      }
    }
  };

  // Legacy toggle for list view quick-RSVP
  const toggleRsvp = async (eventId: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const currentStatus = myRsvps().get(eventId);
    if (currentStatus) {
      await handleRsvp(eventId, "cant_go", 0, e);
    } else {
      await handleRsvp(eventId, "going", 0, e);
    }
  };

  // ---- Comments (Wall) ----

  const fetchComments = async (eventId: string) => {
    const { data } = await supabase
      .from("event_comments")
      .select("*, users(name, avatar_url)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    setComments((data as EventComment[]) ?? []);
  };

  const postComment = async () => {
    const ev = selectedEvent();
    const myId = user()?.id;
    const text = commentText().trim();
    if (!ev || !myId || !text) return;

    setPostingComment(true);
    const { error } = await supabase
      .from("event_comments")
      .insert({ event_id: ev.id, user_id: myId, content: text });

    if (error) {
      showToast("Failed to post comment");
    } else {
      setCommentText("");
      await fetchComments(ev.id);
    }
    setPostingComment(false);
  };

  const deleteComment = async (commentId: string) => {
    const ev = selectedEvent();
    if (!ev) return;
    await supabase.from("event_comments").delete().eq("id", commentId);
    await fetchComments(ev.id);
  };

  // -- Event Detail Modal --
  const openEventDetail = async (event: EventRow) => {
    setSelectedEvent(event);
    setDetailPhoto(null);
    setLoadingPhoto(true);
    setAttendees([]);
    setEventConvoId(null);
    setComments([]);
    setCommentText("");
    setShowRsvpSheet(false);
    setRsvpGuestCount(0);

    findEventGroupChat(event.id).then((id) => setEventConvoId(id));
    fetchComments(event.id);

    // Fetch attendees with status + guest_count
    supabase
      .from("event_rsvps")
      .select("user_id, status, guest_count, users(id, name, avatar_url)")
      .eq("event_id", event.id)
      .then(({ data }) => {
        if (data) {
          const profiles = data
            .map((r: any) => ({
              ...(r.users as { id: string; name: string; avatar_url: string | null }),
              status: r.status ?? "going",
              guest_count: r.guest_count ?? 0,
            }))
            .filter((p: any) => p.id);
          setAttendees(profiles);
        }
      });

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
      setDetailPhoto(photo);
    }
    setLoadingPhoto(false);
  };

  const closeDetail = () => {
    setSelectedEvent(null);
    setDetailPhoto(null);
    setAttendees([]);
    setComments([]);
    setShowRsvpSheet(false);
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
    setSelectedTheme("default");
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
      theme: selectedTheme(),
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

    if (visibility() === "invite" && newEvent && selectedInvites().size > 0) {
      const inviteRows = [...selectedInvites()].map((uid) => ({
        event_id: (newEvent as any).id,
        user_id: uid,
      }));
      await supabase.from("event_invites").insert(inviteRows);
    }

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

  const getMyRsvpStatus = (eventId: string): RsvpStatus | null => {
    return myRsvps().get(eventId) ?? null;
  };

  const getRsvpLabel = (status: RsvpStatus | null): string => {
    if (status === "going") return "Going";
    if (status === "maybe") return "Maybe";
    return "RSVP";
  };

  const getRsvpBtnClass = (status: RsvpStatus | null, isFull: boolean): string => {
    if (status === "going") return "rsvp-btn rsvp-btn-going";
    if (status === "maybe") return "rsvp-btn rsvp-btn-maybe";
    if (isFull) return "rsvp-btn rsvp-btn-full";
    return "rsvp-btn rsvp-btn-default";
  };

  // Grouped attendees
  const goingAttendees = () => attendees().filter((a) => a.status === "going");
  const maybeAttendees = () => attendees().filter((a) => a.status === "maybe");
  const totalGoing = () => goingAttendees().reduce((sum, a) => sum + 1 + a.guest_count, 0);

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
                const status = () => getMyRsvpStatus(event.id);
                const isFull = () =>
                  event.capacity != null &&
                  getRsvpCount(event) >= event.capacity &&
                  !status();
                const theme = getTheme(event.theme ?? "default");

                return (
                  <div class="event-row event-row-clickable" onClick={() => openEventDetail(event)}>
                    <Show when={event.image_url} fallback={
                      <div class="event-date-themed" style={`background:${theme.gradient}`}>
                        <div class="month" style="color:rgba(255,255,255,0.85)">{month}</div>
                        <div class="day" style="color:#fff">{day}</div>
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
                          class={getRsvpBtnClass(status(), isFull())}
                          onClick={(e) => toggleRsvp(event.id, e)}
                          disabled={isFull()}
                        >
                          {getRsvpLabel(status())}
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
          const status = () => getMyRsvpStatus(ev().id);
          const isFull = () =>
            ev().capacity != null &&
            getRsvpCount(ev()) >= ev().capacity &&
            !status();
          const theme = () => getTheme(ev().theme ?? "default");

          return (
            <div class="modal-overlay" onClick={closeDetail}>
              <div
                ref={detailSheetRef}
                class="event-detail-sheet"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Themed hero */}
                <div
                  class="event-detail-hero"
                  style={!detailPhoto() && !loadingPhoto() ? `background:${theme().gradient}` : ""}
                >
                  <Show when={detailPhoto()} fallback={
                    <Show when={loadingPhoto()} fallback={
                      <div class="event-detail-hero-themed">
                        <span class="event-detail-hero-emoji">{theme().emoji}</span>
                        <span class="event-detail-hero-location">{ev().location ?? ev().title}</span>
                      </div>
                    }>
                      <div class="event-detail-hero-placeholder">
                        <div class="loading-spinner" />
                      </div>
                    </Show>
                  }>
                    <img src={detailPhoto()!} alt={ev().location ?? ev().title} class="event-detail-hero-img" />
                  </Show>
                  <button class="event-detail-close" onClick={closeDetail}>&#10005;</button>
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
                              · {totalGoing()} going
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

                  {/* RSVP Tier Buttons */}
                  <Show when={user()}>
                    <div class="rsvp-tier-section">
                      <div class="rsvp-tier-buttons">
                        <button
                          class={`rsvp-tier-btn rsvp-tier-going ${status() === "going" ? "rsvp-tier-active" : ""}`}
                          onClick={() => handleRsvp(ev().id, "going", rsvpGuestCount())}
                          disabled={isFull() && status() !== "going"}
                        >
                          <span class="rsvp-tier-icon">&#10003;</span>
                          Going
                        </button>
                        <button
                          class={`rsvp-tier-btn rsvp-tier-maybe ${status() === "maybe" ? "rsvp-tier-active" : ""}`}
                          onClick={() => handleRsvp(ev().id, "maybe", rsvpGuestCount())}
                        >
                          <span class="rsvp-tier-icon">?</span>
                          Maybe
                        </button>
                        <button
                          class={`rsvp-tier-btn rsvp-tier-cant ${status() === "cant_go" || (!status() && false) ? "rsvp-tier-active" : ""}`}
                          onClick={() => handleRsvp(ev().id, "cant_go")}
                        >
                          <span class="rsvp-tier-icon">&#10005;</span>
                          Can't Go
                        </button>
                      </div>

                      {/* Plus-ones */}
                      <Show when={status() === "going" || status() === "maybe"}>
                        <div class="plus-one-section">
                          <span class="plus-one-label">Bringing guests?</span>
                          <div class="plus-one-stepper">
                            <button
                              class="plus-one-btn"
                              onClick={() => {
                                const newCount = Math.max(0, rsvpGuestCount() - 1);
                                setRsvpGuestCount(newCount);
                                handleRsvp(ev().id, status()!, newCount);
                              }}
                              disabled={rsvpGuestCount() === 0}
                            >
                              -
                            </button>
                            <span class="plus-one-count">
                              {rsvpGuestCount() === 0 ? "Just me" : `+${rsvpGuestCount()}`}
                            </span>
                            <button
                              class="plus-one-btn"
                              onClick={() => {
                                const newCount = Math.min(5, rsvpGuestCount() + 1);
                                setRsvpGuestCount(newCount);
                                handleRsvp(ev().id, status()!, newCount);
                              }}
                              disabled={rsvpGuestCount() >= 5}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  {/* Guest List — Grouped by status */}
                  <Show when={attendees().length > 0}>
                    <div class="event-attendees">
                      <Show when={goingAttendees().length > 0}>
                        <div class="event-attendees-label">
                          Going ({totalGoing()})
                        </div>
                        <div class="event-attendees-scroll">
                          <For each={goingAttendees()}>
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
                                <span class="event-attendee-name">
                                  {att.name.split(" ")[0]}
                                  {att.guest_count > 0 ? ` +${att.guest_count}` : ""}
                                </span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      <Show when={maybeAttendees().length > 0}>
                        <div class="event-attendees-label" style="margin-top:12px">
                          Maybe ({maybeAttendees().length})
                        </div>
                        <div class="event-attendees-scroll">
                          <For each={maybeAttendees()}>
                            {(att) => (
                              <div
                                class="event-attendee"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/user/${att.id}`);
                                }}
                              >
                                <div class={`event-attendee-avatar event-attendee-maybe${att.avatar_url ? " avatar-photo" : ""}`}>
                                  <Show when={att.avatar_url} fallback={getInitials(att.name)}>
                                    <img src={att.avatar_url!} alt={att.name} />
                                  </Show>
                                </div>
                                <span class="event-attendee-name">{att.name.split(" ")[0]}</span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
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

                  {/* Comment Wall */}
                  <div class="event-wall">
                    <div class="event-wall-header">
                      <span class="event-wall-title">The Wall</span>
                      <span class="event-wall-count">{comments().length}</span>
                    </div>

                    <Show when={comments().length > 0}>
                      <div class="event-wall-comments">
                        <For each={comments()}>
                          {(comment) => (
                            <div class="event-wall-comment">
                              <div class={`event-wall-avatar${comment.users?.avatar_url ? " avatar-photo" : ""}`}>
                                <Show when={comment.users?.avatar_url} fallback={
                                  getInitials(comment.users?.name ?? "?")
                                }>
                                  <img src={comment.users!.avatar_url!} alt="" />
                                </Show>
                              </div>
                              <div class="event-wall-comment-body">
                                <div class="event-wall-comment-header">
                                  <span class="event-wall-comment-name">{comment.users?.name ?? "Someone"}</span>
                                  <span class="event-wall-comment-time">{timeAgo(comment.created_at)}</span>
                                </div>
                                <div class="event-wall-comment-text">{comment.content}</div>
                              </div>
                              <Show when={comment.user_id === user()?.id}>
                                <button
                                  class="event-wall-delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteComment(comment.id);
                                  }}
                                >
                                  &#10005;
                                </button>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={user()}>
                      <div class="event-wall-input">
                        <input
                          type="text"
                          placeholder="Write on the wall..."
                          value={commentText()}
                          onInput={(e) => setCommentText(e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && commentText().trim()) postComment();
                          }}
                        />
                        <button
                          class="event-wall-send"
                          onClick={postComment}
                          disabled={!commentText().trim() || postingComment()}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </button>
                      </div>
                    </Show>
                  </div>
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
                  <div class="event-photo-upload-placeholder" style={`background:${getTheme(selectedTheme()).gradient}`}>
                    <span style="font-size:36px">{getTheme(selectedTheme()).emoji}</span>
                    <span style="color:rgba(255,255,255,0.9)">Add Photo</span>
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

              {/* Theme picker */}
              <div class="sheet-field">
                <label>Theme</label>
                <div class="theme-picker">
                  <For each={EVENT_THEMES}>
                    {(t) => (
                      <button
                        type="button"
                        class={`theme-dot ${selectedTheme() === t.id ? "theme-dot-active" : ""}`}
                        style={`background:${t.gradient}`}
                        onClick={() => setSelectedTheme(t.id)}
                        title={t.label}
                      >
                        <Show when={selectedTheme() === t.id}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
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
