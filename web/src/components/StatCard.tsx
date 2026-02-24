import type { Component } from "solid-js";

export const StatCard: Component<{ value: string; label: string }> = (props) => {
  return (
    <div class="flex flex-col items-center p-4 bg-gray-100 rounded-xl">
      <span class="text-xl font-bold">{props.value}</span>
      <span class="text-xs text-gray-500">{props.label}</span>
    </div>
  );
};

export const LevelProgress: Component<{
  level: number;
  points: number;
  progress: number;
}> = (props) => {
  return (
    <div class="px-4">
      <div class="flex justify-between items-center mb-2">
        <span class="font-semibold">Level {props.level}</span>
        <span class="text-sm text-gray-500">{props.points} pts</span>
      </div>
      <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${Math.round(props.progress * 100)}%` }}
        />
      </div>
    </div>
  );
};
