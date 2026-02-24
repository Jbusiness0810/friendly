import { For, Show, type Component } from "solid-js";
import { useAuth } from "../stores/auth";
import { getUserInitials, allBadges } from "../types";
import { calculateLevel, pointsToNextLevel } from "../services/gamification";
import { StatCard, LevelProgress } from "../components/StatCard";
import { BadgeCard } from "../components/BadgeCard";

const ProfilePage: Component = () => {
  const { currentUser, signOut } = useAuth();

  const user = () => currentUser();
  const initials = () => user() ? getUserInitials(user()!.displayName) : "";
  const level = () => calculateLevel(user()?.points ?? 0);
  const progress = () => pointsToNextLevel(user()?.points ?? 0);

  const earnedBadges = () => {
    const ids = new Set(user()?.badges ?? []);
    return allBadges.filter((b) => ids.has(b.id));
  };

  return (
    <div class="flex flex-col gap-6 pb-6">
      {/* Header */}
      <div class="flex flex-col items-center pt-4 gap-3">
        <div class="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <span class="text-3xl font-bold text-green-600">{initials()}</span>
        </div>
        <h1 class="text-xl font-bold">{user()?.displayName}</h1>
        <Show when={user()?.bio}>
          <p class="text-sm text-gray-500 text-center px-10">{user()!.bio}</p>
        </Show>
      </div>

      {/* Stats grid */}
      <div class="grid grid-cols-3 gap-3 px-4">
        <StatCard value={String(user()?.circleIds.length ?? 0)} label="Circles" />
        <StatCard value="0" label="Events" />
        <StatCard value="0" label="Friends" />
      </div>

      {/* Level progress */}
      <LevelProgress
        level={level()}
        points={user()?.points ?? 0}
        progress={progress().progress}
      />

      {/* Interests */}
      <Show when={(user()?.interests.length ?? 0) > 0}>
        <div class="px-4">
          <h2 class="font-semibold mb-2">Interests</h2>
          <div class="flex flex-wrap gap-2">
            <For each={user()?.interests}>
              {(interest) => (
                <span class="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                  {interest}
                </span>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Badges */}
      <Show when={earnedBadges().length > 0}>
        <div class="px-4">
          <div class="flex justify-between items-center mb-2">
            <h2 class="font-semibold">Badges</h2>
            <span class="text-xs text-gray-400">
              {earnedBadges().length}/{allBadges.length}
            </span>
          </div>
          <div class="flex gap-3 overflow-x-auto pb-1">
            <For each={earnedBadges()}>
              {(badge) => <BadgeCard badge={badge} />}
            </For>
          </div>
        </div>
      </Show>

      {/* Sign out */}
      <div class="px-4 mt-4">
        <button
          class="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          onClick={signOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
