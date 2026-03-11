import { createSignal, createEffect, For, Show, onMount, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { requestGeolocation, saveCoordinates } from "../lib/geolocation";

interface Message {
  sender: "app" | "user";
  content: string;
}

interface Question {
  text: string;
  chips: string[];
  multi: boolean;
  freeOnly?: boolean;
  placeholders?: string[];
  ageGate?: boolean;
  photoStep?: boolean;
}

const QUESTIONS: Question[] = [
  {
    text: "First, what's your date of birth? You must be 18+ to use Friendly.",
    chips: [],
    multi: false,
    ageGate: true,
  },
  {
    text: "How do you identify?",
    chips: ["Man", "Woman", "Other", "Prefer not to say"],
    multi: false,
  },
  {
    text: "What are you looking for?",
    chips: [
      "Gym partner",
      "Grab a drink",
      "Watch the game",
      "Pickup sports",
      "Weekend plans",
      "Networking",
    ],
    multi: true,
  },
  {
    text: "Are you more spontaneous or a planner?",
    chips: ["Spontaneous", "Planner", "Bit of both"],
    multi: false,
  },
  {
    text: "What are your interests?",
    chips: [
      "Lifting",
      "Running",
      "Cooking",
      "Gaming",
      "Music",
      "Hiking",
      "Coffee",
      "Basketball",
      "Golf",
      "Outdoors",
      "Fishing",
      "Cars",
    ],
    multi: true,
  },
  {
    text: "What does a good hangout look like?",
    chips: [
      "Coffee",
      "Gym",
      "Bar",
      "Sports",
      "BBQ",
      "Game night",
      "Trail",
    ],
    multi: true,
  },
  {
    text: "Where do you land politically?",
    chips: [
      "Progressive",
      "Liberal",
      "Moderate",
      "Conservative",
      "Libertarian",
      "Rather not say",
    ],
    multi: false,
  },
  {
    text: "What's something interesting about you?",
    chips: [],
    multi: false,
    freeOnly: true,
    placeholders: [
      "I once...",
      "My unpopular opinion is...",
      "Most people don't know that I...",
    ],
  },
];

const Onboarding: Component = () => {
  const navigate = useNavigate();
  const { session, profile, loading, user, refreshProfile } = useAuth();
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [currentStep, setCurrentStep] = createSignal(0);
  const [selected, setSelected] = createSignal<string[]>([]);
  const [customText, setCustomText] = createSignal("");
  const [isTyping, setIsTyping] = createSignal(false);
  const [isDone, setIsDone] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [locationText, setLocationText] = createSignal("");
  const [detectingLocation, setDetectingLocation] = createSignal(false);
  const [showChips, setShowChips] = createSignal(false);
  const [placeholderIdx, setPlaceholderIdx] = createSignal(0);
  const [dobValue, setDobValue] = createSignal("");
  const [dobError, setDobError] = createSignal("");
  const [photoFile, setPhotoFile] = createSignal<File | null>(null);
  const [photoPreview, setPhotoPreview] = createSignal<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = createSignal(false);

  // Store accumulated answers (index 0 = age gate, 1 = gender, 2-7 = rest)
  const answers: string[][] = [[], [], [], [], [], [], [], []];

  let messagesEndRef: HTMLDivElement | undefined;
  let inputRef: HTMLInputElement | undefined;

  // Auth guard: redirect if not logged in or already onboarded
  createEffect(() => {
    if (loading()) return;
    if (!session()) {
      navigate("/landing", { replace: true });
    } else if (profile()) {
      navigate("/", { replace: true });
    }
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const addAppMessage = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setShowChips(false);
      scrollToBottom();
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { sender: "app", content: text }]);
        scrollToBottom();
        setTimeout(() => {
          setShowChips(true);
          scrollToBottom();
          resolve();
        }, 100);
      }, 800);
    });
  };

  onMount(async () => {
    await addAppMessage(
      "Welcome to Friendly! A few quick questions so we can match you with the right people."
    );
    await addAppMessage(QUESTIONS[0].text);
  });

  // Cycle placeholder text for the fun fact question
  createEffect(() => {
    const q = QUESTIONS[currentStep()];
    if (q.freeOnly && q.placeholders) {
      const interval = setInterval(() => {
        setPlaceholderIdx(
          (prev) => (prev + 1) % (q.placeholders?.length ?? 1)
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  });

  const toggleChip = (chip: string) => {
    const q = QUESTIONS[currentStep()];
    if (q.multi) {
      setSelected((prev) =>
        prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
      );
    } else {
      setSelected((prev) => (prev.includes(chip) ? [] : [chip]));
    }
  };

  const submitDob = async () => {
    const dob = dobValue();
    if (!dob) return;

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setDobError("You must be 18 or older to use Friendly.");
      return;
    }

    setDobError("");
    answers[0] = [dob];

    setMessages((prev) => [...prev, { sender: "user", content: dob }]);
    setShowChips(false);
    scrollToBottom();

    const next = 1;
    setCurrentStep(next);
    await addAppMessage(QUESTIONS[next].text);
  };

  const submitAnswer = async () => {
    const step = currentStep();

    // Age gate is handled by submitDob
    if (QUESTIONS[step].ageGate) return;

    const sel = [...selected()];
    const custom = customText().trim();
    if (custom) sel.push(custom);
    if (sel.length === 0) return;

    // Store answer
    answers[step] = sel;

    // Show user bubble
    setMessages((prev) => [
      ...prev,
      { sender: "user", content: sel.join(", ") },
    ]);
    setSelected([]);
    setCustomText("");
    setShowChips(false);
    scrollToBottom();

    if (step < QUESTIONS.length - 1) {
      const next = step + 1;
      setCurrentStep(next);
      await addAppMessage(QUESTIONS[next].text);
    } else {
      // Done!
      await addAppMessage(
        "You're all set. Let's find your people. 🤝"
      );
      setIsDone(true);
      scrollToBottom();
    }
  };

  const finishOnboarding = async () => {
    setSaving(true);
    const u = user();
    if (!u) return;

    // Upload photo if selected
    let avatarUrl = u.user_metadata?.avatar_url ?? null;
    const file = photoFile();
    if (file) {
      setUploadingPhoto(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${u.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
      setUploadingPhoto(false);
    }

    // answers[0] = dob, answers[1] = gender, answers[2-7] = rest
    const genderAnswers = answers[1];
    let genderVal = genderAnswers[0] ?? null;
    if (genderVal === "Other" && genderAnswers.length > 1) {
      genderVal = genderAnswers[genderAnswers.length - 1];
    }

    const { error } = await supabase.from("users").upsert({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "",
      avatar_url: avatarUrl,
      gender: genderVal,
      date_of_birth: answers[0][0] ?? null,
      intent: answers[2],
      social_style: answers[3][0] ?? null,
      interests: answers[4],
      ideal_hangouts: answers[5],
      political_alignment: answers[6][0] ?? null,
      fun_fact: answers[7][0] ?? null,
      location: locationText().trim() || null,
      verified: false,
    });

    if (!error) {
      // Request location in background and save coordinates
      requestGeolocation().then(async (coords) => {
        if (coords) await saveCoordinates(u.id, coords);
      });
      await refreshProfile();
      navigate("/", { replace: true });
    } else {
      console.error("Failed to save profile:", error);
      setSaving(false);
    }
  };

  const currentPlaceholder = () => {
    const q = QUESTIONS[currentStep()];
    if (q.freeOnly && q.placeholders) {
      return q.placeholders[placeholderIdx()];
    }
    return "Or type your own...";
  };

  return (
    <div class="onboarding">
      <div class="onboarding-header">
        <img src="/icon.png" alt="Friendly" class="onboarding-header-icon" />
        <span class="onboarding-header-name">Friendly</span>
      </div>

      <div class="onboarding-messages">
        <For each={messages()}>
          {(msg) => (
            <div
              class={`msg ${
                msg.sender === "app" ? "msg-received" : "msg-sent"
              }`}
            >
              {msg.content}
            </div>
          )}
        </For>
        <Show when={isTyping()}>
          <div class="msg msg-received typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </Show>
        <div ref={messagesEndRef} />
      </div>

      {/* Age gate input */}
      <Show when={!isDone() && showChips() && !isTyping() && QUESTIONS[currentStep()].ageGate}>
        <div class="onboarding-input-area">
          <div class="onboarding-text-row">
            <input
              type="date"
              class="onboarding-text-input"
              value={dobValue()}
              onInput={(e) => { setDobValue(e.currentTarget.value); setDobError(""); }}
              max={new Date().toISOString().split("T")[0]}
            />
            <button
              class="send-btn"
              onClick={submitDob}
              disabled={!dobValue()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <Show when={dobError()}>
            <div style="color:var(--danger, #ff3b30);font-size:13px;margin-top:8px;text-align:center">
              {dobError()}
            </div>
          </Show>
        </div>
      </Show>

      {/* Regular question input */}
      <Show when={!isDone() && showChips() && !isTyping() && !QUESTIONS[currentStep()].ageGate}>
        <div class="onboarding-input-area">
          <Show when={QUESTIONS[currentStep()].chips.length > 0}>
            <div class="onboarding-chips">
              <For each={QUESTIONS[currentStep()].chips}>
                {(chip) => (
                  <button
                    class={`onboard-chip ${
                      selected().includes(chip) ? "selected" : ""
                    }`}
                    onClick={() => toggleChip(chip)}
                  >
                    {chip}
                  </button>
                )}
              </For>
            </div>
          </Show>
          <div class="onboarding-text-row">
            <input
              ref={inputRef}
              type="text"
              class="onboarding-text-input"
              placeholder={currentPlaceholder()}
              value={customText()}
              onInput={(e) => setCustomText(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAnswer();
              }}
            />
            <button
              class="send-btn"
              onClick={submitAnswer}
              disabled={selected().length === 0 && customText().trim() === ""}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </Show>

      <Show when={isDone()}>
        <div class="onboarding-done">
          {/* Profile photo upload */}
          <div
            class="onboarding-photo-upload"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            <Show when={photoPreview()} fallback={
              <div class="onboarding-photo-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style="opacity:0.5">
                  <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
                </svg>
                <span>Add a profile photo</span>
              </div>
            }>
              <img src={photoPreview()!} alt="Profile" class="onboarding-photo-preview" />
              <div class="onboarding-photo-change">Change</div>
            </Show>
          </div>

          <div class="onboarding-location-row">
            <input
              type="text"
              class="onboarding-text-input"
              placeholder="Your neighborhood (e.g. Newport Beach)"
              value={locationText()}
              onInput={(e) => setLocationText(e.currentTarget.value)}
            />
            <button
              class="detect-location-btn"
              onClick={async () => {
                setDetectingLocation(true);
                try {
                  const coords = await requestGeolocation();
                  if (coords && typeof google !== "undefined" && google.maps) {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode(
                      { location: { lat: coords.latitude, lng: coords.longitude } },
                      (results: any, status: any) => {
                        if (status === "OK" && results?.[0]) {
                          const comps = results[0].address_components;
                          const neighborhood = comps.find((c: any) =>
                            c.types.includes("neighborhood")
                          );
                          const city = comps.find((c: any) =>
                            c.types.includes("locality")
                          );
                          const detected =
                            neighborhood?.long_name ?? city?.long_name;
                          if (detected) setLocationText(detected);
                        }
                        setDetectingLocation(false);
                      }
                    );
                  } else {
                    setDetectingLocation(false);
                  }
                } catch {
                  setDetectingLocation(false);
                }
              }}
              disabled={detectingLocation()}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align:-2px;margin-right:4px">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
              {detectingLocation() ? "Detecting..." : "Use my location"}
            </button>
          </div>
          <button
            class="landing-cta"
            onClick={finishOnboarding}
            disabled={saving()}
          >
            {saving() ? "Setting up your profile..." : "Start exploring"}
          </button>
        </div>
      </Show>
    </div>
  );
};

export default Onboarding;
