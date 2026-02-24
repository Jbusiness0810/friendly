import { createSignal } from "solid-js";
import type { FriendlyUser } from "../types";
import { defaultAvailability, defaultNotificationPreferences } from "../types";

const [currentUser, setCurrentUser] = createSignal<FriendlyUser | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal(false);
const [isLoading, setIsLoading] = createSignal(false);
const [authError, setAuthError] = createSignal<string | null>(null);

export function useAuth() {
  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setAuthError(null);
    try {
      // TODO: Firebase auth integration
      // For now, create a mock user session
      const mockUser: FriendlyUser = {
        id: "user_1",
        email,
        displayName: email.split("@")[0] ?? "User",
        bio: "",
        interests: [],
        circleIds: [],
        badges: [],
        points: 0,
        level: 1,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        hasCompletedOnboarding: false,
        availability: defaultAvailability,
        notificationPreferences: defaultNotificationPreferences,
      };
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    setIsLoading(true);
    setAuthError(null);
    try {
      // TODO: Firebase auth integration
      const newUser: FriendlyUser = {
        id: `user_${Date.now()}`,
        email,
        displayName,
        bio: "",
        interests: [],
        circleIds: [],
        badges: [],
        points: 0,
        level: 1,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        hasCompletedOnboarding: false,
        availability: defaultAvailability,
        notificationPreferences: defaultNotificationPreferences,
      };
      setCurrentUser(newUser);
      setIsAuthenticated(true);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  }

  function signOut() {
    setCurrentUser(null);
    setIsAuthenticated(false);
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    authError,
    signIn,
    signUp,
    signOut,
    setCurrentUser,
  };
}
