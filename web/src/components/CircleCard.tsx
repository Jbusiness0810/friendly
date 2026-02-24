import type { Component } from "solid-js";
import type { Circle } from "../types";
import { circleCategoryIcons, getMemberCount } from "../types";

/** Small circle card used in horizontal carousels (Home feed, browse). */
export const CircleCardSmall: Component<{ circle: Circle; onClick?: () => void }> = (props) => {
  return (
    <button
      class="flex flex-col items-start gap-2 w-36 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
      onClick={props.onClick}
    >
      <span class="text-2xl w-11 h-11 flex items-center justify-center bg-green-50 rounded-lg">
        {circleCategoryIcons[props.circle.category]}
      </span>
      <span class="text-sm font-medium truncate w-full">{props.circle.name}</span>
      <span class="text-xs text-gray-500">{getMemberCount(props.circle)} members</span>
    </button>
  );
};

/** Full-width circle card for list views. */
export const CircleCard: Component<{
  circle: Circle;
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}> = (props) => {
  return (
    <div
      class="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={props.onClick}
    >
      <span class="text-2xl w-12 h-12 flex items-center justify-center bg-green-50 rounded-xl shrink-0">
        {circleCategoryIcons[props.circle.category]}
      </span>

      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold truncate">{props.circle.name}</h3>
        <p class="text-xs text-gray-500 truncate">{props.circle.description}</p>
        <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{getMemberCount(props.circle)}/{props.circle.maxMembers} members</span>
          <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {props.circle.category}
          </span>
        </div>
      </div>

      {props.isMember ? (
        <button
          class="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50"
          onClick={(e) => { e.stopPropagation(); props.onLeave?.(); }}
        >
          Joined
        </button>
      ) : (
        <button
          class="text-xs px-3 py-1.5 rounded-full bg-green-500 text-white hover:bg-green-600"
          onClick={(e) => { e.stopPropagation(); props.onJoin?.(); }}
        >
          Join
        </button>
      )}
    </div>
  );
};
