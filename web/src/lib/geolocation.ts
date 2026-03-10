import { createSignal } from "solid-js";
import { supabase } from "./supabase";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const [myCoords, setMyCoords] = createSignal<Coordinates | null>(null);
export { myCoords, setMyCoords };

/**
 * Haversine formula: distance between two lat/lng points in miles.
 */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display.
 */
export function formatDistance(miles: number): string {
  if (miles < 0.5) return "< 1 mi";
  if (miles >= 100) return "100+ mi";
  return `${Math.round(miles)} mi`;
}

/**
 * Request geolocation from Capacitor (native) or browser.
 * Returns coordinates or null if denied/unavailable.
 */
export async function requestGeolocation(): Promise<Coordinates | null> {
  // Try Capacitor plugin first (for native)
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
    });
    const coords: Coordinates = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };
    setMyCoords(coords);
    return coords;
  } catch {
    // Fall through to browser API
  }

  // Browser API fallback
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setMyCoords(coords);
        resolve(coords);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/**
 * Save coordinates to the user's profile in Supabase.
 */
export async function saveCoordinates(
  userId: string,
  coords: Coordinates
): Promise<void> {
  await supabase
    .from("users")
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq("id", userId);
}
