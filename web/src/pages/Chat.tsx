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
  const [uploading, setUploading] = createSignal(false);
  const [longPressMsg, setLongPressMsg] = createSignal<string | null>(null);

  let messagesEndRef!: HTMLDivElement;
  let fileInputRef!: HTMLInputElement;
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
    const filtered = rows().filter((r) => !blocked.has(r.otherUser.id));
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
    return rows().filter((r) => !blocked.has(r.otherUser.id));
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

    const { data: profiles } = await supabase
      .from("users")
      .select("id, name, avatar_url, verified")
      .in("id", otherIds);

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

    // Fetch all messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", row.conversation.id)
      .order("created_at", { ascending: true });

    setMessages((msgs as Message[]) ?? []);
    setLoadingMessages(false);

    // Upsert own read receipt
    const otherId = row.otherUser.id;
    supabase.from("message_reads").upsert({
      conversation_id: row.conversation.id,
      reader_id: myId(),
      last_read_at: new Date().toISOString(),
    }).then(() => {});

    // Fetch other user's read receipt
    const { data: readData } = await supabase
      .from("message_reads")
      .select("last_read_at")
      .eq("conversation_id", row.conversation.id)
      .eq("reader_id", otherId)
      .maybeSingle();
    if (readData) setOtherReadAt((readData as any).last_read_at);

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
          // Mark as read if we're viewing the conversation
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
          // Handle message updates (soft delete)
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

    // Update own read receipt
    supabase.from("message_reads").upsert({
      conversation_id: convo.conversation.id,
      reader_id: id,
      last_read_at: new Date().toISOString(),
    }).then(() => {});
  };

  const sendImage = async (file: File) => {
    const convo = activeConvo();
    if (!convo) return;

    setUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${convo.conversation.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("chat-images")
      .upload(path, file, { contentType: file.type });

    if (uploadErr) {
      showToast("Failed to upload image");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);

    const { error } = await supabase.from("messages").insert({
      conversation_id: convo.conversation.id,
      sender_id: myId(),
      content: "Photo",
      type: "image",
      media_url: urlData.publicUrl,
    });

    if (error) showToast("Failed to send image");
    setUploading(false);
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

  const isLastSentMessage = (msg: Message) => {
    const allMsgs = messages();
    const sentMsgs = allMsgs.filter((m) => m.sender_id === myId() && !m.deleted_at);
    return sentMsgs.length > 0 && sentMsgs[sentMsgs.length - 1].id === msg.id;
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

  onMount(async () => {
    await fetchConversations();
    if (searchParams.with) {
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

  return (
    <>
      <Show when={!activeConvo()}>
        {/* Chat List */}
        <div class="nav-header">
          <h1>Chat</h1>
        </div>
        <Show when={!loadingList()} fallback={
          <div style="display:flex;justify-content:center;padding:3rem">
            <div class="loading-spinner" />
          </div>
        }>
          <Show
            when={filteredRows().length > 0}
            fallback={
              <div class="empty-state">
                No conversations yet. Wave at someone on Discover!
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
                    <div class={`chat-avatar${row.otherUser.avatar_url ? " avatar-photo" : ""}`}>
                      <Show when={row.otherUser.avatar_url} fallback={getInitials(row.otherUser.name)}>
                        <img src={row.otherUser.avatar_url!} alt={row.otherUser.name} />
                      </Show>
                    </div>
                    <div class="chat-body">
                      <div class="chat-name">{row.otherUser.name}</div>
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
                  )}
                </For>

                {/* Read receipt */}
                <Show when={otherReadAt()}>
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
    </>
  );
};

export default Chat;
