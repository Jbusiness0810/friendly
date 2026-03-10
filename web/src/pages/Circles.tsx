import { createSignal, onMount, Show, For, type Component } from "solid-js";
import { useAuth } from "../context/AuthContext";
import type { UserProfile } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { showToast } from "../lib/toast";
import { useNavigate } from "@solidjs/router";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  category: string;
  avatar_url: string | null;
  creator_id: string;
  created_at: string;
  member_count?: number;
}

interface CirclePost {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: UserProfile;
}

const CATEGORY_OPTIONS = [
  "Fitness", "Food & Drinks", "Outdoors", "Gaming",
  "Sports", "Music", "Networking", "Book Club",
  "Parents", "Pets", "Creative", "General",
];

const Circles: Component = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = createSignal<"discover" | "my">("discover");
  const [circles, setCircles] = createSignal<Circle[]>([]);
  const [myCircles, setMyCircles] = createSignal<Circle[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showCreate, setShowCreate] = createSignal(false);
  const [showDetail, setShowDetail] = createSignal<Circle | null>(null);
  const [detailMembers, setDetailMembers] = createSignal<UserProfile[]>([]);
  const [detailPosts, setDetailPosts] = createSignal<CirclePost[]>([]);
  const [isMember, setIsMember] = createSignal(false);
  const [joining, setJoining] = createSignal(false);
  const [newPostContent, setNewPostContent] = createSignal("");
  const [posting, setPosting] = createSignal(false);

  // Create form
  const [createName, setCreateName] = createSignal("");
  const [createDesc, setCreateDesc] = createSignal("");
  const [createCategory, setCreateCategory] = createSignal("General");
  const [creating, setCreating] = createSignal(false);

  onMount(async () => {
    await loadCircles();
  });

  const loadCircles = async () => {
    setLoading(true);
    const me = profile();
    if (!me) return;

    // Load all circles with member counts
    const { data: allCircles } = await supabase
      .from("circles")
      .select("*, circle_members(count)")
      .order("created_at", { ascending: false });

    if (allCircles) {
      const mapped = allCircles.map((c: any) => ({
        ...c,
        member_count: c.circle_members?.[0]?.count ?? 0,
      }));
      setCircles(mapped);
    }

    // Load my circles
    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", me.id);

    if (memberships && allCircles) {
      const myIds = new Set(memberships.map((m: any) => m.circle_id));
      const mine = (allCircles as any[])
        .filter((c) => myIds.has(c.id))
        .map((c: any) => ({
          ...c,
          member_count: c.circle_members?.[0]?.count ?? 0,
        }));
      setMyCircles(mine);
    }

    setLoading(false);
  };

  const createCircle = async () => {
    const me = profile();
    if (!me || !createName().trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("circles")
      .insert({
        name: createName().trim(),
        description: createDesc().trim() || null,
        category: createCategory(),
        creator_id: me.id,
      })
      .select()
      .single();

    if (error || !data) {
      showToast("Failed to create circle");
      setCreating(false);
      return;
    }

    // Auto-join as creator
    await supabase.from("circle_members").insert({
      circle_id: data.id,
      user_id: me.id,
      role: "admin",
    });

    setShowCreate(false);
    setCreateName("");
    setCreateDesc("");
    setCreateCategory("General");
    setCreating(false);
    showToast("Circle created!", "success");
    await loadCircles();
  };

  const openDetail = async (circle: Circle) => {
    const me = profile();
    if (!me) return;
    setShowDetail(circle);

    // Check membership
    const { data: membership } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circle.id)
      .eq("user_id", me.id)
      .maybeSingle();
    setIsMember(!!membership);

    // Load members
    const { data: members } = await supabase
      .from("circle_members")
      .select("user_id")
      .eq("circle_id", circle.id);

    if (members && members.length > 0) {
      const userIds = members.map((m: any) => m.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);
      setDetailMembers((users as UserProfile[]) || []);
    } else {
      setDetailMembers([]);
    }

    // Load posts
    await loadPosts(circle.id);
  };

  const loadPosts = async (circleId: string) => {
    const { data: posts } = await supabase
      .from("circle_posts")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (posts && posts.length > 0) {
      const userIds = [...new Set(posts.map((p: any) => p.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);
      const userMap = new Map((users || []).map((u: any) => [u.id, u]));

      setDetailPosts(
        posts.map((p: any) => ({ ...p, user: userMap.get(p.user_id) }))
      );
    } else {
      setDetailPosts([]);
    }
  };

  const joinCircle = async () => {
    const me = profile();
    const circle = showDetail();
    if (!me || !circle) return;
    setJoining(true);

    await supabase.from("circle_members").insert({
      circle_id: circle.id,
      user_id: me.id,
      role: "member",
    });

    setIsMember(true);
    setJoining(false);
    showToast("Joined circle!", "success");
    await loadCircles();
    // Refresh members
    await openDetail(circle);
  };

  const leaveCircle = async () => {
    const me = profile();
    const circle = showDetail();
    if (!me || !circle) return;

    await supabase
      .from("circle_members")
      .delete()
      .eq("circle_id", circle.id)
      .eq("user_id", me.id);

    setIsMember(false);
    showToast("Left circle");
    await loadCircles();
  };

  const submitPost = async () => {
    const me = profile();
    const circle = showDetail();
    if (!me || !circle || !newPostContent().trim()) return;
    setPosting(true);

    await supabase.from("circle_posts").insert({
      circle_id: circle.id,
      user_id: me.id,
      content: newPostContent().trim(),
    });

    setNewPostContent("");
    setPosting(false);
    await loadPosts(circle.id);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div class="nav-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="nav-logo"><img src="/icon.png" alt="Friendly" /></div>
          <h1>Circles</h1>
        </div>
        <button class="nav-icon" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>

      <div class="content">
        <div class="circles-tabs">
          <button
            class={`circles-tab${tab() === "discover" ? " active" : ""}`}
            onClick={() => setTab("discover")}
          >
            Discover
          </button>
          <button
            class={`circles-tab${tab() === "my" ? " active" : ""}`}
            onClick={() => setTab("my")}
          >
            My Circles
          </button>
        </div>

        <Show when={loading()}>
          <div style="display:flex;justify-content:center;padding:40px 0">
            <div class="loading-spinner" />
          </div>
        </Show>

        <Show when={!loading()}>
          <Show when={tab() === "discover"}>
            <div class="circles-list">
              <Show
                when={circles().length > 0}
                fallback={
                  <div class="circle-empty">
                    <p>No circles yet. Be the first to create one!</p>
                  </div>
                }
              >
                <For each={circles()}>
                  {(circle) => (
                    <div class="circle-card" onClick={() => openDetail(circle)}>
                      <div class="circle-card-header">
                        <div class="circle-avatar">
                          <Show when={circle.avatar_url} fallback={initials(circle.name)}>
                            <img src={circle.avatar_url!} alt={circle.name} />
                          </Show>
                        </div>
                        <div class="circle-card-info">
                          <div class="circle-card-name">{circle.name}</div>
                          <div class="circle-card-meta">
                            {circle.member_count ?? 0} member{(circle.member_count ?? 0) !== 1 ? "s" : ""} · {circle.category}
                          </div>
                        </div>
                      </div>
                      <Show when={circle.description}>
                        <div class="circle-card-desc">{circle.description}</div>
                      </Show>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </Show>

          <Show when={tab() === "my"}>
            <div class="circles-list">
              <Show
                when={myCircles().length > 0}
                fallback={
                  <div class="circle-empty">
                    <p>You haven't joined any circles yet.</p>
                    <button
                      class="landing-cta"
                      style="max-width:200px;margin:16px auto 0;font-size:14px;padding:10px"
                      onClick={() => setTab("discover")}
                    >
                      Discover Circles
                    </button>
                  </div>
                }
              >
                <For each={myCircles()}>
                  {(circle) => (
                    <div class="circle-card" onClick={() => openDetail(circle)}>
                      <div class="circle-card-header">
                        <div class="circle-avatar">
                          <Show when={circle.avatar_url} fallback={initials(circle.name)}>
                            <img src={circle.avatar_url!} alt={circle.name} />
                          </Show>
                        </div>
                        <div class="circle-card-info">
                          <div class="circle-card-name">{circle.name}</div>
                          <div class="circle-card-meta">
                            {circle.member_count ?? 0} member{(circle.member_count ?? 0) !== 1 ? "s" : ""} · {circle.category}
                          </div>
                        </div>
                      </div>
                      <Show when={circle.description}>
                        <div class="circle-card-desc">{circle.description}</div>
                      </Show>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </Show>
        </Show>
      </div>

      {/* Create Circle Sheet */}
      <Show when={showCreate()}>
        <div class="modal-overlay" onClick={() => setShowCreate(false)}>
          <div class="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Create a Circle</h2>

            <div class="edit-profile-section">
              <label>Name</label>
              <input
                type="text"
                placeholder="e.g. Morning Runners"
                value={createName()}
                onInput={(e) => setCreateName(e.currentTarget.value)}
              />
            </div>

            <div class="edit-profile-section">
              <label>Description</label>
              <textarea
                placeholder="What's this circle about?"
                value={createDesc()}
                onInput={(e) => setCreateDesc(e.currentTarget.value)}
                rows={3}
              />
            </div>

            <div class="edit-profile-section">
              <label>Category</label>
              <div class="edit-chips">
                <For each={CATEGORY_OPTIONS}>
                  {(cat) => (
                    <button
                      class={`onboard-chip${createCategory() === cat ? " selected" : ""}`}
                      onClick={() => setCreateCategory(cat)}
                    >
                      {cat}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="sheet-actions">
              <button class="sheet-btn sheet-btn-cancel" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                class="sheet-btn sheet-btn-submit"
                onClick={createCircle}
                disabled={creating() || !createName().trim()}
              >
                {creating() ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Circle Detail Sheet */}
      <Show when={showDetail()}>
        {(circle) => (
          <div class="modal-overlay" onClick={() => setShowDetail(null)}>
            <div class="bottom-sheet" style="max-height:85vh;overflow-y:auto" onClick={(e) => e.stopPropagation()}>
              <div class="circle-detail-header">
                <div class="circle-detail-avatar">
                  <Show when={circle().avatar_url} fallback={initials(circle().name)}>
                    <img src={circle().avatar_url!} alt={circle().name} />
                  </Show>
                </div>
                <h2 style="margin:0">{circle().name}</h2>
                <div style="font-size:13px;color:var(--text-secondary)">
                  {circle().category} · {circle().member_count ?? 0} member{(circle().member_count ?? 0) !== 1 ? "s" : ""}
                </div>
                <Show when={circle().description}>
                  <p style="font-size:14px;color:var(--text-secondary);text-align:center;line-height:1.4">
                    {circle().description}
                  </p>
                </Show>
              </div>

              {/* Members */}
              <div class="circle-section">
                <h3>Members</h3>
                <div class="circle-members" style="display:flex">
                  <For each={detailMembers().slice(0, 8)}>
                    {(member) => (
                      <div
                        class="circle-member-avatar"
                        onClick={() => navigate(`/user/${member.id}`)}
                        title={member.name}
                      >
                        <Show when={member.avatar_url} fallback={initials(member.name)}>
                          <img src={member.avatar_url!} alt={member.name} />
                        </Show>
                      </div>
                    )}
                  </For>
                  <Show when={detailMembers().length > 8}>
                    <div class="circle-member-avatar circle-member-more">
                      +{detailMembers().length - 8}
                    </div>
                  </Show>
                </div>
              </div>

              {/* Join / Leave */}
              <Show
                when={isMember()}
                fallback={
                  <button
                    class="landing-cta"
                    style="margin-bottom:16px;font-size:15px;padding:12px"
                    onClick={joinCircle}
                    disabled={joining()}
                  >
                    {joining() ? "Joining..." : "Join Circle"}
                  </button>
                }
              >
                {/* Posts - only visible to members */}
                <div class="circle-section">
                  <h3>Posts</h3>
                  <div style="display:flex;gap:8px;margin-bottom:12px">
                    <input
                      type="text"
                      placeholder="Share something with the circle..."
                      style="flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--input-bg);color:var(--text);font-size:14px;font-family:inherit"
                      value={newPostContent()}
                      onInput={(e) => setNewPostContent(e.currentTarget.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitPost(); } }}
                    />
                    <button
                      class="sheet-btn sheet-btn-submit"
                      style="padding:10px 16px;font-size:13px"
                      onClick={submitPost}
                      disabled={posting() || !newPostContent().trim()}
                    >
                      Post
                    </button>
                  </div>

                  <Show
                    when={detailPosts().length > 0}
                    fallback={
                      <div class="circle-empty" style="padding:20px 0">
                        <p>No posts yet. Start the conversation!</p>
                      </div>
                    }
                  >
                    <For each={detailPosts()}>
                      {(post) => (
                        <div class="circle-post">
                          <div class="circle-post-header">
                            <div class="circle-post-avatar">
                              <Show
                                when={post.user?.avatar_url}
                                fallback={post.user ? initials(post.user.name) : "?"}
                              >
                                <img src={post.user!.avatar_url!} alt={post.user!.name} />
                              </Show>
                            </div>
                            <div>
                              <div class="circle-post-name">{post.user?.name ?? "Unknown"}</div>
                              <div class="circle-post-time">{timeAgo(post.created_at)}</div>
                            </div>
                          </div>
                          <div class="circle-post-body">{post.content}</div>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>

                <button
                  class="sheet-btn"
                  style="width:100%;background:none;color:var(--danger, #ff3b30);border:1px solid var(--danger, #ff3b30);margin-bottom:8px"
                  onClick={leaveCircle}
                >
                  Leave Circle
                </button>
              </Show>
            </div>
          </div>
        )}
      </Show>
    </>
  );
};

export default Circles;
