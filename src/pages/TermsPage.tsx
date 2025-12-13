import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

export const TermsPage: React.FC = () => {
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
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: December 9, 2025</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Gatherly ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Gatherly is an AI-powered scheduling platform that helps users coordinate meetings and events. 
            The Service integrates with Google Calendar to provide intelligent scheduling suggestions and 
            send event invitations on your behalf.
          </p>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the Service, you must create an account or sign in using Google OAuth. 
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2>4. Google Calendar Integration</h2>
          <p>
            When you connect your Google Calendar, you authorize Gatherly to:
          </p>
          <ul>
            <li>Read your calendar events to check availability</li>
            <li>Create calendar events on your behalf</li>
            <li>Access your contacts for participant suggestions</li>
          </ul>
          <p>
            You can revoke this access at any time through your Google Account settings.
          </p>
        </section>

        <section>
          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Send spam or unsolicited invitations</li>
            <li>Attempt to gain unauthorized access to other accounts</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Reverse engineer or attempt to extract source code</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its design, features, and content, is owned by Gatherly and protected 
            by intellectual property laws. You may not copy, modify, or distribute any part of the Service 
            without our express written permission.
          </p>
        </section>

        <section>
          <h2>7. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
            WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </p>
        </section>

        <section>
          <h2>8. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, GATHERLY SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
          </p>
        </section>

        <section>
          <h2>9. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of significant changes 
            by posting the new Terms on this page. Your continued use of the Service after changes 
            constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about these Terms, please contact us at{' '}
            <a href="mailto:milan@gatherly.now">milan@gatherly.now</a>.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <div className="legal-links">
          <Link to="/privacy">Privacy Policy</Link>
          <span>|</span>
          <Link to="/">Back to Gatherly</Link>
        </div>
      </footer>
    </div>
  );
};
