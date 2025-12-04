import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StoryPage.css';

// Founder images
const IkennaImage = '/founders/ikenna.jpg';
const MilanImage = '/founders/milan.jpg';
const TalhaImage = '/founders/talha.jpg';

// Gatherly Logo
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

// Animated Clock SVG for When2Meet section
const AnimatedClock = () => (
  <svg className="scene-illustration clock-illustration" viewBox="0 0 200 200" fill="none">
    <circle cx="100" cy="100" r="80" stroke="#1A1A1A" strokeWidth="4" fill="#FAFAFA"/>
    <circle cx="100" cy="100" r="70" stroke="#E5E5E5" strokeWidth="2" fill="none"/>
    {/* Hour markers */}
    {[...Array(12)].map((_, i) => (
      <line 
        key={i}
        x1="100" y1="30" x2="100" y2="40"
        stroke="#1A1A1A" strokeWidth="3"
        transform={`rotate(${i * 30} 100 100)`}
      />
    ))}
    {/* Animated hands */}
    <line className="clock-hour-hand" x1="100" y1="100" x2="100" y2="55" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round"/>
    <line className="clock-minute-hand" x1="100" y1="100" x2="100" y2="40" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="100" cy="100" r="6" fill="#1A1A1A"/>
    {/* Frustration marks */}
    <g className="frustration-marks">
      <path d="M160 40 L170 30 M165 45 L180 35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
      <path d="M40 40 L30 30 M35 45 L20 35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
    </g>
  </svg>
);

// Empty Room SVG for Ikenna's section
const EmptyRoomSVG = () => (
  <svg className="scene-illustration room-illustration" viewBox="0 0 300 200" fill="none">
    {/* Room */}
    <rect x="20" y="40" width="260" height="140" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="3"/>
    {/* Floor */}
    <line x1="20" y1="180" x2="280" y2="180" stroke="#1A1A1A" strokeWidth="3"/>
    {/* Table */}
    <rect x="80" y="120" width="140" height="10" fill="#8B4513" stroke="#1A1A1A" strokeWidth="2"/>
    <rect x="90" y="130" width="10" height="50" fill="#8B4513" stroke="#1A1A1A" strokeWidth="2"/>
    <rect x="200" y="130" width="10" height="50" fill="#8B4513" stroke="#1A1A1A" strokeWidth="2"/>
    {/* Empty chairs with animation */}
    <g className="empty-chair chair-1">
      <rect x="50" y="100" width="30" height="30" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="2" rx="3"/>
      <rect x="50" y="130" width="10" height="30" fill="#1A1A1A"/>
      <rect x="70" y="130" width="10" height="30" fill="#1A1A1A"/>
    </g>
    <g className="empty-chair chair-2">
      <rect x="220" y="100" width="30" height="30" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="2" rx="3"/>
      <rect x="220" y="130" width="10" height="30" fill="#1A1A1A"/>
      <rect x="240" y="130" width="10" height="30" fill="#1A1A1A"/>
    </g>
    <g className="empty-chair chair-3">
      <rect x="135" y="60" width="30" height="30" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="2" rx="3"/>
      <rect x="135" y="90" width="10" height="20" fill="#1A1A1A"/>
      <rect x="155" y="90" width="10" height="20" fill="#1A1A1A"/>
    </g>
    {/* Question marks floating */}
    <text className="floating-question q1" x="60" y="80" fontSize="24" fill="#ef4444">?</text>
    <text className="floating-question q2" x="230" y="80" fontSize="24" fill="#ef4444">?</text>
    <text className="floating-question q3" x="145" y="50" fontSize="24" fill="#ef4444">?</text>
    {/* Clock on wall */}
    <circle cx="250" cy="60" r="15" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="2"/>
    <line x1="250" y1="60" x2="250" y2="50" stroke="#1A1A1A" strokeWidth="2"/>
    <line x1="250" y1="60" x2="258" y2="65" stroke="#22c55e" strokeWidth="2"/>
  </svg>
);

// Calendar Nightmare SVG
const CalendarNightmareSVG = () => (
  <svg className="scene-illustration calendar-illustration" viewBox="0 0 300 200" fill="none">
    {/* Calendar grid */}
    <rect x="30" y="30" width="240" height="160" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="3" rx="5"/>
    <rect x="30" y="30" width="240" height="30" fill="#ef4444" stroke="#1A1A1A" strokeWidth="3" rx="5"/>
    {/* Grid lines */}
    {[...Array(7)].map((_, i) => (
      <line key={`v${i}`} x1={30 + (i+1) * 34.3} y1="60" x2={30 + (i+1) * 34.3} y2="190" stroke="#E5E5E5" strokeWidth="1"/>
    ))}
    {[...Array(4)].map((_, i) => (
      <line key={`h${i}`} x1="30" y1={60 + (i+1) * 32.5} x2="270" y2={60 + (i+1) * 32.5} stroke="#E5E5E5" strokeWidth="1"/>
    ))}
    {/* Overwhelmed meeting blocks - animated */}
    <rect className="meeting-block m1" x="35" y="65" width="30" height="25" fill="#FFD3B6" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m2" x="70" y="65" width="30" height="25" fill="#A8E6CF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m3" x="105" y="65" width="30" height="25" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m4" x="140" y="65" width="30" height="25" fill="#FFD3B6" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m5" x="175" y="65" width="30" height="25" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m6" x="210" y="65" width="30" height="25" fill="#A8E6CF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m7" x="35" y="95" width="30" height="25" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m8" x="70" y="95" width="30" height="25" fill="#FFD3B6" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m9" x="105" y="95" width="30" height="25" fill="#A8E6CF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m10" x="140" y="95" width="30" height="25" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m11" x="175" y="95" width="30" height="25" fill="#C9B1FF" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    <rect className="meeting-block m12" x="210" y="95" width="30" height="25" fill="#FFD3B6" stroke="#1A1A1A" strokeWidth="1" rx="2"/>
    {/* Stress lines */}
    <g className="stress-lines">
      <line x1="280" y1="50" x2="295" y2="35" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
      <line x1="285" y1="60" x2="300" y2="50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
      <line x1="280" y1="70" x2="295" y2="65" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
    </g>
  </svg>
);

// Solution/Magic SVG
const MagicSolutionSVG = () => (
  <svg className="scene-illustration magic-illustration" viewBox="0 0 300 200" fill="none">
    {/* Central magic circle */}
    <circle className="magic-circle outer" cx="150" cy="100" r="80" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="10 5"/>
    <circle className="magic-circle inner" cx="150" cy="100" r="60" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
    <circle cx="150" cy="100" r="40" fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeWidth="2"/>
    
    {/* Gatherly logo in center */}
    <g transform="translate(130, 80)">
      <path d="M 8.5 21.0 A 10 10 0 1 0 3.0 11.5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M13 6V12L17 14" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="6" cy="16" r="5.2" fill="none" stroke="#22c55e" strokeWidth="2"/>
      <path d="M6 14V18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4 16H8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
    </g>
    
    {/* Sparkles */}
    <g className="sparkles">
      <path className="sparkle s1" d="M60 50 L65 55 L60 60 L55 55 Z" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1"/>
      <path className="sparkle s2" d="M240 50 L245 55 L240 60 L235 55 Z" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1"/>
      <path className="sparkle s3" d="M60 150 L65 155 L60 160 L55 155 Z" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1"/>
      <path className="sparkle s4" d="M240 150 L245 155 L240 160 L235 155 Z" fill="#FFF9C4" stroke="#1A1A1A" strokeWidth="1"/>
      <circle className="sparkle s5" cx="100" cy="40" r="4" fill="#A8E6CF"/>
      <circle className="sparkle s6" cx="200" cy="40" r="4" fill="#C9B1FF"/>
      <circle className="sparkle s7" cx="100" cy="160" r="4" fill="#FFD3B6"/>
      <circle className="sparkle s8" cx="200" cy="160" r="4" fill="#A8E6CF"/>
    </g>
    
    {/* Connection lines to people */}
    <line className="connection-line l1" x1="70" y1="100" x2="30" y2="60" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
    <line className="connection-line l2" x1="70" y1="100" x2="30" y2="140" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
    <line className="connection-line l3" x1="230" y1="100" x2="270" y2="60" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
    <line className="connection-line l4" x1="230" y1="100" x2="270" y2="140" stroke="#22c55e" strokeWidth="2" strokeDasharray="5 3"/>
    
    {/* People icons */}
    <circle cx="30" cy="55" r="10" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="2"/>
    <circle cx="30" cy="145" r="10" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="2"/>
    <circle cx="270" cy="55" r="10" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="2"/>
    <circle cx="270" cy="145" r="10" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="2"/>
    
    {/* Check marks */}
    <path className="checkmark c1" d="M25 55 L28 58 L35 50" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path className="checkmark c2" d="M25 145 L28 148 L35 140" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path className="checkmark c3" d="M265 55 L268 58 L275 50" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path className="checkmark c4" d="M265 145 L268 148 L275 140" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Typewriter text component
const TypewriterText = ({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [isVisible, text, delay, speed]);

  return (
    <span ref={ref} className="typewriter-text">
      {displayedText}
      <span className="typewriter-cursor">|</span>
    </span>
  );
};

// Parallax section component (reserved for future use)
const _ParallaxSection = ({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const offset = rect.top + scrolled;
      const parallax = (scrolled - offset) * speed;
      ref.current.style.transform = `translateY(${parallax}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return <div ref={ref} className="parallax-content">{children}</div>;
};

export const StoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(progress);
      
      // Determine active chapter
      const chapters = document.querySelectorAll('.story-scene');
      chapters.forEach((chapter, index) => {
        const rect = chapter.getBoundingClientRect();
        if (rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
          setActiveChapter(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.2, rootMargin: '-50px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="story-page-v2">
      {/* Progress bar */}
      <div className="scroll-progress-bar">
        <div className="scroll-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Chapter indicators */}
      <div className="chapter-indicators">
        {['Intro', 'Milan', 'Ikenna', 'Talha', 'Solution'].map((name, i) => (
          <button
            key={name}
            className={`chapter-dot ${activeChapter === i ? 'active' : ''}`}
            onClick={() => {
              const scenes = document.querySelectorAll('.story-scene');
              scenes[i]?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="chapter-dot-label">{name}</span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <nav className="story-nav-v2">
        <button className="back-btn-v2" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        <div className="nav-logo-v2" onClick={() => navigate('/')}>
          <GatherlyLogo size={24} color="#1A1A1A" />
          <span>Gatherly</span>
        </div>
      </nav>

      {/* Scene 0: Intro */}
      <section className="story-scene scene-intro">
        <div className="scene-content">
          <div className="intro-badge animate-on-scroll">The Origin Story</div>
          <h1 className="intro-title animate-on-scroll">
            Three students.<br/>
            <span className="highlight-text">One shared frustration.</span>
          </h1>
          <p className="intro-subtitle animate-on-scroll">
            Scroll to experience how Gatherly was born.
          </p>
          <div className="scroll-hint animate-on-scroll">
            <div className="mouse-icon">
              <div className="mouse-wheel" />
            </div>
            <span>Scroll down</span>
          </div>
        </div>
        <div className="intro-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
      </section>

      {/* Scene 1: Milan */}
      <section className="story-scene scene-milan">
        <div className="scene-bg">
          <img src={MilanImage} alt="" className="bg-portrait" />
        </div>
        <div className="scene-content">
          <div className="scene-grid">
            <div className="scene-visual animate-on-scroll">
              <AnimatedClock />
            </div>
            <div className="scene-narrative">
              <div className="founder-badge animate-on-scroll">
                <img src={MilanImage} alt="Milan" className="badge-avatar" />
                <div className="badge-info">
                  <span className="badge-name">Milan Naropanth</span>
                  <span className="badge-school">Harvard College '27</span>
                </div>
              </div>
              <h2 className="scene-title animate-on-scroll">
                "Another When2Meet grid. Another hour wasted."
              </h2>
              <div className="narrative-text">
                <p className="animate-on-scroll">
                  <TypewriterText text="Create the poll. Send the link. Wait. Send reminders. Manually count overlaps. Send another message." delay={500} />
                </p>
                <p className="animate-on-scroll highlight-paragraph">
                  <strong>Hours of life, gone.</strong> All for a one-hour meeting.
                </p>
                <p className="animate-on-scroll">
                  There had to be a better way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scene 2: Ikenna */}
      <section className="story-scene scene-ikenna">
        <div className="scene-bg">
          <img src={IkennaImage} alt="" className="bg-portrait" />
        </div>
        <div className="scene-content">
          <div className="scene-grid reverse">
            <div className="scene-narrative">
              <div className="founder-badge animate-on-scroll">
                <img src={IkennaImage} alt="Ikenna" className="badge-avatar" />
                <div className="badge-info">
                  <span className="badge-name">Ikenna Ogbogu</span>
                  <span className="badge-school">Harvard College '27</span>
                </div>
              </div>
              <h2 className="scene-title animate-on-scroll">
                "3:15 PM. The meeting room was empty."
              </h2>
              <div className="narrative-text">
                <p className="animate-on-scroll">
                  The calendar invite said 3 PM. Everyone clicked "accept."
                </p>
                <p className="animate-on-scroll">
                  <TypewriterText text="But accepting an invite isn't the same as checking your calendar. People commit on autopilot." delay={800} />
                </p>
                <p className="animate-on-scroll highlight-paragraph">
                  <strong>The problem wasn't scheduling—it was commitment.</strong>
                </p>
              </div>
            </div>
            <div className="scene-visual animate-on-scroll">
              <EmptyRoomSVG />
            </div>
          </div>
        </div>
      </section>

      {/* Scene 3: Talha */}
      <section className="story-scene scene-talha">
        <div className="scene-bg">
          <img src={TalhaImage} alt="" className="bg-portrait" />
        </div>
        <div className="scene-content">
          <div className="scene-grid">
            <div className="scene-visual animate-on-scroll">
              <CalendarNightmareSVG />
            </div>
            <div className="scene-narrative">
              <div className="founder-badge animate-on-scroll">
                <img src={TalhaImage} alt="Talha" className="badge-avatar" />
                <div className="badge-info">
                  <span className="badge-name">Talha Minhas</span>
                  <span className="badge-school">Harvard Business School '26</span>
                </div>
              </div>
              <h2 className="scene-title animate-on-scroll">
                "8 AM to 7 PM. Eleven hours of meetings."
              </h2>
              <div className="narrative-text">
                <p className="animate-on-scroll">
                  <TypewriterText text="In the business world, calendars became weapons. 'Quick 30 minutes' here, 'short sync' there—entire days disappeared." delay={500} />
                </p>
                <p className="animate-on-scroll highlight-paragraph">
                  <strong>The calendar was supposed to help. It became the problem.</strong>
                </p>
                <p className="animate-on-scroll">
                  What if scheduling was smarter?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scene 4: Solution */}
      <section className="story-scene scene-solution">
        <div className="scene-content centered">
          <div className="solution-header animate-on-scroll">
            <div className="founders-trio">
              <div className="trio-member">
                <img src={MilanImage} alt="Milan" />
              </div>
              <div className="trio-member center">
                <img src={IkennaImage} alt="Ikenna" />
              </div>
              <div className="trio-member">
                <img src={TalhaImage} alt="Talha" />
              </div>
            </div>
            <h2 className="solution-title">And so, Gatherly was born.</h2>
          </div>
          
          <div className="solution-visual animate-on-scroll">
            <MagicSolutionSVG />
          </div>
          
          <div className="solution-narrative animate-on-scroll">
            <p className="big-quote">
              "What if we built something that actually understood how people schedule?"
            </p>
            <div className="solution-features">
              <div className="feature-item">
                <div className="feature-icon">💬</div>
                <p>Just say what you need</p>
              </div>
              <div className="feature-arrow">→</div>
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <p>AI handles the coordination</p>
              </div>
              <div className="feature-arrow">→</div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <p>Meetings that actually happen</p>
              </div>
            </div>
          </div>

          <div className="final-cta animate-on-scroll">
            <button className="cta-button" onClick={() => navigate('/auth?mode=signup')}>
              <GatherlyLogo size={20} color="#FAFAFA" />
              <span>Start scheduling smarter</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="story-footer-v2">
        <div className="footer-content">
          <div className="footer-brand" onClick={() => navigate('/')}>
            <GatherlyLogo size={24} color="#1A1A1A" />
            <span>Gatherly</span>
          </div>
          <p>Built with ❤️ at Harvard</p>
        </div>
      </footer>
    </div>
  );
};

export default StoryPage;
