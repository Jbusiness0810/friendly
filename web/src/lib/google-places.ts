// Google Places API helpers
// Uses the Maps JavaScript API + Places library

let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;
  if (!key) {
    console.warn("[Friendly] No VITE_GOOGLE_MAPS_KEY set — Places autocomplete disabled");
    return Promise.resolve();
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return !!window.google?.maps?.places;
}

export interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photo_url: string | null;
  lat: number;
  lng: number;
}

/** Get a photo URL for a place_id using the Places service */
export function getPlacePhoto(
  placeId: string,
  maxWidth = 800
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!isGoogleMapsLoaded()) {
      resolve(null);
      return;
    }

    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    );

    service.getDetails(
      { placeId, fields: ["photos"] },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.photos?.length
        ) {
          resolve(place.photos[0].getUrl({ maxWidth }));
        } else {
          resolve(null);
        }
      }
    );
  });
}

/** Attach autocomplete to an input element */
export function attachAutocomplete(
  input: HTMLInputElement,
  onSelect: (place: PlaceResult) => void
): google.maps.places.Autocomplete | null {
  if (!isGoogleMapsLoaded()) return null;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["establishment", "geocode"],
    fields: ["name", "formatted_address", "place_id", "geometry", "photos"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.place_id) return;

    const photoUrl =
      place.photos?.length
        ? place.photos[0].getUrl({ maxWidth: 800 })
        : null;

    onSelect({
      name: place.name ?? "",
      formatted_address: place.formatted_address ?? "",
      place_id: place.place_id,
      photo_url: photoUrl,
      lat: place.geometry?.location?.lat() ?? 0,
      lng: place.geometry?.location?.lng() ?? 0,
    });
  });

  return autocomplete;
}

// Extend Window for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}
