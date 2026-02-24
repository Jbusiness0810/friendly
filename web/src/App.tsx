import { Suspense, type ParentComponent } from "solid-js";
import { A, useLocation } from "@solidjs/router";

const App: ParentComponent = (props) => {
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/circles", label: "Circles", icon: "👥" },
    { href: "/events", label: "Events", icon: "📅" },
    { href: "/matches", label: "Matches", icon: "💚" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <div class="flex flex-col min-h-screen max-w-lg mx-auto bg-white">
      {/* Top bar */}
      <header class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <A href="/" class="text-lg font-bold text-green-600">
          Friendly
        </A>
      </header>

      {/* Page content */}
      <main class="flex-1 overflow-y-auto pt-2">
        <Suspense fallback={<div class="p-8 text-center text-gray-400">Loading...</div>}>
          {props.children}
        </Suspense>
      </main>

      {/* Bottom tab bar */}
      <nav class="flex items-center border-t border-gray-100 bg-white">
        {navItems.map((item) => (
          <A
            href={item.href}
            class="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors"
            classList={{
              "text-green-600": isActive(item.href),
              "text-gray-400": !isActive(item.href),
            }}
          >
            <span class="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </A>
        ))}
      </nav>
    </div>
  );
};

export default App;
