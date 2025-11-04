'use client';

import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Calendar className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-semibold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Gatherly
              </span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center space-x-8"
            >
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-8"
            >
              <Sparkles className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-700">AI-Powered Scheduling</span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Schedule smarter,
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                not harder
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Gatherly is an intelligent scheduling agent that automates planning social hangouts — 
              finding mutual availability, coordinating details, and seamlessly booking time in everyone&apos;s calendars.
            </p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <Link href="/app">
                <button className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95">
                  <span className="relative z-10 flex items-center">
                    Start Scheduling
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Visual Elements */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-20 relative"
          >
            {/* Floating Cards */}
            <div className="relative h-96 max-w-5xl mx-auto">
              {/* Card 1 */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 2, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute left-0 top-20 w-72 p-6 bg-white rounded-2xl shadow-xl border border-gray-100"
              >
                <Users className="h-10 w-10 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Group Coordination</h3>
                <p className="text-sm text-gray-600">Automatically find the perfect time that works for everyone</p>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, -2, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute right-0 top-10 w-72 p-6 bg-white rounded-2xl shadow-xl border border-gray-100"
              >
                <Clock className="h-10 w-10 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
                <p className="text-sm text-gray-600">AI learns your preferences and suggests optimal meeting times</p>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 1, 0]
                }}
                transition={{ 
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
                className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-72 p-6 bg-white rounded-2xl shadow-xl border border-gray-100"
              >
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Seamless Integration</h3>
                <p className="text-sm text-gray-600">Works with Google Calendar and sends confirmations automatically</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Why Choose Gatherly?</h2>
            <p className="text-xl text-gray-600">Say goodbye to endless back-and-forth messages</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered",
                description: "Intelligent scheduling that learns from your patterns",
                icon: Sparkles
              },
              {
                title: "Time-Saving",
                description: "Reduce scheduling time by 90% with automation",
                icon: Clock
              },
              {
                title: "Group-Friendly",
                description: "Perfect for team meetings and social gatherings",
                icon: Users
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <feature.icon className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">© 2024 Gatherly. Making scheduling effortless.</p>
        </div>
      </footer>
    </div>
  );
}