import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
  type Component,
} from "solid-js";
import { useSearchParams, useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { showToast } from "../lib/toast";
import { setHasUnread } from "../lib/unread";
import { blockedIds } from "../lib/blocked";

interface Conversation {
  id: string;
  type: "direct" | "group";
  participants: string[];
  group_name?: string | null;
  group_avatar?: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  verified: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type?: string;
  media_url?: string | null;
  deleted_at?: string | null;
  created_at: string;
}

interface ConversationRow {
  conversation: Conversation;
  otherUser: UserProfile;
  participantProfiles?: Map<string, UserProfile>;
  latestMessage: Message | null;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000)
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short" });
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const Chat: Component = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [rows, setRows] = createSignal<ConversationRow[]>([]);
  const [loadingList, setLoadingList] = createSignal(true);
  const [activeConvo, setActiveConvo] = createSignal<ConversationRow | null>(null);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = createSignal(false);
  const [inputText, setInputText] = createSignal("");

  // Chat enhancements
  const [isOtherTyping, setIsOtherTyping] = createSignal(false);
  const [otherReadAt, setOtherReadAt] = createSignal<string | null>(null);
  const [longPressMsg, setLongPressMsg] = createSignal<string | null>(null);

  // New chat & group creation
  const [showNewChat, setShowNewChat] = createSignal(false);
  const [showCreateGroup, setShowCreateGroup] = createSignal(false);
  const [mutualFriends, setMutualFriends] = createSignal<UserProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = createSignal(false);
  const [groupName, setGroupName] = createSignal("");
  const [selectedFriends, setSelectedFriends] = createSignal<Set<string>>(new Set());

  // Group member management
  const [showGroupMembers, setShowGroupMembers] = createSignal(false);
  const [showAddMember, setShowAddMember] = createSignal(false);
  const [uploadingGroupPhoto, setUploadingGroupPhoto] = createSignal(false);
  const [myProfile, setMyProfile] = createSignal<UserProfile | null>(null);

  let messagesEndRef!: HTMLDivElement;
  let channel: RealtimeChannel | null = null;
  let listChannel: RealtimeChannel | null = null;
  let typingTimeout: number | undefined;
  let typingSendTimeout: number | undefined;

  const myId = () => user()?.id ?? "";

  // Unread tracking via localStorage
  const getLastReadMap = (): Map<string, string> => {
    try {
      const stored = localStorage.getItem("friendly-last-read");
      if (stored) return new Map(JSON.parse(stored));
    } catch { /* ignore */ }
    return new Map();
  };

  const [lastReadMap, setLastReadMap] = createSignal<Map<string, string>>(getLastReadMap());

  const markRead = (convoId: string) => {
    const updated = new Map(lastReadMap());
    updated.set(convoId, new Date().toISOString());
    setLastReadMap(updated);
    try {
      localStorage.setItem("friendly-last-read", JSON.stringify([...updated]));
    } catch { /* ignore */ }
    updateUnreadBadge();
  };

  const isUnread = (row: ConversationRow): boolean => {
    if (!row.latestMessage) return false;
    if (row.latestMessage.sender_id === myId()) return false;
    const lastRead = lastReadMap().get(row.conversation.id);
    if (!lastRead) return true;
    return new Date(row.latestMessage.created_at) > new Date(lastRead);
  };

  const updateUnreadBadge = () => {
    const blocked = blockedIds();
    const filtered = rows().filter((r) => {
      if (r.conversation.type === "group") return true;
      return !blocked.has(r.otherUser.id);
    });
    const unread = filtered.some((r) => isUnread(r));
    setHasUnread(unread);
  };

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    messages();
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" });
    }
  });

  // Filtered rows (block filter)
  const filteredRows = () => {
    const blocked = blockedIds();
    return rows().filter((r) => {
      if (r.conversation.type === "group") return true;
      return !blocked.has(r.otherUser.id);
    });
  };

  const isGroupConvo = () => activeConvo()?.conversation.type === "group";

  const getConvoDisplayName = (row: ConversationRow) => {
    if (row.conversation.type === "group") {
      return row.conversation.group_name ?? "Group Chat";
    }
    return row.otherUser.name;
  };

  const getSenderName = (msg: Message): string | null => {
    const convo = activeConvo();
    if (!convo || convo.conversation.type !== "group") return null;
    if (msg.sender_id === myId()) return null;
    const profiles = convo.participantProfiles;
    if (profiles) {
      const p = profiles.get(msg.sender_id);
      if (p) return p.name.split(" ")[0];
    }
    return "Unknown";
  };

  // Fetch mutual friends for new chat / group creation
  const fetchMutualFriends = async () => {
    const id = myId();
    if (!id) return;
    setLoadingFriends(true);
    try {
      const { data } = await supabase.rpc("get_mutual_friends", { my_id: id });
      setMutualFriends((data ?? []) as UserProfile[]);
    } catch {
      // RPC might not exist yet — fallback to manual query
      const { data: waves } = await supabase
        .from("waves")
        .select("target_id")
        .eq("user_id", id);
      const myTargets = new Set((waves ?? []).map((w: any) => w.target_id));

      const { data: incoming } = await supabase
        .from("waves")
        .select("user_id")
        .eq("target_id", id);
      const mutualIds = (incoming ?? [])
        .map((w: any) => w.user_id)
        .filter((uid: string) => myTargets.has(uid));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("users")
          .select("id, name, avatar_url, verified")
          .in("id", mutualIds);
        setMutualFriends((profiles ?? []) as UserProfile[]);
      } else {
        setMutualFriends([]);
      }
    }
    setLoadingFriends(false);
  };

  const fetchConversations = async () => {
    const id = myId();
    if (!id) return;

    setLoadingList(true);

    const { data: convos, error } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [id]);

    if (error) {
      showToast("Failed to load conversations");
      setRows([]);
      setLoadingList(false);
      return;
    }

    if (!convos || convos.length === 0) {
      setRows([]);
      setLoadingList(false);
      return;
    }

    const otherIds = [
      ...new Set(
        convos.flatMap((c: Conversation) =>
          c.participants.filter((p: string) => p !== id)
        )
      ),
    ];

    // Fetch other users' profiles + own profile in parallel
    const [{ data: profiles }, { data: meProfData }] = await Promise.all([
      supabase.from("users").select("id, name, avatar_url, verified").in("id", otherIds),
      supabase.from("users").select("id, name, avatar_url, verified").eq("id", id).maybeSingle(),
    ]);

    if (meProfData) setMyProfile(meProfData as UserProfile);

    const profileMap = new Map<string, UserProfile>();
    (profiles ?? []).forEach((p: UserProfile) => profileMap.set(p.id, p));

    const rowPromises = convos.map(async (convo: Conversation) => {
      const { data: latestMsg } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convo.type === "group") {
        const groupProfiles = new Map<string, UserProfile>();
        convo.participants
          .filter((p: string) => p !== id)
          .forEach((pid: string) => {
            const prof = profileMap.get(pid);
            if (prof) groupProfiles.set(pid, prof);
          });

        const firstOther = groupProfiles.values().next().value;
        return {
          conversation: convo,
          otherUser: firstOther ?? { id: "", name: convo.group_name ?? "Group", avatar_url: null, verified: false },
          participantProfiles: groupProfiles,
          latestMessage: latestMsg as Message | null,
        } as ConversationRow;
      }

      const otherId = convo.participants.find((p: string) => p !== id) ?? "";
      const otherUser = profileMap.get(otherId) ?? {
        id: otherId,
        name: "Unknown",
        avatar_url: null,
        verified: false,
      };

      return {
        conversation: convo,
        otherUser,
        latestMessage: latestMsg as Message | null,
      } as ConversationRow;
    });

    const allRows = await Promise.all(rowPromises);

    allRows.sort((a, b) => {
      const aTime = a.latestMessage?.created_at ?? a.conversation.created_at;
      const bTime = b.latestMessage?.created_at ?? b.conversation.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setRows(allRows);
    setLoadingList(false);
    updateUnreadBadge();

    if (listChannel) supabase.removeChannel(listChannel);
    const convoIds = allRows.map((r) => r.conversation.id);
    if (convoIds.length > 0) {
      listChannel = supabase
        .channel("chat-list-" + id)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const newMsg = payload.new as Message;
            if (!convoIds.includes(newMsg.conversation_id)) return;
            setRows((prev) => {
              const updated = prev.map((r) =>
                r.conversation.id === newMsg.conversation_id
                  ? { ...r, latestMessage: newMsg }
                  : r
              );
              updated.sort((a, b) => {
                const aTime = a.latestMessage?.created_at ?? a.conversation.created_at;
                const bTime = b.latestMessage?.created_at ?? b.conversation.created_at;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
              });
              return updated;
            });
            updateUnreadBadge();
          }
        )
        .subscribe();
    }
  };

  const openConversation = async (row: ConversationRow) => {
    markRead(row.conversation.id);
    setActiveConvo(row);
    setLoadingMessages(true);
    setMessages([]);
    setIsOtherTyping(false);
    setOtherReadAt(null);

    // For group chats, fetch all participant profiles if not loaded
    if (row.conversation.type === "group" && !row.participantProfiles) {
      const otherIds = row.conversation.participants.filter((p) => p !== myId());
      const { data: profiles } = await supabase
        .from("users")
        .select("id, name, avatar_url, verified")
        .in("id", otherIds);
      const profMap = new Map<string, UserProfile>();
      (profiles ?? []).forEach((p: UserProfile) => profMap.set(p.id, p));
      setActiveConvo({ ...row, participantProfiles: profMap });
    }

    // Fetch all messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", row.conversation.id)
      .order("created_at", { ascending: true });

    setMessages((msgs as Message[]) ?? []);
    setLoadingMessages(false);

    // Upsert own read receipt
    supabase.from("message_reads").upsert({
      conversation_id: row.conversation.id,
      reader_id: myId(),
      last_read_at: new Date().toISOString(),
    }).then(() => {});

    // For direct chats, fetch other user's read receipt
    if (row.conversation.type === "direct") {
      const otherId = row.otherUser.id;
      const { data: readData } = await supabase
        .from("message_reads")
        .select("last_read_at")
        .eq("conversation_id", row.conversation.id)
        .eq("reader_id", otherId)
        .maybeSingle();
      if (readData) setOtherReadAt((readData as any).last_read_at);
    }

    // Subscribe to realtime messages + typing + read receipts
    channel = supabase
      .channel("messages-" + row.conversation.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: "conversation_id=eq." + row.conversation.id,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          markRead(row.conversation.id);
          supabase.from("message_reads").upsert({
            conversation_id: row.conversation.id,
            reader_id: myId(),
            last_read_at: new Date().toISOString(),
          }).then(() => {});
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: "conversation_id=eq." + row.conversation.id,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reads",
          filter: "conversation_id=eq." + row.conversation.id,
        },
        (payload) => {
          const record = payload.new as any;
          if (record && record.reader_id !== myId()) {
            setOtherReadAt(record.last_read_at);
          }
        }
      )
      .on("broadcast", { event: "typing" }, (payload: any) => {
        if (payload.payload?.user_id !== myId()) {
          setIsOtherTyping(true);
          clearTimeout(typingTimeout);
          typingTimeout = window.setTimeout(() => setIsOtherTyping(false), 3500);
        }
      })
      .subscribe();
  };

  const closeConversation = () => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    setActiveConvo(null);
    setMessages([]);
    setInputText("");
    setIsOtherTyping(false);
    setOtherReadAt(null);
    setShowGroupMembers(false);
    setSearchParams({ with: undefined });
  };

  const broadcastTyping = () => {
    if (!channel) return;
    clearTimeout(typingSendTimeout);
    typingSendTimeout = window.setTimeout(() => {
      channel?.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: myId() },
      });
    }, 300);
  };

  const sendMessage = async () => {
    const content = inputText().trim();
    const convo = activeConvo();
    if (!content || !convo) return;

    const id = myId();
    setInputText("");

    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      conversation_id: convo.conversation.id,
      sender_id: id,
      content,
      type: "text",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convo.conversation.id,
        sender_id: id,
        content,
        type: "text",
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      showToast("Failed to send message");
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m))
      );
    }

    supabase.from("message_reads").upsert({
      conversation_id: convo.conversation.id,
      reader_id: id,
      last_read_at: new Date().toISOString(),
    }).then(() => {});
  };

  const deleteMessage = async () => {
    const msgId = longPressMsg();
    if (!msgId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, deleted_at: new Date().toISOString(), content: "" } : m
      )
    );
    setLongPressMsg(null);

    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", msgId)
      .eq("sender_id", myId());

    if (error) {
      showToast("Failed to delete message");
    }
  };

  // New chat: open friend picker
  const openNewChat = () => {
    setShowNewChat(true);
    fetchMutualFriends();
  };

  const startDirectChat = (friendId: string) => {
    setShowNewChat(false);
    setSearchParams({ with: friendId });
    handleWithParam();
  };

  // Group creation
  const openCreateGroup = () => {
    setShowNewChat(false);
    setShowCreateGroup(true);
    setGroupName("");
    setSelectedFriends(new Set());
    if (mutualFriends().length === 0) fetchMutualFriends();
  };

  const toggleFriendSelect = (id: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createGroup = async () => {
    const id = myId();
    if (!id || !groupName().trim() || selectedFriends().size === 0) return;

    const participants = [id, ...selectedFriends()];

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        participants,
        group_name: groupName().trim(),
      })
      .select()
      .single();

    if (error) {
      showToast("Failed to create group");
      return;
    }

    setShowCreateGroup(false);
    setGroupName("");
    setSelectedFriends(new Set());
    await fetchConversations();

    // Open the new group
    const newRow = rows().find((r) => r.conversation.id === (data as Conversation).id);
    if (newRow) openConversation(newRow);
  };

  // Add member to group
  const addMemberToGroup = async (friendId: string) => {
    const convo = activeConvo();
    if (!convo || convo.conversation.type !== "group") return;

    const updatedParticipants = [...convo.conversation.participants, friendId];

    const { error } = await supabase
      .from("conversations")
      .update({ participants: updatedParticipants })
      .eq("id", convo.conversation.id);

    if (error) {
      showToast("Failed to add member");
      return;
    }

    // Fetch the new member's profile
    const { data: prof } = await supabase
      .from("users")
      .select("id, name, avatar_url, verified")
      .eq("id", friendId)
      .maybeSingle();

    if (prof) {
      const updated = { ...convo };
      updated.conversation = { ...convo.conversation, participants: updatedParticipants };
      const newProfiles = new Map(convo.participantProfiles ?? []);
      newProfiles.set(friendId, prof as UserProfile);
      updated.participantProfiles = newProfiles;
      setActiveConvo(updated);
    }

    setShowAddMember(false);
    showToast("Member added", "success");
  };

  let groupPhotoInputRef: HTMLInputElement | undefined;

  const handleGroupPhotoUpload = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    const convo = activeConvo();
    if (!file || !convo) return;

    setUploadingGroupPhoto(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `group-avatars/${convo.conversation.id}.${ext}`;

    // Upload to chat-images bucket
    const { error: uploadErr } = await supabase.storage
      .from("chat-images")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadErr) {
      showToast("Failed to upload photo");
      setUploadingGroupPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("chat-images")
      .getPublicUrl(path);

    const avatarUrl = urlData.publicUrl;

    // Try to update conversation with group_avatar column
    const { error: updateErr } = await supabase
      .from("conversations")
      .update({ group_avatar: avatarUrl })
      .eq("id", convo.conversation.id);

    if (updateErr) {
      console.warn("Could not set group_avatar (run migration):", updateErr.message);
      showToast("Photo uploaded but could not save (run migration)");
    } else {
      // Update local state
      const updated = { ...convo };
      updated.conversation = { ...convo.conversation, group_avatar: avatarUrl };
      setActiveConvo(updated);

      // Update in rows list too
      setRows((prev) =>
        prev.map((r) =>
          r.conversation.id === convo.conversation.id
            ? { ...r, conversation: { ...r.conversation, group_avatar: avatarUrl } }
            : r
        )
      );

      showToast("Group photo updated", "success");
    }

    setUploadingGroupPhoto(false);
    if (groupPhotoInputRef) groupPhotoInputRef.value = "";
  };

  const handleWithParam = async () => {
    const withUserId = searchParams.with;
    const id = myId();
    if (!withUserId || !id || withUserId === id) return;

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .contains("participants", [id, withUserId])
      .eq("type", "direct")
      .maybeSingle();

    let convo: Conversation;
    if (existing) {
      convo = existing as Conversation;
    } else {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ type: "direct", participants: [id, withUserId] })
        .select()
        .single();

      if (error || !created) return;
      convo = created as Conversation;
    }

    const { data: otherProfile } = await supabase
      .from("users")
      .select("id, name, avatar_url, verified")
      .eq("id", withUserId)
      .maybeSingle();

    const otherUser: UserProfile = (otherProfile as UserProfile) ?? {
      id: withUserId,
      name: "Unknown",
      avatar_url: null,
      verified: false,
    };

    const row: ConversationRow = {
      conversation: convo,
      otherUser,
      latestMessage: null,
    };

    await openConversation(row);
  };

  const handleConvoParam = async () => {
    const convoId = searchParams.convo;
    if (!convoId) return;

    // Wait for conversations to load, then find and open this conversation
    const row = rows().find((r) => r.conversation.id === convoId);
    if (row) {
      openConversation(row);
    } else {
      // Conversation might not be in the list yet — fetch it directly
      const { data: convo } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", convoId)
        .maybeSingle();

      if (convo) {
        const id = myId();
        const otherIds = (convo as Conversation).participants.filter((p: string) => p !== id);
        const { data: profiles } = await supabase
          .from("users")
          .select("id, name, avatar_url, verified")
          .in("id", otherIds.length > 0 ? otherIds : [id]);

        const profileMap = new Map<string, UserProfile>();
        (profiles ?? []).forEach((p: UserProfile) => profileMap.set(p.id, p));

        const groupProfiles = new Map<string, UserProfile>();
        otherIds.forEach((pid: string) => {
          const prof = profileMap.get(pid);
          if (prof) groupProfiles.set(pid, prof);
        });

        const firstOther = groupProfiles.values().next().value;
        const convoRow: ConversationRow = {
          conversation: convo as Conversation,
          otherUser: firstOther ?? { id: "", name: (convo as Conversation).group_name ?? "Group", avatar_url: null, verified: false },
          participantProfiles: (convo as Conversation).type === "group" ? groupProfiles : undefined,
          latestMessage: null,
        };
        openConversation(convoRow);
      }
    }
  };

  onMount(async () => {
    await fetchConversations();
    if (searchParams.convo) {
      await handleConvoParam();
    } else if (searchParams.with) {
      await handleWithParam();
    }
  });

  onCleanup(() => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    if (listChannel) {
      supabase.removeChannel(listChannel);
      listChannel = null;
    }
    clearTimeout(typingTimeout);
    clearTimeout(typingSendTimeout);
  });

  const getPreviewText = (row: ConversationRow) => {
    if (!row.latestMessage) return "No messages yet";
    if (row.latestMessage.deleted_at) return "Message deleted";
    if (row.latestMessage.type === "image") return "Photo";
    return row.latestMessage.content;
  };

  // Get friends who can be added to the current group
  const getAddableFriends = () => {
    const convo = activeConvo();
    if (!convo) return [];
    const currentParticipants = new Set(convo.conversation.participants);
    return mutualFriends().filter((f) => !currentParticipants.has(f.id));
  };

  return (
    <>
      <Show when={!activeConvo()}>
        {/* Chat List */}
        <div class="nav-header">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="nav-logo"><img src="/icon.png" alt="Friendly" /></div>
            <h1>Chat</h1>
          </div>
          <div
            class="nav-icon"
            style="background:none;font-size:28px;color:var(--primary)"
            onClick={openNewChat}
          >
            +
          </div>
        </div>
        <Show when={!loadingList()} fallback={
          <div style="display:flex;justify-content:center;padding:3rem">
            <div class="loading-spinner" />
          </div>
        }>
          <Show
            when={filteredRows().length > 0}
            fallback={
              <div class="empty-state-rich">
                <div class="empty-state-icon">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="opacity:0.3">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                  </svg>
                </div>
                <div class="empty-state-title">No conversations yet</div>
                <div class="empty-state-sub">Wave at someone on Discover to start chatting!</div>
              </div>
            }
          >
            <div class="chat-list">
              <For each={filteredRows()}>
                {(row) => (
                  <div
                    class="chat-row"
                    onClick={() => openConversation(row)}
                  >
                    <Show when={row.conversation.type === "group"} fallback={
                      <div class={`chat-avatar${row.otherUser.avatar_url ? " avatar-photo" : ""}`}>
                        <Show when={row.otherUser.avatar_url} fallback={getInitials(row.otherUser.name)}>
                          <img src={row.otherUser.avatar_url!} alt={row.otherUser.name} />
                        </Show>
                      </div>
                    }>
                      <Show when={row.conversation.group_avatar} fallback={
                        <div class="chat-avatar group-avatar-icon">
                          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                          </svg>
                        </div>
                      }>
                        <div class="chat-avatar avatar-photo">
                          <img src={row.conversation.group_avatar!} alt={getConvoDisplayName(row)} />
                        </div>
                      </Show>
                    </Show>
                    <div class="chat-body">
                      <div class="chat-name">{getConvoDisplayName(row)}</div>
                      <div class="chat-preview">
                        {getPreviewText(row)}
                      </div>
                    </div>
                    <div class="chat-meta">
                      <div class="chat-time">
                        {row.latestMessage
                          ? formatTime(row.latestMessage.created_at)
                          : ""}
                      </div>
                      <Show when={isUnread(row)}>
                        <div class="chat-unread-dot" />
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      <Show when={activeConvo()}>
        {(convo) => (
          <>
            {/* Conversation View */}
            <div class="convo-header">
              <button class="convo-back" onClick={closeConversation}>
                <svg
                  width="12"
                  height="20"
                  viewBox="0 0 12 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                >
                  <path d="M10 2L2 10l8 8" />
                </svg>
              </button>
              <Show when={convo().conversation.type === "group"} fallback={
                <div
                  class="convo-header-profile"
                  onClick={() => navigate(`/user/${convo().otherUser.id}`)}
                >
                  <div class={`convo-avatar${convo().otherUser.avatar_url ? " avatar-photo" : ""}`}>
                    <Show when={convo().otherUser.avatar_url} fallback={getInitials(convo().otherUser.name)}>
                      <img src={convo().otherUser.avatar_url!} alt={convo().otherUser.name} />
                    </Show>
                  </div>
                  <div>
                    <span class="convo-name">{convo().otherUser.name}</span>
                    <Show when={convo().otherUser.verified}>
                      <span class="convo-verified">&#10003; Verified</span>
                    </Show>
                  </div>
                </div>
              }>
                <div
                  class="convo-header-profile"
                  onClick={() => setShowGroupMembers(true)}
                >
                  <Show when={convo().conversation.group_avatar} fallback={
                    <div class="convo-avatar group-avatar-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                    </div>
                  }>
                    <div class="convo-avatar avatar-photo">
                      <img src={convo().conversation.group_avatar!} alt="Group" />
                    </div>
                  </Show>
                  <div>
                    <span class="convo-name">{convo().conversation.group_name ?? "Group Chat"}</span>
                    <span class="convo-group-count">{convo().conversation.participants.length} members</span>
                  </div>
                </div>
              </Show>
            </div>
            <Show when={loadingMessages()}>
              <div class="loading-screen">
                <div class="loading-spinner" />
              </div>
            </Show>
            <Show when={!loadingMessages()}>
              <div class="convo-messages">
                <For each={messages()}>
                  {(msg) => {
                    const senderName = getSenderName(msg);
                    return (
                      <div>
                        <Show when={senderName}>
                          <div class="group-msg-sender">{senderName}</div>
                        </Show>
                        <div
                          class={`msg ${msg.sender_id === myId() ? "msg-sent" : "msg-received"}${msg.deleted_at ? " msg-deleted" : ""}`}
                          onContextMenu={(e) => {
                            if (msg.sender_id === myId() && !msg.deleted_at) {
                              e.preventDefault();
                              setLongPressMsg(msg.id);
                            }
                          }}
                        >
                          <Show when={msg.deleted_at}>
                            <span class="msg-deleted-text">Message deleted</span>
                          </Show>
                          <Show when={!msg.deleted_at && msg.type === "image" && msg.media_url}>
                            <img
                              src={msg.media_url!}
                              alt="Photo"
                              class="msg-image"
                              onClick={() => window.open(msg.media_url!, "_blank")}
                            />
                          </Show>
                          <Show when={!msg.deleted_at && msg.type !== "image"}>
                            {msg.content}
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>

                {/* Read receipt (direct chats only) */}
                <Show when={!isGroupConvo() && otherReadAt()}>
                  {(() => {
                    const allMsgs = messages();
                    const lastSent = [...allMsgs].reverse().find(
                      (m) => m.sender_id === myId() && !m.deleted_at
                    );
                    if (lastSent && new Date(otherReadAt()!) >= new Date(lastSent.created_at)) {
                      return <div class="msg-read-receipt">Read</div>;
                    }
                    return null;
                  })()}
                </Show>

                {/* Typing indicator */}
                <Show when={isOtherTyping()}>
                  <div class="typing-indicator-chat">
                    <span /><span /><span />
                  </div>
                </Show>

                <div ref={messagesEndRef!} />
              </div>
            </Show>
            <div class="convo-input">
              <input
                type="text"
                placeholder="Message"
                value={inputText()}
                onInput={(e) => {
                  setInputText(e.currentTarget.value);
                  broadcastTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                class="send-btn"
                onClick={sendMessage}
                disabled={!inputText().trim()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </Show>

      {/* Delete message sheet */}
      <Show when={longPressMsg()}>
        <div class="modal-overlay" onClick={() => setLongPressMsg(null)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div class="action-sheet-option danger" onClick={deleteMessage}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              Delete Message
            </div>
            <div class="action-sheet-option" onClick={() => setLongPressMsg(null)}>
              Cancel
            </div>
          </div>
        </div>
      </Show>

      {/* New Chat Sheet */}
      <Show when={showNewChat()}>
        <div class="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>New Chat</h2>

            {/* Create Group option */}
            <div class="action-sheet-option" onClick={openCreateGroup}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              Create Group
            </div>

            <div style="border-top:1px solid var(--border);margin:8px 0" />

            <Show when={!loadingFriends()} fallback={
              <div style="display:flex;justify-content:center;padding:2rem">
                <div class="loading-spinner" />
              </div>
            }>
              <Show when={mutualFriends().length > 0} fallback={
                <div style="text-align:center;padding:1.5rem;color:var(--text-secondary);font-size:14px">
                  No mutual waves yet. Wave at someone first!
                </div>
              }>
                <div class="friend-picker-list">
                  <For each={mutualFriends()}>
                    {(friend) => (
                      <div class="friend-picker-item" onClick={() => startDirectChat(friend.id)}>
                        <div class={`friend-picker-avatar${friend.avatar_url ? " avatar-photo" : ""}`}>
                          <Show when={friend.avatar_url} fallback={getInitials(friend.name)}>
                            <img src={friend.avatar_url!} alt={friend.name} />
                          </Show>
                        </div>
                        <span class="friend-picker-name">{friend.name}</span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </Show>

      {/* Create Group Sheet */}
      <Show when={showCreateGroup()}>
        <div class="modal-overlay" onClick={() => setShowCreateGroup(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Create Group</h2>
            <div class="sheet-field">
              <label>Group Name</label>
              <input
                type="text"
                value={groupName()}
                onInput={(e) => setGroupName(e.currentTarget.value)}
                placeholder="Name your group..."
              />
            </div>
            <div class="sheet-field">
              <label>Add Friends</label>
            </div>
            <Show when={!loadingFriends()} fallback={
              <div style="display:flex;justify-content:center;padding:1rem">
                <div class="loading-spinner" />
              </div>
            }>
              <div class="friend-selector-list">
                <For each={mutualFriends()}>
                  {(friend) => {
                    const isSelected = () => selectedFriends().has(friend.id);
                    return (
                      <div
                        class={`friend-selector-item${isSelected() ? " friend-selected" : ""}`}
                        onClick={() => toggleFriendSelect(friend.id)}
                      >
                        <div class={`friend-picker-avatar${friend.avatar_url ? " avatar-photo" : ""}`}>
                          <Show when={friend.avatar_url} fallback={getInitials(friend.name)}>
                            <img src={friend.avatar_url!} alt={friend.name} />
                          </Show>
                        </div>
                        <span class="friend-picker-name">{friend.name}</span>
                        <div class={`friend-check${isSelected() ? " friend-check-active" : ""}`}>
                          <Show when={isSelected()}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </Show>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </Show>
            <div class="sheet-actions">
              <button
                class="sheet-btn sheet-btn-cancel"
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>
              <button
                class="sheet-btn sheet-btn-submit"
                onClick={createGroup}
                disabled={!groupName().trim() || selectedFriends().size === 0}
              >
                Create ({selectedFriends().size})
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Hidden file input for group photo upload */}
      <input
        type="file"
        accept="image/*"
        ref={groupPhotoInputRef}
        style="display:none"
        onChange={handleGroupPhotoUpload}
      />

      {/* Group Members Sheet */}
      <Show when={showGroupMembers()}>
        <div class="modal-overlay" onClick={() => setShowGroupMembers(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Group photo upload area */}
            <div class="group-photo-upload" onClick={() => groupPhotoInputRef?.click()}>
              <Show when={activeConvo()?.conversation.group_avatar} fallback={
                <div class="group-photo-placeholder">
                  <Show when={!uploadingGroupPhoto()} fallback={
                    <div class="loading-spinner" style="width:24px;height:24px" />
                  }>
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <div class="group-photo-camera">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                        <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                      </svg>
                    </div>
                  </Show>
                </div>
              }>
                <div class="group-photo-img">
                  <Show when={!uploadingGroupPhoto()} fallback={
                    <div class="group-photo-uploading-overlay">
                      <div class="loading-spinner" style="width:24px;height:24px" />
                    </div>
                  }>
                    <img src={activeConvo()!.conversation.group_avatar!} alt="Group" />
                    <div class="group-photo-camera">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                        <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                      </svg>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>

            <h2 style="text-align:center;margin-top:8px">{activeConvo()?.conversation.group_name ?? "Group"}</h2>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;text-align:center">
              {activeConvo()?.conversation.participants.length} members
            </p>

            <div class="friend-picker-list">
              {/* Show yourself */}
              <div class="friend-picker-item" style="opacity:0.7">
                <div class={`friend-picker-avatar${myProfile()?.avatar_url ? " avatar-photo" : ""}`}>
                  <Show when={myProfile()?.avatar_url} fallback={getInitials(myProfile()?.name ?? "You")}>
                    <img src={myProfile()!.avatar_url!} alt="You" />
                  </Show>
                </div>
                <span class="friend-picker-name">{myProfile()?.name ?? "You"}</span>
                <span style="margin-left:auto;font-size:12px;color:var(--text-secondary)">You</span>
              </div>

              {/* Show other members */}
              <For each={[...(activeConvo()?.participantProfiles?.values() ?? [])]}>
                {(member) => (
                  <div
                    class="friend-picker-item"
                    onClick={() => navigate(`/user/${member.id}`)}
                  >
                    <div class={`friend-picker-avatar${member.avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={member.avatar_url} fallback={getInitials(member.name)}>
                        <img src={member.avatar_url!} alt={member.name} />
                      </Show>
                    </div>
                    <span class="friend-picker-name">{member.name}</span>
                  </div>
                )}
              </For>
            </div>

            {/* Add Member button */}
            <div
              class="action-sheet-option"
              style="margin-top:8px;color:var(--primary)"
              onClick={() => {
                setShowGroupMembers(false);
                setShowAddMember(true);
                fetchMutualFriends();
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Add Member
            </div>
          </div>
        </div>
      </Show>

      {/* Add Member Sheet */}
      <Show when={showAddMember()}>
        <div class="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Add Member</h2>
            <Show when={!loadingFriends()} fallback={
              <div style="display:flex;justify-content:center;padding:2rem">
                <div class="loading-spinner" />
              </div>
            }>
              <Show when={getAddableFriends().length > 0} fallback={
                <div style="text-align:center;padding:1.5rem;color:var(--text-secondary);font-size:14px">
                  No more friends to add
                </div>
              }>
                <div class="friend-picker-list">
                  <For each={getAddableFriends()}>
                    {(friend) => (
                      <div class="friend-picker-item" onClick={() => addMemberToGroup(friend.id)}>
                        <div class={`friend-picker-avatar${friend.avatar_url ? " avatar-photo" : ""}`}>
                          <Show when={friend.avatar_url} fallback={getInitials(friend.name)}>
                            <img src={friend.avatar_url!} alt={friend.name} />
                          </Show>
                        </div>
                        <span class="friend-picker-name">{friend.name}</span>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--primary)" style="margin-left:auto">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </>
  );
};

export default Chat;
