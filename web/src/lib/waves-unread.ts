import { createSignal } from "solid-js";

const [hasNewWaves, setHasNewWaves] = createSignal(false);

export { hasNewWaves, setHasNewWaves };
