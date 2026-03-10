import { createSignal } from "solid-js";

const [blockedIds, setBlockedIds] = createSignal<Set<string>>(new Set());

export { blockedIds, setBlockedIds };
