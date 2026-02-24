import type { ParentComponent } from "solid-js";

/** Reusable section header + content wrapper for the Home feed. */
export const HomeSection: ParentComponent<{
  title: string;
  icon: string;
  onSeeAll?: () => void;
}> = (props) => {
  return (
    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <span>{props.icon}</span>
          <h2 class="text-lg font-semibold">{props.title}</h2>
        </div>
        {props.onSeeAll && (
          <button
            class="text-sm text-green-600 hover:text-green-700"
            onClick={props.onSeeAll}
          >
            See All
          </button>
        )}
      </div>
      {props.children}
    </section>
  );
};
