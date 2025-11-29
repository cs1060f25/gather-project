'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown } from 'lucide-react';

export default function LandingPage() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const router = useRouter();
  const containerRef = useRef(null);
  
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const y = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50 && !hasScrolled) {
        setHasScrolled(true);
        setTimeout(() => {
          router.push('/app');
        }, 800);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, router]);

  return (
    <div style={{ height: '200vh', backgroundColor: 'white' }}>
      {/* Hero Section */}
      <motion.div
        ref={containerRef}
        style={{
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #5b7fa8 0%, #6b8fb8 50%, #7ba3c8 100%)',
          overflow: 'hidden'
        }}
      >
        {/* Animated background blobs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              top: '10%',
              left: '10%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(40px)'
            }}
          />
        </div>

        <motion.div
          style={{ opacity, scale, y }}
          className="text-center relative z-10 px-6"
        >
          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 700,
              color: 'white',
              marginBottom: '32px',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}
          >
            Schedule group
            <br />
            hangouts instantly
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(18px, 2.5vw, 28px)',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '32px',
              fontWeight: 500
            }}
          >
            Gatherly {'>'} When2Meet
          </motion.p>

          {/* Sign In Button */}
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/auth/login')}
            style={{
              padding: '16px 40px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#5b7fa8',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '48px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            Get Started →
          </motion.button>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500
            }}>
              Scroll to start
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ArrowDown style={{ 
                height: '24px', 
                width: '24px', 
                color: 'rgba(255, 255, 255, 0.8)' 
              }} />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Transition overlay */}
      <AnimatePresence>
        {hasScrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#000',
              zIndex: 300,
              pointerEvents: 'none'
            }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}