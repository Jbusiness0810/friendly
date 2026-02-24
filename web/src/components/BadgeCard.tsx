import type { Component } from "solid-js";
import type { Badge } from "../types";
import { badgeTierEmoji } from "../types";

export const BadgeCard: Component<{ badge: Badge }> = (props) => {
  return (
    <div class="flex flex-col items-center gap-1.5 w-20 p-2 bg-white rounded-lg shadow-sm">
      <span class="text-3xl">{badgeTierEmoji[props.badge.tier]}</span>
      <span class="text-[10px] font-medium text-center leading-tight">
        {props.badge.name}
      </span>
    </div>
  );
};

export const BadgeCardLarge: Component<{ badge: Badge; earned?: boolean }> = (props) => {
  return (
    <div
      class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors"
      classList={{
        "bg-white border-green-200 shadow-sm": props.earned,
        "bg-gray-50 border-gray-200 opacity-50": !props.earned,
      }}
    >
      <span class="text-4xl">{badgeTierEmoji[props.badge.tier]}</span>
      <h4 class="text-sm font-semibold text-center">{props.badge.name}</h4>
      <p class="text-xs text-gray-500 text-center">{props.badge.description}</p>
      <span class="text-[10px] uppercase tracking-wide text-gray-400">
        {props.badge.tier}
      </span>
    </div>
  );
};
