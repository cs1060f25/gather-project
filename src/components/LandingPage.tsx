import React from 'react';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

const LandingPage: React.FC = () => {
  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth flow
    console.log('Initiating Google Sign In...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2 bg-indigo-600 p-10 flex flex-col justify-center text-white">
              <h1 className="text-4xl font-bold mb-4">Schedule Smarter</h1>
              <p className="text-indigo-100 text-lg mb-8">
                Connect your Google Calendar to find the perfect meeting times and streamline your scheduling process.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <p>Sign in with Google</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <p>Grant calendar access</p>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <p>Start scheduling effortlessly</p>
                </div>
              </div>
            </div>
            <div className="p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Get Started</h2>
              <p className="text-gray-600 mb-8">Sign in with your Google account to connect your calendar</p>
              
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <FcGoogle className="w-6 h-6 mr-3" />
                <span>Continue with Google</span>
              </button>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>We'll only access your calendar to help you schedule meetings.</p>
                <p className="mt-1">Your data is private and secure.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;