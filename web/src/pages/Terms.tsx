import { type Component } from "solid-js";
import { A } from "@solidjs/router";

const Terms: Component = () => {
  return (
    <div class="legal-page">
      <div class="legal-header">
        <A href="/landing" class="legal-back">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
            <path d="M8.5 1L1.5 8l7 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </A>
        <h1>Terms of Service</h1>
      </div>
      <div class="legal-content">
        <p class="legal-date">Last updated: March 4, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Friendly app, you agree to be bound by these
          Terms of Service. If you do not agree to these terms, do not use the app.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old to use Friendly. By creating an account,
          you represent that you are at least 18 years of age and have the legal
          capacity to enter into this agreement.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must provide accurate and complete information when creating your account.
          You are responsible for maintaining the security of your account credentials
          and for all activities that occur under your account.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the app for any unlawful purpose</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Impersonate any person or entity</li>
          <li>Post false, misleading, or deceptive content</li>
          <li>Attempt to gain unauthorized access to other accounts</li>
          <li>Use the app to send spam or unsolicited messages</li>
          <li>Upload malicious software or content</li>
        </ul>

        <h2>5. User Content</h2>
        <p>
          You retain ownership of content you post on Friendly. By posting content,
          you grant Friendly a non-exclusive, worldwide, royalty-free license to use,
          display, and distribute your content within the app for the purpose of
          providing our services.
        </p>

        <h2>6. Community Standards</h2>
        <p>
          Friendly is a neighborhood community app. We expect users to treat each other
          with respect and kindness. We reserve the right to remove content or suspend
          accounts that violate our community standards.
        </p>

        <h2>7. Privacy</h2>
        <p>
          Your use of Friendly is also governed by our{" "}
          <A href="/privacy" class="legal-inline-link">Privacy Policy</A>, which describes
          how we collect, use, and protect your information.
        </p>

        <h2>8. Matches and Interactions</h2>
        <p>
          Friendly facilitates connections between neighbors but does not guarantee any
          outcomes from those connections. You are solely responsible for your
          interactions with other users. Exercise caution and good judgment when meeting
          people in person.
        </p>

        <h2>9. Termination</h2>
        <p>
          We may suspend or terminate your account at any time for violation of these
          terms. You may delete your account at any time through the app settings.
        </p>

        <h2>10. Disclaimers</h2>
        <p>
          Friendly is provided "as is" without warranties of any kind. We do not
          guarantee the accuracy of user profiles or the safety of in-person meetings
          arranged through the app.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Friendly shall not be liable for any
          indirect, incidental, special, or consequential damages arising from your use
          of the app.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. We will notify you of significant
          changes through the app. Continued use of Friendly after changes constitutes
          acceptance of the updated terms.
        </p>

        <h2>13. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <span class="legal-email">support@friendly.app</span>
        </p>
      </div>
    </div>
  );
};

export default Terms;
