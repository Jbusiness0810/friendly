import type { Component } from "solid-js";
import type { Neighborhood } from "../types";
import { getActivityLevel, getFullLocationName, activityLevelColors } from "../types";

export const NeighborhoodHeader: Component<{ neighborhood: Neighborhood }> = (props) => {
  const level = () => getActivityLevel(props.neighborhood);
  const color = () => activityLevelColors[level()];

  return (
    <div class="flex items-center gap-2 text-sm text-gray-500">
      <span>📍</span>
      <span>{getFullLocationName(props.neighborhood)}</span>
      <span
        class="px-2 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ "background-color": color() }}
      >
        {level()}
      </span>
    </div>
  );
};

export const NeighborhoodStats: Component<{ neighborhood: Neighborhood }> = (props) => {
  return (
    <div class="grid grid-cols-3 gap-3">
      <div class="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
        <span class="text-lg font-bold">{props.neighborhood.memberCount}</span>
        <span class="text-xs text-gray-500">Neighbors</span>
      </div>
      <div class="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
        <span class="text-lg font-bold">{props.neighborhood.circleCount}</span>
        <span class="text-xs text-gray-500">Circles</span>
      </div>
      <div class="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm">
        <span class="text-lg font-bold">{props.neighborhood.activeEventCount}</span>
        <span class="text-xs text-gray-500">Events</span>
      </div>
    </div>
  );
};
