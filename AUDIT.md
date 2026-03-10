# Friendly App - Pre-Launch Audit Report
**Date:** March 10, 2026

---

## Part 1: Feature Gap Analysis vs Bumble BFF & Competitors

### Features You HAVE That Compete Well

| Feature | Friendly | Bumble BFF | Notes |
|---------|----------|------------|-------|
| Discovery/matching feed | Yes | Yes | Your 5-factor algorithm is more sophisticated than Bumble's swipe |
| Wave/like system | Yes | Yes (swipe) | Comparable |
| 1:1 messaging | Yes | Yes | Real-time via Supabase |
| Events creation & RSVP | Yes | Yes (Plans) | Your events are more feature-rich (capacity, pricing, visibility) |
| Event group chats | Yes | Yes | Auto-created, well implemented |
| Block & report | Yes | Yes | Solid implementation |
| Profile interests & matching | Yes | Yes | Your multi-factor scoring is a strength |
| Gender-based filtering | Yes | Yes | Smart same-gender default |
| Privacy policy & ToS | Yes | Yes | In-app pages, well done |
| Google OAuth login | Yes | Yes (Apple/Google) | Works |
| Location-based proximity | Yes | Yes | Haversine distance, good |

### Features You're MISSING vs Competitors

#### Critical (High Impact on User Retention & Trust)

| # | Missing Feature | Who Has It | Impact | Effort |
|---|----------------|------------|--------|--------|
| 1 | **Photo/selfie verification** | Bumble (mandatory for all users) | Very High - #1 trust signal for social apps. Without it, users worry about catfishing/fake profiles | Medium |
| 2 | **Push notifications (functional)** | All competitors | Very High - 88% engagement boost. You have the plugin installed but no send logic, no permission prompts, no notification handlers | Medium |
| 3 | **Read receipts / typing indicators** | Bumble, most chat apps | High - Expected in any messaging experience | Low |
| 4 | **Image/media sharing in chat** | All competitors | High - You have chat-images storage bucket but no UI to send images in chat | Medium |
| 5 | **Profile prompts / conversation starters** | Bumble, Hinge | High - Helps break the ice, increases message rates | Low |

#### Important (Competitive Differentiation)

| # | Missing Feature | Who Has It | Impact | Effort |
|---|----------------|------------|--------|--------|
| 6 | **Communities/groups (persistent)** | Bumble (via Geneva), Meetup, Patook | Medium-High - Your events create temporary groups, but persistent interest-based communities drive retention (2.7x higher) | High |
| 7 | **Apple Sign-In** | Required by App Store if you offer Google Sign-In | Medium-High - **Apple requires this if you have any third-party login** | Low |
| 8 | **Gamification system** | Friender, Patook | Medium - You have badge/medal assets designed but no in-app system. Streaks, achievements increase DAU | Medium |
| 9 | **Advanced search filters** | Bumble (age, distance, language) | Medium - You only filter by name and interests currently | Low |
| 10 | **Account deletion flow** | Required by App Store | Medium - Apple requires a way to delete account from within the app | Low |

#### Nice-to-Have (Future Roadmap)

| # | Feature | Who Has It | Notes |
|---|---------|------------|-------|
| 11 | AI content moderation / scam detection | Bumble (Deception Detector) | Proactive safety |
| 12 | Voice messages | Bumble, WhatsApp | Increasingly expected |
| 13 | Social feed / user-generated content | Hey! VINA, traditional social apps | Drives daily opens |
| 14 | Premium tier / monetization | Bumble, Friender, Meetup | Revenue, but okay to launch free |
| 15 | Share Date / safety check-in | Bumble | Safety feature for IRL meetups |
| 16 | Undo/rematch for waves | Bumble (Premium) | Minor UX improvement |
| 17 | Analytics / crash reporting | Industry standard | Sentry, Firebase, etc. for monitoring |

---

## Part 2: App Store Readiness Checklist

### PASS - Ready for Submission

- [x] Info.plist with all required permission descriptions (Camera, Photos, Location)
- [x] `ITSAppUsesNonExemptEncryption` = false (no ITAR issues)
- [x] Launch screen storyboard configured
- [x] Splash screen images (light + dark mode, all densities)
- [x] 1024x1024 app icon for App Store listing
- [x] Bundle identifier set (`app.friendly.ios`)
- [x] Deployment target iOS 15.0 (good coverage)
- [x] iPhone + iPad support configured
- [x] Default App Transport Security (HTTPS enforced)
- [x] Privacy Policy accessible in-app
- [x] Terms of Service accessible in-app
- [x] Capacitor iOS v8.2.0 properly configured
- [x] Portrait orientation as primary

### FIXED in This Audit

- [x] **Privacy Manifest (`PrivacyInfo.xcprivacy`)** - CREATED
  - Was completely missing; Apple requires this for all submissions since Spring 2024
  - Declares: email, name, photos, precise location, user ID collection
  - Declares: UserDefaults API usage
  - No tracking domains (app doesn't track)

### BLOCKERS - Must Fix Before Submission

| # | Issue | Why It Blocks | Fix |
|---|-------|---------------|-----|
| 1 | **No Apple Sign-In** | Apple **requires** Sign in with Apple if your app uses ANY third-party login (you use Google OAuth). This is App Store Review Guideline 4.8. Your app WILL be rejected without it. | Add `@capacitor/sign-in-with-apple` or use Supabase's Apple OAuth provider |
| 2 | **No account deletion** | Apple requires in-app account deletion (Guideline 5.1.1(v)) since June 2022. You have no way for users to delete their account. | Add a "Delete Account" button in Profile/Settings that calls Supabase auth delete + cleans up user data |
| 3 | **Push notifications not functional** | You configured `PushNotifications` in capacitor.config.ts and installed the plugin, but never request permission or register handlers. If Apple sees the entitlement but no functionality, it can flag the review. Either implement it or remove the plugin. | Implement or remove `@capacitor/push-notifications` |

### WARNINGS - Should Fix Before Submission

| # | Issue | Risk | Fix |
|---|-------|------|-----|
| 4 | No `.entitlements` file | Push notification capability may not work without explicit entitlements | Add `App.entitlements` with push notification capability, or remove push plugin |
| 5 | App icon only 1024x1024 | Xcode auto-scales, but quality may degrade at small sizes | Generate all required sizes (180, 120, 167, 152, 80, 76, etc.) |
| 6 | Age gate not enforced | ToS says 18+ but nothing prevents a 13-year-old from signing up. App Store may require age rating questionnaire answers that conflict with your implementation | Consider adding date-of-birth check during onboarding |
| 7 | No crash reporting | If the app crashes in review, you won't know why. Apple reviewers have limited patience | Add Sentry or Firebase Crashlytics |

---

## Summary

### Launch Readiness Score: 7/10

**Your app has a solid feature foundation** - the matching algorithm, events system, real-time messaging, and overall UX are competitive. The SolidJS + Capacitor stack is clean and performant.

**Three things will get you rejected from App Store:**
1. Missing Apple Sign-In (mandatory with Google OAuth)
2. Missing account deletion flow
3. Push notification plugin installed but non-functional

**Three things will hurt you competitively vs Bumble BFF:**
1. No photo verification (trust gap)
2. No persistent communities/groups (retention gap)
3. No push notifications (engagement gap)

**Recommended priority order to launch:**
1. Add Apple Sign-In (blocker)
2. Add account deletion (blocker)
3. Either implement or remove push notifications (blocker)
4. Add photo verification (trust)
5. Add image sharing in chat (expected feature)
6. Add read receipts (expected feature)
