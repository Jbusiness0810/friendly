import {
  createSignal,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
  type Component,
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { showToast } from "../lib/toast";

interface Conversation {
  id: string;
  type: "direct" | "group";
  participants: string[];
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
  created_at: string;
}

interface ConversationRow {
  conversation: Conversation;
  otherUser: UserProfile;
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

  const [rows, setRows] = createSignal<ConversationRow[]>([]);
  const [loadingList, setLoadingList] = createSignal(true);
  const [activeConvo, setActiveConvo] = createSignal<ConversationRow | null>(
    null
  );
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = createSignal(false);
  const [inputText, setInputText] = createSignal("");

  let messagesEndRef!: HTMLDivElement;
  let channel: RealtimeChannel | null = null;

  const myId = () => user()?.id ?? "";

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    messages(); // track dependency
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: "smooth" });
    }
  });

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

    // Collect other participant IDs
    const otherIds = [
      ...new Set(
        convos.flatMap((c: Conversation) =>
          c.participants.filter((p: string) => p !== id)
        )
      ),
    ];

    // Fetch other users' profiles
    const { data: profiles } = await supabase
      .from("users")
      .select("id, name, avatar_url, verified")
      .in("id", otherIds);

    const profileMap = new Map<string, UserProfile>();
    (profiles ?? []).forEach((p: UserProfile) => profileMap.set(p.id, p));

    // Fetch latest message for each conversation
    const rowPromises = convos.map(async (convo: Conversation) => {
      const { data: latestMsg } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

    // Sort by latest message time (most recent first)
    allRows.sort((a, b) => {
      const aTime = a.latestMessage?.created_at ?? a.conversation.created_at;
      const bTime = b.latestMessage?.created_at ?? b.conversation.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setRows(allRows);
    setLoadingList(false);
  };

  const openConversation = async (row: ConversationRow) => {
    setActiveConvo(row);
    setLoadingMessages(true);
    setMessages([]);

    // Fetch all messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", row.conversation.id)
      .order("created_at", { ascending: true });

    setMessages((msgs as Message[]) ?? []);
    setLoadingMessages(false);

    // Subscribe to realtime
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
          // Avoid duplicates from optimistic insert
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
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
    // Clear search params when going back
    setSearchParams({ with: undefined });
  };

  const sendMessage = async () => {
    const content = inputText().trim();
    const convo = activeConvo();
    if (!content || !convo) return;

    const id = myId();
    setInputText("");

    // Optimistic insert
    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      conversation_id: convo.conversation.id,
      sender_id: id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convo.conversation.id,
        sender_id: id,
        content,
      })
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      showToast("Failed to send message");
      return;
    }

    // Replace optimistic message with real one
    if (data) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (data as Message) : m))
      );
    }
  };

  const handleWithParam = async () => {
    const withUserId = searchParams.with;
    const id = myId();
    if (!withUserId || !id || withUserId === id) return;

    // Find existing conversation with that user
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
      // Create a new conversation
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ type: "direct", participants: [id, withUserId] })
        .select()
        .single();

      if (error || !created) return;
      convo = created as Conversation;
    }

    // Fetch the other user's profile
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

  onMount(async () => {
    await fetchConversations();

    // Handle ?with=userId param
    if (searchParams.with) {
      await handleWithParam();
    }
  });

  onCleanup(() => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  });

  return (
    <>
      <Show when={!activeConvo()}>
        {/* Chat List */}
        <div class="nav-header">
          <h1>Chat</h1>
        </div>
        <Show when={loadingList()}>
          <div class="loading-screen">
            <div class="loading-spinner" />
          </div>
        </Show>
        <Show when={!loadingList()}>
          <Show
            when={rows().length > 0}
            fallback={
              <div
                style={{
                  padding: "2rem",
                  "text-align": "center",
                  color: "var(--text-secondary)",
                }}
              >
                No conversations yet. Wave at someone on Discover!
              </div>
            }
          >
            <div>
              <For each={rows()}>
                {(row) => (
                  <div
                    class="chat-row"
                    onClick={() => openConversation(row)}
                  >
                    <div class={`chat-avatar${row.otherUser.avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={row.otherUser.avatar_url} fallback={getInitials(row.otherUser.name)}>
                        <img src={row.otherUser.avatar_url!} alt={row.otherUser.name} />
                      </Show>
                    </div>
                    <div class="chat-body">
                      <div class="chat-name">{row.otherUser.name}</div>
                      <div class="chat-preview">
                        {row.latestMessage?.content ?? "No messages yet"}
                      </div>
                    </div>
                    <div class="chat-meta">
                      <div class="chat-time">
                        {row.latestMessage
                          ? formatTime(row.latestMessage.created_at)
                          : ""}
                      </div>
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
            <Show when={loadingMessages()}>
              <div class="loading-screen">
                <div class="loading-spinner" />
              </div>
            </Show>
            <Show when={!loadingMessages()}>
              <div class="convo-messages">
                <For each={messages()}>
                  {(msg) => (
                    <div
                      class={`msg ${msg.sender_id === myId() ? "msg-sent" : "msg-received"}`}
                    >
                      {msg.content}
                    </div>
                  )}
                </For>
                <div ref={messagesEndRef!} />
              </div>
            </Show>
            <div class="convo-input">
              <input
                type="text"
                placeholder="Message"
                value={inputText()}
                onInput={(e) => setInputText(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button class="send-btn" onClick={sendMessage}>
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
    </>
  );
};

export default Chat;
