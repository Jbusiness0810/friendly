import { type Component } from "solid-js";
import { A } from "@solidjs/router";

const Privacy: Component = () => {
  return (
    <div class="legal-page">
      <div class="legal-header">
        <A href="/landing" class="legal-back">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <path d="M8.5 1L1.5 8l7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </A>
        <h1>Privacy Policy</h1>
      </div>
      <div class="legal-content">
        <p class="legal-date">Last updated: March 4, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>When you use Friendly, we collect the following information:</p>
        <ul>
          <li><strong>Account information:</strong> Name, email address, and profile photo from your Google account</li>
          <li><strong>Profile data:</strong> Interests, social preferences, political alignment, fun facts, and other information you provide during onboarding</li>
          <li><strong>Usage data:</strong> How you interact with the app, including waves, messages, and event participation</li>
          <li><strong>Device information:</strong> Device type, operating system, and browser type</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Create and maintain your account</li>
          <li>Match you with compatible neighbors based on your preferences</li>
          <li>Facilitate communication between matched users</li>
          <li>Improve and personalize your experience</li>
          <li>Send relevant notifications about matches, messages, and events</li>
          <li>Ensure the safety and security of our community</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell your personal information to third parties. Your profile
          information is visible to other authenticated Friendly users in your area.
          We may share information in the following limited circumstances:
        </p>
        <ul>
          <li>With your consent</li>
          <li>To comply with legal obligations</li>
          <li>To protect the safety of our users</li>
          <li>With service providers who help us operate the app (e.g., hosting, authentication)</li>
        </ul>

        <h2>4. Sensitive Information</h2>
        <p>
          Political alignment and other preference data you share during onboarding is
          used solely for matching purposes. This information is visible on your profile
          to other users. You may choose not to share political alignment by selecting
          "I'd rather not say."
        </p>

        <h2>5. Data Storage and Security</h2>
        <p>
          Your data is stored securely using Supabase, with encryption at rest and in
          transit. We implement industry-standard security measures to protect your
          information. However, no method of transmission over the internet is 100% secure.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Update or correct your information through profile settings</li>
          <li>Delete your account and associated data</li>
          <li>Opt out of non-essential notifications</li>
          <li>Request a copy of your data</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active. When you delete
          your account, we remove your personal information within 30 days, except where
          retention is required by law.
        </p>

        <h2>8. Cookies and Tracking</h2>
        <p>
          Friendly uses essential cookies for authentication and session management. We
          do not use third-party advertising trackers. Your theme preference (light/dark mode)
          is stored locally on your device.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          Friendly is not intended for users under 18. We do not knowingly collect
          information from minors. If we become aware that a user is under 18, we will
          terminate their account.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes through the app. The date at the top of this page indicates
          when the policy was last updated.
        </p>

        <h2>11. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at{" "}
          <span class="legal-email">privacy@friendly.app</span>
        </p>
      </div>
    </div>
  );
};

export default Privacy;
