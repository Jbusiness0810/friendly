/* @refresh reload */
console.log("[Friendly] Build v3 — 2026-03-08");
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Waves from "./pages/Waves";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import "./index.css";

render(
  () => (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Route path="/landing" component={Landing} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/" component={App}>
            <Route path="/" component={Home} />
            <Route path="/events" component={Events} />
            <Route path="/waves" component={Waves} />
            <Route path="/chat" component={Chat} />
            <Route path="/profile" component={Profile} />
            <Route path="/user/:id" component={UserProfile} />
          </Route>
          <Route path="*" component={NotFound} />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  ),
  document.getElementById("root")!
);
