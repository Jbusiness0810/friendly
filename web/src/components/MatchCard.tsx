import { For, Show, type Component } from "solid-js";
import type { Match, FriendlyUser } from "../types";
import { getScorePercentage, getUserInitials } from "../types";

/** Small match card for horizontal carousel on Home feed. */
export const MatchCardSmall: Component<{ match: Match; onClick?: () => void }> = (props) => {
  return (
    <button
      class="flex flex-col items-center gap-2 w-24 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
      onClick={props.onClick}
    >
      <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <span class="text-green-600 text-lg">👤</span>
      </div>
      <span class="text-xs font-medium text-green-600">
        {getScorePercentage(props.match)}% match
      </span>
      <span class="text-[10px] text-gray-400 truncate w-full text-center">
        {props.match.sharedInterests.slice(0, 2).join(", ")}
      </span>
    </button>
  );
};

/** Full match card shown in the card-stack matching interface. */
export const MatchCardFull: Component<{
  match: Match;
  user?: FriendlyUser;
  onAccept: () => void;
  onDecline: () => void;
}> = (props) => {
  const initials = () => (props.user ? getUserInitials(props.user.displayName) : "?");

  return (
    <div class="flex flex-col items-center">
      {/* Profile card */}
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center gap-4">
        <div class="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <span class="text-3xl font-bold text-green-600">{initials()}</span>
        </div>

        <h2 class="text-xl font-bold">
          {props.user?.displayName ?? "Someone nearby"}
        </h2>

        <span class="text-lg font-semibold text-green-600">
          {getScorePercentage(props.match)}% match
        </span>

        <p class="text-sm text-gray-500 text-center">{props.match.matchReason}</p>

        <Show when={props.match.sharedInterests.length > 0}>
          <div class="flex flex-col items-center gap-2 mt-2">
            <span class="text-xs text-gray-400">Shared Interests</span>
            <div class="flex flex-wrap justify-center gap-1.5">
              <For each={props.match.sharedInterests}>
                {(interest) => (
                  <span class="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full">
                    {interest}
                  </span>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>

      {/* Action buttons */}
      <div class="flex gap-10 mt-8">
        <button
          class="w-16 h-16 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-2xl transition-colors"
          onClick={props.onDecline}
          aria-label="Decline match"
        >
          ✕
        </button>
        <button
          class="w-16 h-16 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center text-2xl transition-colors"
          onClick={props.onAccept}
          aria-label="Accept match"
        >
          💚
        </button>
      </div>
    </div>
  );
};

/** Row for the connected matches list. */
export const ConnectionRow: Component<{
  match: Match;
  user?: FriendlyUser;
  onClick?: () => void;
}> = (props) => {
  const initials = () => (props.user ? getUserInitials(props.user.displayName) : "?");

  return (
    <div
      class="flex items-center gap-3.5 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
      onClick={props.onClick}
    >
      <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <span class="text-sm font-semibold text-green-600">{initials()}</span>
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-medium">{props.user?.displayName ?? "Friend"}</h3>
        <p class="text-xs text-gray-400 truncate">
          {props.match.sharedInterests.slice(0, 3).join(" · ")}
        </p>
      </div>

      <span class="text-sm font-medium text-green-600">
        {getScorePercentage(props.match)}%
      </span>
    </div>
  );
};
