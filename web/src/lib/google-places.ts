// Google Places API (New) helpers
// Uses PlaceAutocompleteElement + Place.fetchFields()

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`;
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

/** Get a photo URL for a place_id using the new Place class */
export async function getPlacePhoto(
  placeId: string,
): Promise<string | null> {
  if (!isGoogleMapsLoaded()) return null;

  try {
    const { Place } = google.maps.places;
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ["photos"] });

    if (place.photos?.length) {
      return place.photos[0].getURI({ maxWidth: 800 });
    }
  } catch (e) {
    console.warn("[Friendly] Failed to fetch place photo:", e);
  }
  return null;
}

/** Search for a real venue by text query, return its name and address */
export async function searchNearbyVenue(
  query: string,
): Promise<{ name: string; address: string } | null> {
  if (!isGoogleMapsLoaded() || !query.trim()) return null;

  try {
    const { Place } = google.maps.places;
    const request = {
      textQuery: query,
      fields: ["displayName", "formattedAddress"],
      maxResultCount: 1,
    };
    // @ts-ignore — searchByText is part of the new Places API
    const { places } = await Place.searchByText(request);

    if (places?.length) {
      return {
        name: places[0].displayName ?? "",
        address: places[0].formattedAddress ?? "",
      };
    }
  } catch (e) {
    console.warn("[Friendly] Failed to search nearby venue:", e);
  }
  return null;
}

/** Search for a place by text query and return its photo URL */
export async function searchPlacePhoto(
  query: string,
): Promise<string | null> {
  if (!isGoogleMapsLoaded() || !query.trim()) return null;

  try {
    const { Place } = google.maps.places;
    const request = {
      textQuery: query,
      fields: ["photos"],
      maxResultCount: 1,
    };
    // @ts-ignore — searchByText is part of the new Places API
    const { places } = await Place.searchByText(request);

    if (places?.length && places[0].photos?.length) {
      return places[0].photos[0].getURI({ maxWidth: 800 });
    }
  } catch (e) {
    console.warn("[Friendly] Failed to search place photo:", e);
  }
  return null;
}

/**
 * Create a PlaceAutocompleteElement and insert it into the given container.
 * Returns the element so it can be removed later.
 */
export function createAutocomplete(
  container: HTMLElement,
  onSelect: (place: PlaceResult) => void
): HTMLElement | null {
  if (!isGoogleMapsLoaded()) return null;

  try {
    // @ts-ignore — PlaceAutocompleteElement is part of the new Places API
    const autocompleteEl = new google.maps.places.PlaceAutocompleteElement({
      types: ["establishment", "geocode"],
    });

    // Style the element to match our form inputs
    autocompleteEl.style.width = "100%";

    autocompleteEl.addEventListener("gmp-placeselect", async (event: any) => {
      const place = event.place;
      if (!place?.id) return;

      try {
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "id", "location", "photos"],
        });

        const photoUrl =
          place.photos?.length
            ? place.photos[0].getURI({ maxWidth: 800 })
            : null;

        onSelect({
          name: place.displayName ?? "",
          formatted_address: place.formattedAddress ?? "",
          place_id: place.id,
          photo_url: photoUrl,
          lat: place.location?.lat() ?? 0,
          lng: place.location?.lng() ?? 0,
        });
      } catch (e) {
        console.warn("[Friendly] Failed to fetch place details:", e);
      }
    });

    // Clear existing content and insert
    container.innerHTML = "";
    container.appendChild(autocompleteEl);

    return autocompleteEl as unknown as HTMLElement;
  } catch (e) {
    console.warn("[Friendly] Failed to create PlaceAutocompleteElement:", e);
    return null;
  }
}

// Extend Window for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}
