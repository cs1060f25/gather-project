/**
 * CareerGoalChatBar.tsx
 * 
 * Purpose: Sandbox component for AI-powered career scheduling interactions.
 * This component captures user career goals (e.g., "Find me a summer internship 
 * in investment banking for 2026") and displays AI-generated professional matches
 * with a beautiful liquid glass UI inspired by Apple's design language.
 * 
 * Features:
 * - Liquid glass chat bar with smooth animations
 * - Typing indicator for AI responses
 * - Real-time goal parsing and professional matching
 * - Chat bubble UI for conversation flow
 * 
 * Integration Points:
 * - POST /api/goal-matching - Sends career goals and receives professional matches
 * - Claude 4.5 Sonnet integration (placeholder ready)
 */

import { useState, FormEvent, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  content: string
  type: 'user' | 'assistant'
  timestamp: Date
}

interface ProfessionalMatch {
  name: string
  title: string
  whyHelpful: string
}

export default function CareerGoalChatBar() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isThinking) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsThinking(true)

    try {
      // Parse goal components from user input
      // TODO: Integrate Claude 4.5 Sonnet for advanced NLP parsing
      const goalData = parseGoalFromText(inputValue)

      // Send POST request to backend API (using mock server for demo)
      const response = await fetch('http://localhost:3001/api/goal-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }

      const data = await response.json()
      
      // Format assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: formatMatchesResponse(data.matches),
        type: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error fetching matches:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "I'm having trouble finding matches right now. Please try again.",
        type: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  // Helper function to parse goal from user text
  // TODO: Replace with Claude API call for production
  const parseGoalFromText = (text: string) => {
    // Simple keyword extraction - replace with LLM in production
    const lowerText = text.toLowerCase()
    
    let careerField = 'general'
    if (lowerText.includes('investment banking') || lowerText.includes('finance')) {
      careerField = 'investment-banking'
    } else if (lowerText.includes('tech') || lowerText.includes('software')) {
      careerField = 'tech'
    } else if (lowerText.includes('consulting')) {
      careerField = 'consulting'
    }

    let location = ''
    if (lowerText.includes('nyc') || lowerText.includes('new york')) {
      location = 'New York'
    } else if (lowerText.includes('sf') || lowerText.includes('san francisco')) {
      location = 'San Francisco'
    } else if (lowerText.includes('boston')) {
      location = 'Boston'
    }

    return {
      goal: text,
      location,
      careerField
    }
  }

  // Helper function to format matches into readable text
  const formatMatchesResponse = (matches: ProfessionalMatch[]) => {
    if (!matches || matches.length === 0) {
      return "I couldn't find any matches right now. Try refining your goal!"
    }

    let response = "Great! I found some professionals who can help:\n\n"
    matches.forEach((match, idx) => {
      response += `${idx + 1}. **${match.name}**\n`
      response += `   ${match.title}\n`
      response += `   💡 ${match.whyHelpful}\n\n`
    })
    return response
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <motion.div 
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-sf-display font-semibold text-gray-900 mb-3">
            Career Goal Assistant
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Tell me your career goals, and I'll connect you with the right people
          </p>
        </motion.div>

        {/* Chat Messages Container */}
        <motion.div 
          className="glass-panel p-6 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500 font-light">
                  Start by telling me about your career goals
                </p>
                <p className="text-sm text-gray-400">
                  Example: "Find me a summer internship in investment banking for 2026"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`
                        message-bubble
                        ${message.type === 'user' ? 'message-bubble-sent' : 'message-bubble-received'}
                      `}
                      style={{ maxWidth: '80%' }}
                    >
                      <div className="whitespace-pre-wrap text-sm font-light">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="message-bubble message-bubble-received">
                    <div className="flex space-x-2 items-center">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* Chat Input Bar - Liquid Glass Effect */}
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div 
            className={`
              glass-panel p-4 transition-all duration-300
              ${isFocused ? 'ring-2 ring-system-blue/50 shadow-xl' : ''}
            `}
            animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
          >
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Describe your career goal..."
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-base font-light"
                disabled={isThinking}
              />
              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isThinking}
                className={`
                  px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${inputValue.trim() && !isThinking
                    ? 'bg-system-blue text-white hover:bg-blue-600 active:scale-95 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
                whileHover={inputValue.trim() && !isThinking ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() && !isThinking ? { scale: 0.95 } : {}}
              >
                {isThinking ? (
                  <span className="flex items-center space-x-2">
                    <span>Thinking</span>
                    <span className="animate-pulse">...</span>
                  </span>
                ) : (
                  'Send'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.form>

        {/* Tips Section */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-gray-500 font-light">
            💡 Tip: Be specific about industry, location, and timeline for best results
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

