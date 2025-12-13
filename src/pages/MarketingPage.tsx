import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DemoModal } from '../components/DemoModal';
import './MarketingPage.css';

// Gatherly Logo SVG Component
const GatherlyLogo = ({ size = 32, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="-2 -2 28 28" fill="none">
    <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" 
          stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M13 6V12L17 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="16" r="5.2" fill="none" stroke={color} strokeWidth="2"/>
    <path d="M6 14V18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 16H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Google icon SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Arrow icon
const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

// Feature Icons - Clean SVG icons
const IconBolt = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const IconBrain = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
  </svg>
);

const IconSparkles = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>
  </svg>
);

// Feature data with icon components
const features = [
  {
    icon: IconBolt,
    title: 'Easy Scheduling',
    description: 'Type what you need and watch Gatherly work its magic. No more back-and-forth emails.',
    accent: 'mint'
  },
  {
    icon: IconBrain,
    title: 'Gatherly Gets It',
    description: 'Our smart agent understands context, reaches out to people, and finds the perfect time.',
    accent: 'peach'
  },
  {
    icon: IconCalendar,
    title: 'Calendar Sync',
    description: 'Connects with Google Calendar to see your real availability and avoid double-booking.',
    accent: 'lavender'
  },
  {
    icon: IconSparkles,
    title: 'Invite Anyone',
    description: 'Participants don\'t need an account. They just click a link and share their times.',
    accent: 'butter'
  }
];

// How it works steps
const steps = [
  { num: '01', title: 'Just say it', desc: '"Coffee with Sarah next Tuesday at 3pm"' },
  { num: '02', title: 'We handle it', desc: 'Gatherly reaches out and coordinates' },
  { num: '03', title: 'It\'s done', desc: 'Calendar invites sent automatically' }
];

export const MarketingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDemo, setShowDemo] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Smooth scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Use centralized signInWithGoogle for consistent scopes
      const { signInWithGoogle } = await import('../lib/supabase');
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };
  const handleEmailSignIn = () => navigate('/auth?mode=signin');
  const handleSignUp = () => navigate('/auth?mode=signup');

  return (
    <div className="g-page">
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />

      {/* Navigation */}
      <nav className="g-nav">
        <div className="g-nav-inner">
          <div
            className="g-logo"
            onClick={() => {
              // If already on home, just scroll to top and keep hash intact
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}
          >
            <GatherlyLogo size={28} color="#22c55e" />
            <span>Gatherly</span>
          </div>
          <div className="g-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <button className="g-btn g-btn-nav" onClick={handleEmailSignIn}>
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="g-hero" ref={heroRef}>
        <div className="g-hero-content">
          <div className="g-hero-badge scroll-reveal">
            <span className="badge-pulse" />
            <span>Meet 10x faster</span>
          </div>
          
          <h1 className="g-hero-title scroll-reveal">
            Schedule face time
            <br />
            <span className="title-gradient">without the hassle</span>
          </h1>
          
          <p className="g-hero-desc scroll-reveal">
            Stop chasing people. Just tell Gatherly what you need, 
            and it handles everything—faster than When2Meet, 
            smarter than Calendly.
          </p>

          <div className="g-hero-actions scroll-reveal">
            <button className="g-btn g-btn-primary" onClick={handleGoogleSignIn}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button className="g-btn g-btn-secondary" onClick={() => setShowDemo(true)}>
              <span>Watch Demo</span>
              <ArrowRight />
            </button>
          </div>

          <div className="g-hero-meta scroll-reveal">
            <span>Free forever</span>
            <span className="meta-dot">•</span>
            <span>Coordinate busy groups</span>
            <span className="meta-dot">•</span>
            <span>2 min setup</span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="g-hero-visual scroll-reveal" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
          <div className="visual-card" onClick={() => setShowDemo(true)}>
            <div className="visual-header">
              <div className="visual-dots">
                <span /><span /><span />
              </div>
              <span className="visual-title">Gatherly</span>
            </div>
            <div className="visual-body">
              <div className="chat-msg user">
                <p>Schedule lunch with the team next Thursday</p>
              </div>
              <div className="chat-msg bot">
                <p>
                  <span className="typing">●●●</span>
                  Done! I've reached out to 4 team members and found Thursday 12:30pm works for everyone.
                </p>
              </div>
              <div className="visual-event">
                <span className="event-dot" />
                <div className="event-info">
                  <strong>Team Lunch</strong>
                  <span>Thu, Dec 12 • 12:30 PM</span>
                </div>
                <span className="event-status">Confirmed</span>
              </div>
            </div>
            <div className="visual-cta">
              <span>▶</span>
              <span>Try it yourself</span>
            </div>
          </div>
        </div>

        {/* Floating elements for depth */}
        <div className="g-hero-float f1" style={{ transform: `translateY(${scrollY * -0.15}px)` }} />
        <div className="g-hero-float f2" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
        <div className="g-hero-float f3" style={{ transform: `translateY(${scrollY * -0.12}px)` }} />
      </section>

      {/* Sliding Marquee Banner */}
      <section className="g-marquee" onClick={handleSignUp}>
        <div className="marquee-track">
          <div className="marquee-content">
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
          </div>
          <div className="marquee-content" aria-hidden="true">
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
            <span>Schedule now</span>
            <span className="marquee-arrow">→</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="g-features" id="features">
        <div className="g-section-header scroll-reveal">
          <span className="g-section-badge">Features</span>
          <h2 className="g-section-title">Everything you need</h2>
          <p className="g-section-desc">
            Your sign to never use When2Meet again.
          </p>
        </div>

        <div className="g-features-grid">
          {features.map((feature, i) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={i} 
                className={`g-feature-card ${feature.accent} scroll-reveal`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="feature-icon"><IconComponent /></div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="g-how" id="how-it-works">
        <div className="g-section-header scroll-reveal">
          <span className="g-section-badge mint">How it works</span>
          <h2 className="g-section-title">Simple as 1-2-3</h2>
        </div>

        <div className="g-steps">
          {steps.map((step, i) => (
            <div key={i} className="g-step scroll-reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="step-num">{step.num}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="g-cta scroll-reveal">
        <div className="g-cta-inner">
          <h2>Ready to save hours every week?</h2>
          <p>Join those who've simplified their scheduling.</p>
          
          <div className="g-cta-actions">
            <button className="g-btn g-btn-primary g-btn-lg" onClick={handleGoogleSignIn}>
              <GoogleIcon />
              <span>Get started free</span>
            </button>
            <button className="g-btn g-btn-ghost" onClick={handleSignUp}>
              Create account with email
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="g-footer">
        <div className="g-footer-inner">
          <div className="footer-brand">
            <GatherlyLogo size={24} color="#22c55e" />
            <span>Gatherly</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="/story">Our Story</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </div>
          <p className="footer-copy">© 2025 Gatherly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingPage;
