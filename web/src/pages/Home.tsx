import { For, Show, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../stores/auth";
import { useCircles } from "../stores/circles";
import { useEvents } from "../stores/events";
import { useMatches } from "../stores/matches";
import { HomeSection } from "../components/HomeSection";
import { MatchCardSmall } from "../components/MatchCard";
import { EventRow } from "../components/EventCard";
import { CircleCardSmall } from "../components/CircleCard";

const HomePage: Component = () => {
  const { currentUser } = useAuth();
  const { circles } = useCircles();
  const { upcomingEvents } = useEvents();
  const { pendingMatches } = useMatches();
  const navigate = useNavigate();

  const firstName = () => {
    const name = currentUser()?.displayName ?? "there";
    return name.split(" ")[0];
  };

  return (
    <div class="flex flex-col gap-6 pb-6">
      {/* Welcome header */}
      <div class="px-4 pt-2">
        <h1 class="text-2xl font-bold">Hey, {firstName()}!</h1>
        <Show when={currentUser()?.neighborhoodId}>
          <div class="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <span>📍</span>
            <span>Park Slope, Brooklyn</span>
          </div>
        </Show>
      </div>

      {/* Pending matches */}
      <Show when={pendingMatches().length > 0}>
        <HomeSection title="New Matches" icon="💚" onSeeAll={() => navigate("/matches")}>
          <div class="flex gap-3 overflow-x-auto px-4 pb-1">
            <For each={pendingMatches()}>
              {(match) => (
                <MatchCardSmall match={match} onClick={() => navigate("/matches")} />
              )}
            </For>
          </div>
        </HomeSection>
      </Show>

      {/* Upcoming events */}
      <Show when={upcomingEvents().length > 0}>
        <HomeSection title="Upcoming Events" icon="📅" onSeeAll={() => navigate("/events")}>
          <div class="flex flex-col gap-3 px-4">
            <For each={upcomingEvents().slice(0, 3)}>
              {(event) => (
                <EventRow event={event} onClick={() => navigate(`/events`)} />
              )}
            </For>
          </div>
        </HomeSection>
      </Show>

      {/* Popular circles */}
      <Show when={circles().length > 0}>
        <HomeSection title="Popular Circles" icon="👥" onSeeAll={() => navigate("/circles")}>
          <div class="flex gap-3 overflow-x-auto px-4 pb-1">
            <For each={circles().slice(0, 5)}>
              {(circle) => (
                <CircleCardSmall circle={circle} onClick={() => navigate("/circles")} />
              )}
            </For>
          </div>
        </HomeSection>
      </Show>
    </div>
  );
};

export default HomePage;
