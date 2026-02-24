import { createSignal, For, Show, type Component } from "solid-js";
import { useAuth } from "../stores/auth";
import { useMatches } from "../stores/matches";
import { MatchCardFull, ConnectionRow } from "../components/MatchCard";
import { getOtherUserId } from "../types";

const MatchesPage: Component = () => {
  const { currentUser } = useAuth();
  const {
    pendingMatches,
    acceptedMatches,
    currentMatchIndex,
    respondToMatch,
    nextMatch,
    getMatchedUser,
  } = useMatches();

  const [tab, setTab] = createSignal<"new" | "connected">("new");

  const currentMatch = () => {
    const pending = pendingMatches();
    const idx = currentMatchIndex();
    return idx < pending.length ? pending[idx] : undefined;
  };

  const userId = () => currentUser()?.id ?? "";

  return (
    <div class="flex flex-col gap-4 pb-6 min-h-[calc(100vh-8rem)]">
      <div class="px-4 pt-2">
        <h1 class="text-2xl font-bold">Matches</h1>
      </div>

      {/* Tabs */}
      <div class="flex px-4 gap-1 bg-gray-100 rounded-lg mx-4 p-1">
        <button
          class="flex-1 py-2 text-sm rounded-md font-medium transition-colors"
          classList={{
            "bg-white shadow-sm": tab() === "new",
            "text-gray-500": tab() !== "new",
          }}
          onClick={() => setTab("new")}
        >
          New
        </button>
        <button
          class="flex-1 py-2 text-sm rounded-md font-medium transition-colors"
          classList={{
            "bg-white shadow-sm": tab() === "connected",
            "text-gray-500": tab() !== "connected",
          }}
          onClick={() => setTab("connected")}
        >
          Connected
        </button>
      </div>

      <Show when={tab() === "new"} fallback={
        /* Connected matches list */
        <Show
          when={acceptedMatches().length > 0}
          fallback={
            <div class="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
              <p class="text-5xl mb-3">👥</p>
              <p class="font-medium">No connections yet</p>
              <p class="text-sm text-center">Accept a match to start connecting!</p>
            </div>
          }
        >
          <div class="flex flex-col px-4">
            <For each={acceptedMatches()}>
              {(match) => {
                const otherId = () => getOtherUserId(match, userId());
                return (
                  <ConnectionRow
                    match={match}
                    user={otherId() ? getMatchedUser(otherId()!) : undefined}
                  />
                );
              }}
            </For>
          </div>
        </Show>
      }>
        {/* Card stack */}
        <Show
          when={currentMatch()}
          fallback={
            <div class="flex-1 flex flex-col items-center justify-center text-gray-400 px-8">
              <p class="text-5xl mb-3">💚</p>
              <p class="font-medium">No new matches</p>
              <p class="text-sm text-center">Check back soon — we're finding people near you!</p>
            </div>
          }
        >
          {(match) => {
            const otherId = () => getOtherUserId(match(), userId());
            const otherUser = () => otherId() ? getMatchedUser(otherId()!) : undefined;
            return (
              <div class="flex-1 flex items-center justify-center px-4">
                <MatchCardFull
                  match={match()}
                  user={otherUser()}
                  onAccept={async () => {
                    await respondToMatch(match().id, true);
                    nextMatch();
                  }}
                  onDecline={async () => {
                    await respondToMatch(match().id, false);
                    nextMatch();
                  }}
                />
              </div>
            );
          }}
        </Show>
      </Show>
    </div>
  );
};

export default MatchesPage;
