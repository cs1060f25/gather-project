import { motion, MotionValue, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Props {
  progress: MotionValue<number>
}

interface CalendarEvent {
  id: string
  title: string
  time: string
  duration: string
  color: string
}

export default function SceneIntelligence({ progress }: Props) {
  const [isScanning, setIsScanning] = useState(false)
  const [alignmentFound, setAlignmentFound] = useState(false)

  // Scene animations
  const opacity = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9])
  
  // Orb animations
  const orbScale = useTransform(progress, [0.2, 0.5, 0.7], [0, 1, 1.2])
  const orbOpacity = useTransform(progress, [0.2, 0.4, 0.7, 0.9], [0, 0.6, 0.8, 0.3])
  const orbRotation = useTransform(progress, [0, 1], [0, 360])
  
  // Calendar animations
  const calendar1X = useTransform(progress, [0.3, 0.5], [-100, 0])
  const calendar2X = useTransform(progress, [0.3, 0.5], [100, 0])
  const calendarOpacity = useTransform(progress, [0.3, 0.5], [0, 1])

  // Host calendar events
  const hostEvents: CalendarEvent[] = [
    { id: '1', title: 'Team Standup', time: '9:00 AM', duration: '30m', color: 'bg-blue-100 border-blue-300' },
    { id: '2', title: 'Client Call', time: '12:30 PM', duration: '1h', color: 'bg-purple-100 border-purple-300' },
    { id: '3', title: 'Design Review', time: '3:00 PM', duration: '45m', color: 'bg-green-100 border-green-300' },
  ]

  // Guest calendar events
  const guestEvents: CalendarEvent[] = [
    { id: '4', title: 'Morning Workout', time: '7:00 AM', duration: '1h', color: 'bg-orange-100 border-orange-300' },
    { id: '5', title: 'Lunch Meeting', time: '12:00 PM', duration: '1.5h', color: 'bg-red-100 border-red-300' },
    { id: '6', title: 'Project Work', time: '4:00 PM', duration: '2h', color: 'bg-indigo-100 border-indigo-300' },
  ]

  useEffect(() => {
    const unsubscribe = progress.on('change', (latest) => {
      if (latest > 0.4 && latest < 0.6) {
        setIsScanning(true)
      } else {
        setIsScanning(false)
      }
      
      if (latest > 0.65) {
        setAlignmentFound(true)
      }
    })
    return unsubscribe
  }, [progress])

  return (
    <motion.section 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, scale }}
    >
      <div className="relative w-full max-w-6xl px-8">
        {/* Central Intelligence Orb */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ scale: orbScale, opacity: orbOpacity }}
        >
          <motion.div 
            className="relative w-64 h-64"
            style={{ rotate: orbRotation }}
          >
            {/* Outer ring */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-system-blue/20"
              animate={isScanning ? { 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Middle ring */}
            <motion.div 
              className="absolute inset-4 rounded-full border border-system-blue/30"
              animate={isScanning ? { 
                scale: [1, 1.05, 1],
                opacity: [0.6, 1, 0.6]
              } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            
            {/* Core */}
            <motion.div 
              className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-xl"
              animate={isScanning ? {
                boxShadow: [
                  '0 0 20px rgba(0, 122, 255, 0.3)',
                  '0 0 40px rgba(0, 122, 255, 0.5)',
                  '0 0 20px rgba(0, 122, 255, 0.3)'
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Pulse effect */}
              <motion.div 
                className="absolute inset-0 rounded-full bg-system-blue/10"
                animate={isScanning ? { scale: [0, 1], opacity: [1, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>

            {/* Scanning beams */}
            {isScanning && (
              <>
                <motion.div 
                  className="absolute top-1/2 left-1/2 w-0.5 h-32 bg-gradient-to-b from-transparent via-system-blue/50 to-transparent -translate-x-1/2 -translate-y-1/2 origin-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute top-1/2 left-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent -translate-x-1/2 -translate-y-1/2 origin-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
              </>
            )}
          </motion.div>

          {/* Status Text */}
          <motion.div 
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: isScanning ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-medium text-gray-600">
              {alignmentFound ? '✓ Optimal time found' : 'Analyzing schedules...'}
            </p>
          </motion.div>
        </motion.div>

        {/* Calendar Overlays */}
        <div className="flex justify-between items-center">
          {/* Host Calendar */}
          <motion.div 
            className="glass-panel p-6 w-[380px]"
            style={{ x: calendar1X, opacity: calendarOpacity }}
          >
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                  J
                </div>
                <div>
                  <p className="font-semibold text-gray-900">John's Calendar</p>
                  <p className="text-xs text-gray-500">Thursday, March 14</p>
                </div>
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              {hostEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  className={`p-3 rounded-lg border ${event.color} ${
                    isScanning ? 'animate-pulse' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.time} • {event.duration}</p>
                    </div>
                    {isScanning && (
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Available slot highlight */}
              {alignmentFound && (
                <motion.div
                  className="p-3 rounded-lg border-2 border-system-blue bg-blue-50/50"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-system-blue">Available</p>
                      <p className="text-xs text-gray-600 mt-0.5">2:30 PM • 1h</p>
                    </div>
                    <motion.div 
                      className="w-5 h-5 rounded-full bg-system-blue flex items-center justify-center"
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Guest Calendar */}
          <motion.div 
            className="glass-panel p-6 w-[380px]"
            style={{ x: calendar2X, opacity: calendarOpacity }}
          >
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold">
                  I
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Ikenna's Calendar</p>
                  <p className="text-xs text-gray-500">Thursday, March 14</p>
                </div>
              </div>
            </div>

            {/* Time slots */}
            <div className="space-y-2">
              {guestEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  className={`p-3 rounded-lg border ${event.color} ${
                    isScanning ? 'animate-pulse' : ''
                  }`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{event.time} • {event.duration}</p>
                    </div>
                    {isScanning && (
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-gray-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Available slot highlight */}
              {alignmentFound && (
                <motion.div
                  className="p-3 rounded-lg border-2 border-system-blue bg-blue-50/50"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-system-blue">Available</p>
                      <p className="text-xs text-gray-600 mt-0.5">2:30 PM • 1h</p>
                    </div>
                    <motion.div 
                      className="w-5 h-5 rounded-full bg-system-blue flex items-center justify-center"
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Connection Lines */}
        {alignmentFound && (
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            <motion.line
              x1="380"
              y1="50%"
              x2="50%"
              y2="50%"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
            <motion.line
              x1="50%"
              y1="50%"
              x2="620"
              y2="50%"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut', delay: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0, 122, 255, 0.5)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.5)" />
                <stop offset="100%" stopColor="rgba(0, 122, 255, 0.5)" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
    </motion.section>
  )
}
