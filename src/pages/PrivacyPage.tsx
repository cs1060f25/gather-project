import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

export const PrivacyPage: React.FC = () => {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-logo">
            <svg width="28" height="28" viewBox="-2 -2 28 28" fill="none">
              <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
                    stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
              <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Gatherly</span>
          </Link>
        </div>
      </header>

      <main className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: December 9, 2025</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            At Gatherly, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our scheduling service.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li>Email address</li>
            <li>Name (from your Google profile or as provided)</li>
            <li>Profile picture (if using Google sign-in)</li>
          </ul>

          <h3>Calendar Data</h3>
          <p>When you connect your Google Calendar, we access:</p>
          <ul>
            <li>Calendar event titles, times, and durations (to check availability)</li>
            <li>Calendar IDs (to manage multiple calendars)</li>
          </ul>
          <p>
            <strong>Important:</strong> We only read calendar data to determine your availability. 
            We do not store the content of your existing calendar events.
          </p>

          <h3>Contacts Data</h3>
          <p>
            With your permission, we access your Google Contacts to suggest participants when 
            creating events. Contact data is used only for suggestions and is not stored permanently.
          </p>

          <h3>Event Data</h3>
          <p>We store information about events you create through Gatherly:</p>
          <ul>
            <li>Event titles and descriptions</li>
            <li>Proposed times and locations</li>
            <li>Participant email addresses</li>
            <li>Invitation responses</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Send event invitations and reminders on your behalf</li>
            <li>Suggest optimal meeting times based on your availability</li>
            <li>Create calendar events when meetings are confirmed</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about the Service</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information:</p>
          <ul>
            <li><strong>With invitees:</strong> When you send an invitation, recipients see your name, email, and event details</li>
            <li><strong>With service providers:</strong> We use trusted third parties (Supabase, Resend, Vercel) to operate our Service</li>
            <li><strong>For legal compliance:</strong> When required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your information, including:
          </p>
          <ul>
            <li>Encryption of data in transit (HTTPS)</li>
            <li>Secure OAuth 2.0 authentication</li>
            <li>Regular security reviews</li>
            <li>Limited access to personal data</li>
          </ul>
          <p>
            However, no method of transmission over the Internet is 100% secure, and we cannot 
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correct:</strong> Update inaccurate information</li>
            <li><strong>Delete:</strong> Request deletion of your account and data</li>
            <li><strong>Revoke access:</strong> Disconnect your Google Calendar at any time</li>
            <li><strong>Export:</strong> Receive your data in a portable format</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:milan@gatherly.now">milan@gatherly.now</a>.
          </p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. Event data is retained for 
            90 days after an event is completed or cancelled. You may request deletion of your 
            data at any time.
          </p>
        </section>

        <section>
          <h2>8. Third-Party Services</h2>
          <p>Our Service integrates with:</p>
          <ul>
            <li><strong>Google:</strong> For authentication and calendar access (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>)</li>
            <li><strong>Supabase:</strong> For data storage and authentication</li>
            <li><strong>Resend:</strong> For sending emails</li>
            <li><strong>OpenAI:</strong> For AI-powered scheduling suggestions</li>
          </ul>
        </section>

        <section>
          <h2>9. Cookies and Tracking</h2>
          <p>
            We use essential cookies to maintain your session and preferences. We do not use 
            third-party tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            Gatherly is not intended for children under 13. We do not knowingly collect information 
            from children under 13.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes 
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or our data practices, contact us at{' '}
            <a href="mailto:milan@gatherly.now">milan@gatherly.now</a>.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <div className="legal-links">
          <Link to="/terms">Terms of Service</Link>
          <span>|</span>
          <Link to="/" onClick={() => window.scrollTo(0, 0)}>Back to Gatherly</Link>
        </div>
      </footer>
    </div>
  );
};
