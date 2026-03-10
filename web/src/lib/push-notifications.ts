import { createSignal } from "solid-js";
import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";
import { showToast } from "./toast";

const [pushToken, setPushToken] = createSignal<string | null>(null);
export { pushToken };

export async function initPushNotifications(userId: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return;

    // Register for push
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener("registration", async (token) => {
      setPushToken(token.value);
      // Store token in user profile for server-side push delivery
      await supabase
        .from("users")
        .update({ push_token: token.value })
        .eq("id", userId);
    });

    // Handle registration error
    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[Push] Registration failed:", err.error);
    });

    // Handle incoming notifications while app is in foreground
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      showToast(notification.body ?? notification.title ?? "New notification", "info");
    });

    // Handle notification tap (app opened from notification)
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification.data;
      if (data?.route) {
        window.location.hash = data.route;
      }
    });
  } catch {
    // Push notifications not available (web/simulator)
  }
}

export async function clearPushToken(userId: string) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await supabase
      .from("users")
      .update({ push_token: null })
      .eq("id", userId);
    setPushToken(null);
  } catch {
    // Ignore cleanup errors
  }
}
