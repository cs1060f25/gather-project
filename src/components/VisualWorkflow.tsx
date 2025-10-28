import { motion } from 'framer-motion'

export default function VisualWorkflow() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8">
      {/* Back to Demo Button */}
      <motion.button
        className="fixed top-6 left-6 bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-300 z-50 flex items-center space-x-2"
        onClick={() => window.location.href = '/'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Back to Demo</span>
      </motion.button>

      <div className="max-w-7xl w-full">
        {/* 4 States Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* State 1: Chat Input */}
          <motion.div
            className="glass-panel rounded-3xl p-6 h-[400px] flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Chat Input Interface */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div className="flex-1">
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-200/50">
                    <p className="text-gray-900 text-sm">I want to meet with Ikenna this week for lunch. Find me a time.</p>
                    <div className="w-0.5 h-4 bg-blue-500 mt-1 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* State 2: iMessage Conversation */}
          <motion.div
            className="glass-panel rounded-3xl p-6 h-[400px] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* iMessage Header */}
            <div className="flex items-center justify-center mb-4 pb-3 border-b border-gray-200/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <span className="font-semibold text-gray-900 text-sm">Gatherly</span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-3 py-2 max-w-[200px]">
                  <p className="text-sm text-gray-900">Hi Ikenna! Someone wants to meet with you for lunch this week.</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-3 py-2 max-w-[200px]">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">📍</span>
                    <p className="text-sm font-medium">Joe's Pizza</p>
                  </div>
                  <p className="text-xs text-gray-600">Harvard Square</p>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl px-3 py-2 max-w-[200px]">
                  <p className="text-sm">Sounds good! When works?</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* State 3: Time Selection */}
          <motion.div
            className="glass-panel rounded-3xl p-6 h-[400px] flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="space-y-3">
              <p className="text-xs text-gray-500 text-center mb-4">Available Times</p>
              
              {/* Time Options */}
              <div className="space-y-2">
                <div className="bg-white/70 border border-gray-200/50 rounded-xl p-3 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="font-medium text-sm">Tue 12:30 PM</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="font-medium text-sm text-blue-900">Thu 1:00 PM</p>
                        <p className="text-xs text-gray-600">Selected</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 border border-gray-200/50 rounded-xl p-3 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="font-medium text-sm">Fri 12:30 PM</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* State 4: Calendar Confirmation */}
          <motion.div
            className="glass-panel rounded-3xl p-6 h-[400px] flex flex-col justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Calendar Widget */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200/50">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">14</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Thursday</p>
                    <p className="font-semibold text-sm">March</p>
                  </div>
                </div>
                <span className="text-xl">📅</span>
              </div>

              {/* Event Details */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <div className="w-1 h-12 bg-blue-500 rounded-full"></div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">Lunch with Ikenna</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-600">1:00 PM - 2:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-gray-600">Joe's Pizza</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="flex items-center justify-center">
                <div className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Added to Calendar</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Simple flow indicators */}
        <div className="hidden md:flex justify-center items-center mt-6 space-x-12">
          <div className="w-6 h-0.5 bg-gray-300 rounded-full" />
          <div className="w-6 h-0.5 bg-gray-300 rounded-full" />
          <div className="w-6 h-0.5 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  )
}
