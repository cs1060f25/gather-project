import { motion } from 'framer-motion'

export default function WorkflowSummary() {
  const steps = [
    {
      id: 1,
      icon: "👤",
      title: "John",
      subtitle: "Wants lunch meeting",
      description: "Types request to Gatherly",
      color: "from-blue-400 to-blue-600"
    },
    {
      id: 2,
      icon: "🤖",
      title: "Gatherly",
      subtitle: "AI Scheduling Agent",
      description: "Analyzes calendars & suggests times",
      color: "from-purple-400 to-indigo-600"
    },
    {
      id: 3,
      icon: "👥",
      title: "Ikenna",
      subtitle: "Receives invitation",
      description: "Gets options via iMessage",
      color: "from-green-400 to-emerald-600"
    },
    {
      id: 4,
      icon: "📅",
      title: "Smart Sync",
      subtitle: "Calendar integration",
      description: "Meeting added automatically",
      color: "from-orange-400 to-red-500"
    }
  ]

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

      <div className="max-w-6xl w-full">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center space-x-3 mb-6"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">G</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Gatherly
            </h1>
          </motion.div>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
            AI-powered scheduling that coordinates lunch meetings through natural conversation
          </p>
        </motion.div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Connection Arrow */}
              {index < steps.length - 1 && (
                <motion.div 
                  className="hidden md:block absolute top-16 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 z-0"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full" />
                </motion.div>
              )}

              {/* Step Card */}
              <motion.div 
                className="glass-panel p-6 text-center relative z-10 hover:shadow-xl transition-all duration-300"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon */}
                <motion.div 
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-2xl">{step.icon}</span>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm font-medium text-gray-600 mb-3">{step.subtitle}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>

                {/* Step Number */}
                <motion.div 
                  className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.15 + 0.5 }}
                >
                  <span className="text-sm font-bold text-gray-600">{step.id}</span>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Key Features */}
        <motion.div 
          className="glass-panel p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Natural Language</p>
                <p className="text-sm text-gray-600">Simple conversation interface</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-lg">🧠</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Smart Analysis</p>
                <p className="text-sm text-gray-600">AI-powered calendar sync</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-lg">📍</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Location Suggestions</p>
                <p className="text-sm text-gray-600">Perfect meeting spots</p>
              </div>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <p className="text-gray-600 mb-4">Experience the full interactive demo</p>
            <motion.button 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/'}
            >
              <span>🚀</span>
              <span>View Live Demo</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <p className="text-gray-500 text-sm">
            Built with React, Framer Motion, and Tailwind CSS • Apple-grade animations and UX
          </p>
        </motion.div>
      </div>
    </div>
  )
}
