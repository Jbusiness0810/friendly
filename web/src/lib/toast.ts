import { createSignal } from "solid-js";

export type ToastType = "error" | "success" | "info";

interface Toast {
  message: string;
  type: ToastType;
  id: number;
}

let nextId = 0;
const [toasts, setToasts] = createSignal<Toast[]>([]);

export { toasts };

export function showToast(message: string, type: ToastType = "error") {
  const id = nextId++;
  setToasts((prev) => [...prev, { message, type, id }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}
