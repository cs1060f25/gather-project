import { motion, MotionValue, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Props {
  progress: MotionValue<number>
}

export default function SceneIntent({ progress }: Props) {
  const [typingText, setTypingText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const fullText = "I want to meet with Ikenna this week for lunch. Find me a time."

  // Scene animations
  const opacity = useTransform(progress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.95])
  const titleY = useTransform(progress, [0, 0.2, 0.8, 1], [30, 0, 0, -30])
  const chatBarY = useTransform(progress, [0.2, 0.4, 0.8, 1], [60, 0, 0, -40])
  const chatBarOpacity = useTransform(progress, [0.2, 0.4, 0.8, 1], [0, 1, 1, 0])

  // Typing animation
  useEffect(() => {
    const unsubscribe = progress.on('change', (latest) => {
      if (latest > 0.4 && latest < 0.8) {
        const typingProgress = (latest - 0.4) / 0.3 // Normalize to 0-1 for typing range
        const charCount = Math.floor(typingProgress * fullText.length)
        setTypingText(fullText.slice(0, charCount))
      }
    })
    return unsubscribe
  }, [progress])

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.section 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, scale }}
    >
      <div className="relative w-full max-w-5xl px-8">
        {/* Title */}
        <motion.div 
          className="text-center mb-20"
          style={{ y: titleY }}
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-sf-display font-semibold text-gray-900 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Scheduling, reimagined.
          </motion.h1>
        </motion.div>

        {/* Liquid Glass Chat Bar */}
        <motion.div 
          className="relative mx-auto max-w-2xl"
          style={{ y: chatBarY, opacity: chatBarOpacity }}
        >
          <motion.div 
            className="glass-panel p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2 
            }}
          >
            {/* Chat Input Container */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  J
                </div>
              </div>

              {/* Input Field */}
              <div className="flex-1 relative">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200/50">
                  <div className="flex items-center">
                    <span className="text-gray-900 font-sf-text text-[17px] leading-relaxed">
                      {typingText}
                      {showCursor && (
                        <motion.span 
                          className="inline-block w-0.5 h-5 bg-system-blue ml-0.5"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: showCursor ? 1 : 0 }}
                          transition={{ duration: 0.1 }}
                        />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <motion.button 
                className="flex-shrink-0 w-10 h-10 rounded-full bg-system-blue flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg 
                  className="w-5 h-5 text-white transform rotate-45 -translate-x-[1px]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              </motion.button>
            </div>

            {/* Typing Indicator Dots */}
            <motion.div 
              className="flex space-x-3 mt-4 ml-14"
              initial={{ opacity: 0 }}
              animate={{ opacity: typingText.length > 10 ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
              />
              <motion.div 
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div 
                className="w-2 h-2 bg-gray-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
              />
            </motion.div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div 
            className="absolute -top-20 -right-20 w-40 h-40 gradient-orb blur-3xl opacity-30"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-16 -left-16 w-32 h-32 gradient-orb blur-2xl opacity-40"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </motion.div>
      </div>
    </motion.section>
  )
}
