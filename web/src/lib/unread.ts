import { createSignal } from "solid-js";

const [hasUnread, setHasUnread] = createSignal(false);

export { hasUnread, setHasUnread };
