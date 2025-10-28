import { motion, MotionValue, useTransform } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Props {
  progress: MotionValue<number>
}

interface TimeOption {
  id: string
  day: string
  time: string
  available: boolean
}

export default function SceneConversation({ progress }: Props) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)

  // Scene animations
  const opacity = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95])
  
  // Individual message animations
  const message1Opacity = useTransform(progress, [0.1, 0.25], [0, 1])
  const message1Y = useTransform(progress, [0.1, 0.25], [20, 0])
  
  const message2Opacity = useTransform(progress, [0.2, 0.35], [0, 1])
  const message2Y = useTransform(progress, [0.2, 0.35], [20, 0])
  
  const cardOpacity = useTransform(progress, [0.3, 0.45], [0, 1])
  const cardScale = useTransform(progress, [0.3, 0.45], [0.9, 1])
  
  const alertOpacity = useTransform(progress, [0.5, 0.6], [0, 1])
  const carouselX = useTransform(progress, [0.6, 0.7], [100, 0])

  const timeOptions: TimeOption[] = [
    { id: '1', day: 'Tue', time: '12:30 PM', available: true },
    { id: '2', day: 'Wed', time: '1:00 PM', available: false },
    { id: '3', day: 'Thu', time: '12:00 PM', available: true },
  ]

  const alternativeOptions: TimeOption[] = [
    { id: '4', day: 'Wed', time: '1:30 PM', available: true },
    { id: '5', day: 'Thu', time: '1:00 PM', available: true },
    { id: '6', day: 'Fri', time: '12:30 PM', available: true },
  ]

  useEffect(() => {
    const unsubscribe = progress.on('change', (latest) => {
      if (latest > 0.45 && latest < 0.55 && !selectedTime) {
        setSelectedTime('2')
        setShowAlert(true)
      }
      if (latest > 0.6) {
        setShowCarousel(true)
      }
    })
    return unsubscribe
  }, [progress, selectedTime])

  return (
    <motion.section 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity, scale }}
    >
      <div className="relative w-full max-w-3xl px-8">
        {/* iMessage Container */}
        <div className="glass-panel p-8 max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/30">
            <div className="flex items-center space-x-3">
              <motion.button 
                className="text-system-blue font-sf-text"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Messages
              </motion.button>
            </div>
            <div className="text-center">
              <p className="font-sf-display font-semibold text-gray-900">Gatherly</p>
              <p className="text-xs text-system-gray-2 mt-0.5">Smart Scheduling</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                I
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {/* Gatherly's Initial Message */}
            <motion.div 
              className="flex justify-start"
              style={{ opacity: message1Opacity, y: message1Y }}
            >
              <div className="flex items-end space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  G
                </div>
                <div className="space-y-2">
                  <div className="message-bubble message-bubble-received">
                    <p className="text-[17px]">Hi Ikenna! Someone wants to meet with you for lunch this week. Here are some available times:</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location Suggestion */}
            <motion.div 
              className="flex justify-start ml-10"
              style={{ opacity: message2Opacity, y: message2Y }}
            >
              <div className="message-bubble message-bubble-received max-w-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📍</span>
                  <p className="text-[17px] font-medium">Suggested Location</p>
                </div>
                <p className="text-[17px]">Joe's Pizza in Harvard Square</p>
                <p className="text-sm text-gray-600 mt-1">Great for lunch meetings • 4.5⭐</p>
              </div>
            </motion.div>

            {/* Time Card */}
            <motion.div 
              className="ml-10"
              style={{ opacity: cardOpacity, scale: cardScale }}
            >
              <motion.div 
                className="glass-panel-dark p-4 max-w-sm"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-sm font-medium text-gray-600 mb-3">Available Times</p>
                <div className="space-y-2">
                  {timeOptions.map((option, idx) => (
                    <motion.button
                      key={option.id}
                      className={`time-option w-full text-left ${
                        selectedTime === option.id 
                          ? 'bg-system-blue/10 border-system-blue' 
                          : ''
                      } ${!option.available ? 'opacity-50' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={option.available ? { scale: 1.02 } : {}}
                      whileTap={option.available ? { scale: 0.98 } : {}}
                      onClick={() => option.available && setSelectedTime(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📅</span>
                          <div>
                            <p className="font-medium text-gray-900">{option.day}</p>
                            <p className="text-sm text-gray-500">{option.time}</p>
                          </div>
                        </div>
                        {selectedTime === option.id && (
                          <motion.div 
                            className="w-5 h-5 rounded-full bg-system-blue flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Ikenna's Response */}
            {showAlert && (
              <motion.div 
                className="flex justify-end"
                style={{ opacity: alertOpacity }}
              >
                <motion.div 
                  className="message-bubble message-bubble-sent"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-[17px]">Wednesday 1 PM won't work - I have a class then. Any other times?</p>
                </motion.div>
              </motion.div>
            )}

            {/* Gatherly's Response */}
            {showCarousel && (
              <motion.div 
                className="flex justify-start mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    G
                  </div>
                  <div className="message-bubble message-bubble-received">
                    <p className="text-[17px]">No problem! Here are some other lunch times that work:</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Alternative Times Carousel */}
            {showCarousel && (
              <motion.div 
                className="ml-10 overflow-hidden"
                style={{ x: carouselX }}
              >
                <div className="flex space-x-3 pb-2">
                  {alternativeOptions.map((option, idx) => (
                    <motion.button
                      key={option.id}
                      className="flex-shrink-0 time-option min-w-[140px]"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">✅</span>
                        <div className="text-left">
                          <p className="font-medium text-sm">{option.day}</p>
                          <p className="text-xs text-gray-500">{option.time}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <motion.div 
          className="absolute -top-10 -right-10 w-32 h-32 gradient-orb blur-2xl opacity-30"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>
    </motion.section>
  )
}
