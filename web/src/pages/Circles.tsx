import { createSignal, For, Show, type Component } from "solid-js";
import { useAuth } from "../stores/auth";
import { useCircles } from "../stores/circles";
import { CircleCard } from "../components/CircleCard";
import { allCircleCategories, circleCategoryIcons, type CircleCategory } from "../types";

const CirclesPage: Component = () => {
  const { currentUser } = useAuth();
  const { circles, joinCircle, leaveCircle } = useCircles();
  const [selectedCategory, setSelectedCategory] = createSignal<CircleCategory | "All">("All");

  const filteredCircles = () => {
    const cat = selectedCategory();
    if (cat === "All") return circles();
    return circles().filter((c) => c.category === cat);
  };

  const isMember = (circleId: string) =>
    currentUser()?.circleIds.includes(circleId) ?? false;

  return (
    <div class="flex flex-col gap-4 pb-6">
      <div class="px-4 pt-2">
        <h1 class="text-2xl font-bold">Circles</h1>
        <p class="text-sm text-gray-500 mt-1">Find your people</p>
      </div>

      {/* Category filter pills */}
      <div class="flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
          classList={{
            "bg-green-500 text-white": selectedCategory() === "All",
            "bg-gray-100 text-gray-600 hover:bg-gray-200": selectedCategory() !== "All",
          }}
          onClick={() => setSelectedCategory("All")}
        >
          All
        </button>
        <For each={allCircleCategories}>
          {(cat) => (
            <button
              class="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              classList={{
                "bg-green-500 text-white": selectedCategory() === cat,
                "bg-gray-100 text-gray-600 hover:bg-gray-200": selectedCategory() !== cat,
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {circleCategoryIcons[cat]} {cat}
            </button>
          )}
        </For>
      </div>

      {/* Circle list */}
      <div class="flex flex-col gap-3 px-4">
        <Show
          when={filteredCircles().length > 0}
          fallback={
            <div class="text-center py-12 text-gray-400">
              <p class="text-4xl mb-2">🔍</p>
              <p class="font-medium">No circles in this category</p>
              <p class="text-sm">Be the first to create one!</p>
            </div>
          }
        >
          <For each={filteredCircles()}>
            {(circle) => (
              <CircleCard
                circle={circle}
                isMember={isMember(circle.id)}
                onJoin={() => joinCircle(circle.id, currentUser()?.id ?? "")}
                onLeave={() => leaveCircle(circle.id, currentUser()?.id ?? "")}
              />
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default CirclesPage;
