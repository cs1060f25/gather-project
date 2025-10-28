import { motion, MotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  progress: MotionValue<number>
}

interface CalendarDay {
  date: number
  hasEvent?: boolean
  isHighlighted?: boolean
}

export default function SceneMagic({ progress }: Props) {
  const [showFinalText, setShowFinalText] = useState(false)

  // Scene animations
  const opacity = useTransform(progress, [0, 0.2, 0.9, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 1.1])
  
  // Calendar animations
  const calendarScale = useTransform(progress, [0.1, 0.3, 0.7], [0.5, 1, 0.85])
  const calendar1X = useTransform(progress, [0.1, 0.3, 0.6], [-200, 0, -150])
  const calendar2X = useTransform(progress, [0.1, 0.3, 0.6], [200, 0, 150])
  const calendarY = useTransform(progress, [0.1, 0.3, 0.6], [0, 0, -50])
  
  // Text animations
  const textOpacity = useTransform(progress, [0.6, 0.8], [0, 1])
  const textY = useTransform(progress, [0.6, 0.8], [40, 0])
  
  // Final fade
  const fadeToWhite = useTransform(progress, [0.9, 1], [0, 1])

  useEffect(() => {
    const unsubscribe = progress.on('change', (latest) => {
      if (latest > 0.6) {
        setShowFinalText(true)
      }
    })
    return unsubscribe
  }, [progress])

  // Generate calendar days
  const generateCalendarDays = (highlightDate: number): CalendarDay[] => {
    const days: CalendarDay[] = []
    for (let i = 1; i <= 31; i++) {
      days.push({
        date: i,
        hasEvent: [5, 12, 14, 19, 26].includes(i),
        isHighlighted: i === highlightDate
      })
    }
    return days
  }

  const march2024Days = generateCalendarDays(14)

  return (
    <>
      <motion.section 
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity, scale }}
      >
        <div className="relative w-full max-w-7xl px-8">
          {/* Dual Calendars Container */}
          <motion.div 
            className="flex justify-center items-start space-x-8"
            style={{ y: calendarY }}
          >
            {/* Host Calendar */}
            <motion.div 
              className="relative"
              style={{ x: calendar1X, scale: calendarScale }}
            >
              <motion.div 
                className="calendar-widget w-[400px] p-6"
                initial={{ rotateY: -15 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold">J</span>
                    </div>
                    <div>
                      <h3 className="font-sf-display font-semibold text-lg text-gray-900">John's Calendar</h3>
                      <p className="text-xs text-gray-500">March 2024</p>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {march2024Days.map((day, idx) => (
                    <motion.div
                      key={idx}
                      className={`
                        relative text-center py-2 rounded-lg cursor-pointer transition-all
                        ${day.isHighlighted 
                          ? 'bg-system-blue text-white font-bold shadow-lg' 
                          : day.hasEvent 
                            ? 'bg-blue-50 text-gray-900' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={!day.isHighlighted ? { scale: 1.1 } : {}}
                    >
                      <span className="text-sm">{day.date}</span>
                      {day.hasEvent && !day.isHighlighted && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-system-blue rounded-full" />
                      )}
                      {day.isHighlighted && (
                        <motion.div 
                          className="absolute inset-0 rounded-lg bg-system-blue"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Event Highlight */}
                {showFinalText && (
                  <motion.div 
                    className="bg-blue-50 rounded-xl p-3 border border-system-blue/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-system-blue/10 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Lunch with Ikenna</p>
                        <p className="text-xs text-gray-500">Thu, Mar 14 • 1:00 PM</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Glow Effect */}
              <motion.div 
                className="absolute inset-0 rounded-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 40px rgba(0, 122, 255, 0)',
                    '0 0 60px rgba(0, 122, 255, 0.3)',
                    '0 0 40px rgba(0, 122, 255, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ zIndex: -1 }}
              />
            </motion.div>

            {/* Guest Calendar */}
            <motion.div 
              className="relative"
              style={{ x: calendar2X, scale: calendarScale }}
            >
              <motion.div 
                className="calendar-widget w-[400px] p-6"
                initial={{ rotateY: 15 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <span className="text-white font-bold">I</span>
                    </div>
                    <div>
                      <h3 className="font-sf-display font-semibold text-lg text-gray-900">Ikenna's Calendar</h3>
                      <p className="text-xs text-gray-500">March 2024</p>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {march2024Days.map((day, idx) => (
                    <motion.div
                      key={idx}
                      className={`
                        relative text-center py-2 rounded-lg cursor-pointer transition-all
                        ${day.isHighlighted 
                          ? 'bg-green-500 text-white font-bold shadow-lg' 
                          : day.hasEvent 
                            ? 'bg-green-50 text-gray-900' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }
                      `}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      whileHover={!day.isHighlighted ? { scale: 1.1 } : {}}
                    >
                      <span className="text-sm">{day.date}</span>
                      {day.hasEvent && !day.isHighlighted && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                      )}
                      {day.isHighlighted && (
                        <motion.div 
                          className="absolute inset-0 rounded-lg bg-green-500"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Event Highlight */}
                {showFinalText && (
                  <motion.div 
                    className="bg-green-50 rounded-xl p-3 border border-green-500/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="text-lg">✨</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">Lunch with John</p>
                        <p className="text-xs text-gray-500">Thu, Mar 14 • 1:00 PM</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Glow Effect */}
              <motion.div 
                className="absolute inset-0 rounded-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 40px rgba(34, 197, 94, 0)',
                    '0 0 60px rgba(34, 197, 94, 0.3)',
                    '0 0 40px rgba(34, 197, 94, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                style={{ zIndex: -1 }}
              />
            </motion.div>
          </motion.div>

          {/* Connection Arc */}
          {showFinalText && (
            <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 1000 400">
              <motion.path
                d="M 250 200 Q 500 100 750 200"
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="2"
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                  <stop offset="50%" stopColor="rgba(147, 51, 234, 0.5)" />
                  <stop offset="100%" stopColor="rgba(236, 72, 153, 0.5)" />
                </linearGradient>
              </defs>
            </svg>
          )}

          {/* Final Text */}
          <motion.div 
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 text-center"
            style={{ opacity: textOpacity, y: textY }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-sf-display font-light text-gray-900 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: showFinalText ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Scheduling made effortless
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: showFinalText ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              Powered by your intelligent agent
            </motion.p>

          </motion.div>

          {/* Background Elements */}
          <motion.div 
            className="absolute top-20 left-20 w-96 h-96 gradient-orb blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-20 right-20 w-96 h-96 gradient-glow blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 15, repeat: Infinity }}
          />
        </div>
      </motion.section>

      {/* White Fade Overlay */}
      <motion.div 
        className="fixed inset-0 bg-white pointer-events-none"
        style={{ opacity: fadeToWhite, zIndex: 100 }}
      />
    </>
  )
}
