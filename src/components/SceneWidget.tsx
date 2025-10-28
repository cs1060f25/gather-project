import { motion, MotionValue, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Props {
  progress: MotionValue<number>
}

export default function SceneWidget({ progress }: Props) {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  // Scene animations
  const opacity = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9])
  
  // Widget animations
  const widgetScale = useTransform(progress, [0.1, 0.3], [0.8, 1])
  const widgetY = useTransform(progress, [0.1, 0.3], [50, 0])
  const widgetRotateX = useTransform(progress, [0.1, 0.3], [25, 0])
  
  // Confirmation animations
  const confirmationScale = useTransform(progress, [0.5, 0.6], [0, 1])
  const checkmarkPathLength = useTransform(progress, [0.55, 0.65], [0, 1])

  useEffect(() => {
    const unsubscribe = progress.on('change', (latest) => {
      if (latest > 0.5 && !isConfirmed) {
        setIsConfirmed(true)
        setTimeout(() => setShowRipple(true), 100)
        setTimeout(() => setShowRipple(false), 1500)
      }
    })
    return unsubscribe
  }, [progress, isConfirmed])

  return (
    <motion.section 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, scale }}
    >
      <div className="relative w-full max-w-lg px-8">
        {/* Calendar Widget Card */}
        <motion.div 
          className="relative"
          style={{ 
            scale: widgetScale, 
            y: widgetY,
            perspective: 1000
          }}
        >
          <motion.div 
            className="calendar-widget relative overflow-hidden"
            style={{ rotateX: widgetRotateX }}
            initial={{ boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' }}
            animate={{ 
              boxShadow: isConfirmed 
                ? '0 20px 60px rgba(0, 122, 255, 0.2)' 
                : '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">14</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Thursday</p>
                  <p className="font-sf-display font-semibold text-xl text-gray-900">March 2024</p>
                </div>
              </div>
              <motion.div 
                className="text-3xl"
                animate={{ rotate: isConfirmed ? [0, -10, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5 }}
              >
                📅
              </motion.div>
            </div>

            {/* Event Details */}
            <motion.div 
              className="bg-system-gray-6 rounded-2xl p-4 mb-4"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: isConfirmed ? 1 : 0.8 }}
            >
              <div className="flex items-start space-x-3">
                <div className="w-1 h-16 bg-system-blue rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-sf-display font-semibold text-lg text-gray-900 mb-2">
                    Lunch with Ikenna
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>1:00 PM - 2:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Joe's Pizza, Harvard Square</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Attendees */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Attendees</p>
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 border border-gray-200"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">J</span>
                  </div>
                  <span className="text-sm text-gray-700">John</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 bg-white rounded-full px-3 py-1.5 border border-gray-200"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">I</span>
                  </div>
                  <span className="text-sm text-gray-700">Ikenna</span>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <motion.button 
                className="flex-1 bg-system-gray-6 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Decline
              </motion.button>
              <motion.button 
                className={`flex-1 font-medium py-3 rounded-xl transition-all ${
                  isConfirmed 
                    ? 'bg-green-500 text-white' 
                    : 'bg-system-blue text-white hover:bg-blue-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConfirmed ? 'Added to Calendar' : 'Accept'}
              </motion.button>
            </div>

            {/* Confirmation Overlay */}
            {isConfirmed && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl"
                  style={{ scale: confirmationScale }}
                >
                  <motion.svg 
                    className="w-16 h-16 mx-auto mb-3"
                    viewBox="0 0 64 64"
                    initial={{ rotate: -90 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="30"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.path
                      d="M20 32 L28 40 L44 24"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ pathLength: checkmarkPathLength }}
                    />
                  </motion.svg>
                  <p className="text-center font-sf-display font-semibold text-gray-900">
                    Event Added
                  </p>
                  <p className="text-center text-sm text-gray-500 mt-1">
                    Calendar invites sent
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Ripple Effect */}
            {showRipple && (
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ 
                  width: 600, 
                  height: 600, 
                  opacity: 0 
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              >
                <div className="w-full h-full rounded-full bg-system-blue/20" />
              </motion.div>
            )}

            {/* iOS-style icons */}
            <div className="absolute top-5 right-5 flex space-x-2">
              <motion.div 
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div 
          className="absolute -top-20 -left-20 w-40 h-40 gradient-orb blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -bottom-20 -right-20 w-40 h-40 gradient-orb blur-3xl opacity-20"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        />
      </div>
    </motion.section>
  )
}
