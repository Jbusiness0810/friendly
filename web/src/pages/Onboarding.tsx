import { createSignal, createEffect, For, Show, onMount, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

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
}

const QUESTIONS: Question[] = [
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
  const [showChips, setShowChips] = createSignal(false);
  const [placeholderIdx, setPlaceholderIdx] = createSignal(0);

  // Store accumulated answers
  const answers: string[][] = [[], [], [], [], [], [], []];

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

  const submitAnswer = async () => {
    const step = currentStep();
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

    // Gender: if "Other" selected with custom text, use the custom text
    const genderAnswers = answers[0];
    let genderVal = genderAnswers[0] ?? null;
    if (genderVal === "Other" && genderAnswers.length > 1) {
      genderVal = genderAnswers[genderAnswers.length - 1];
    }

    const { error } = await supabase.from("users").upsert({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "",
      avatar_url: u.user_metadata?.avatar_url ?? null,
      gender: genderVal,
      intent: answers[1],
      social_style: answers[2][0] ?? null,
      interests: answers[3],
      ideal_hangouts: answers[4],
      political_alignment: answers[5][0] ?? null,
      fun_fact: answers[6][0] ?? null,
      location: locationText().trim() || null,
      verified: false,
    });

    if (!error) {
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

      <Show when={!isDone() && showChips() && !isTyping()}>
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
          <div style="width:100%;margin-bottom:16px">
            <input
              type="text"
              class="onboarding-text-input"
              placeholder="Your neighborhood (e.g. Newport Beach)"
              value={locationText()}
              onInput={(e) => setLocationText(e.currentTarget.value)}
              style="width:100%;box-sizing:border-box"
            />
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
