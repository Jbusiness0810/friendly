import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onMount,
  type ParentComponent,
  type Accessor,
} from "solid-js";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Accessor<Theme>;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider: ParentComponent = (props) => {
  const stored = localStorage.getItem("theme") as Theme | null;
  const [theme, setThemeSignal] = createSignal<Theme>(stored ?? getSystemTheme());

  // Apply theme to <html> element
  const applyTheme = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
  };

  onMount(() => {
    applyTheme(theme());

    // Listen for system preference changes (only if no stored preference)
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setThemeSignal(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
  });

  createEffect(() => {
    applyTheme(theme());
  });

  const setTheme = (t: Theme) => {
    setThemeSignal(t);
    localStorage.setItem("theme", t);
  };

  const toggleTheme = () => {
    setTheme(theme() === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
