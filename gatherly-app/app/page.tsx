'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const handleTryNow = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/app');
    }, 800);
  };

  return (
    <>
      {/* Black transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'black',
              zIndex: 200
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'linear-gradient(to bottom, rgba(91, 127, 168, 0.95), rgba(91, 127, 168, 0.8))',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'white',
                borderRadius: '9999px'
              }} />
              <span style={{
                color: 'white',
                fontWeight: 600,
                fontSize: '18px'
              }}>Gatherly</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
          paddingTop: '128px',
          paddingBottom: '80px',
          overflow: 'hidden'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ maxWidth: '1280px', margin: '0 auto' }}
            >
              {/* Headlines with serif font */}
              <h1 style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 700,
                color: 'white',
                marginBottom: '24px',
                lineHeight: 1.1,
                letterSpacing: '-0.02em'
              }}>
                #1 AI assistant
                <br />
                for scheduling
              </h1>
              
              {/* Description with grainy yellow box */}
              <div style={{
                position: 'relative',
                display: 'inline-block',
                marginBottom: '32px'
              }}>
                {/* Grainy yellow background */}
                <div style={{
                  position: 'absolute',
                  inset: '-12px -20px',
                  backgroundColor: '#fbbf24',
                  opacity: 0.85,
                  borderRadius: '12px',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundBlendMode: 'multiply',
                  zIndex: 0,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }} />
                
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(15px, 1.5vw, 20px)',
                  color: '#111827',
                  maxWidth: '600px',
                  margin: 0,
                  lineHeight: 1.6,
                  position: 'relative',
                  zIndex: 1,
                  fontWeight: 500
                }}>
                  Natural language scheduling that works like magic.
                  <br />
                  Just tell Gatherly what you need.
                </p>
              </div>
              
              <div style={{ marginTop: '32px' }}>
                {/* Button */}
                <motion.button
                  onClick={handleTryNow}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    backgroundColor: '#4a8fff',
                    color: 'white',
                    padding: '16px 40px',
                    fontSize: '18px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(74, 143, 255, 0.3)',
                    transition: 'all 0.2s',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d7de6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a8fff'}
                >
                  Try Now
                </motion.button>
              </div>

              {/* Updated tagline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                style={{ marginTop: '48px' }}
              >
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 'clamp(16px, 1.5vw, 24px)',
                  fontWeight: 500
                }}>
                  Gatherly {'>'} When2Meet ✨
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}