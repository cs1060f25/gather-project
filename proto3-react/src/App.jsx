import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      {/* Warning Banner */}
      <div className="max-w-4xl mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm font-medium">
          ⚠️ This is a <strong>static mockup</strong> - No interactivity, no animations, all hardcoded data
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Gatherly</h1>
          <p className="text-gray-600">Proto3: Static React Mockup</p>
        </div>

        {/* iMessage-style Chat Mockup */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">← Messages</div>
              <div className="text-center">
                <p className="font-semibold">Gatherly</p>
                <p className="text-xs text-gray-500">Smart Scheduling</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600"></div>
            </div>
          </div>

          {/* Static Messages */}
          <div className="space-y-4">
            {/* Gatherly Message */}
            <div className="flex items-end space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex-shrink-0"></div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm">Hi Ikenna! Someone wants to meet with you for lunch this week.</p>
              </div>
            </div>

            {/* Location Card (Static) */}
            <div className="ml-10">
              <div className="bg-gray-50 rounded-2xl p-4 max-w-xs border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span>📍</span>
                  <p className="font-medium text-sm">Suggested Location</p>
                </div>
                <p className="text-sm">Joe's Pizza in Harvard Square</p>
                <p className="text-xs text-gray-500 mt-1">Great for lunch meetings • 4.5⭐</p>
              </div>
            </div>

            {/* User Response */}
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 max-w-xs">
                <p className="text-sm">Sounds good! When works?</p>
              </div>
            </div>

            {/* Time Options (Static) */}
            <div className="ml-10">
              <p className="text-xs text-gray-500 mb-3">Available Times</p>
              <div className="space-y-2 max-w-xs">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <div>
                      <p className="font-medium text-sm">Tue 12:30 PM</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>📅</span>
                      <div>
                        <p className="font-medium text-sm">Thu 1:00 PM</p>
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
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <div>
                      <p className="font-medium text-sm">Fri 12:30 PM</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Mockup (Static) */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="font-semibold text-lg mb-4">Calendar View</h2>
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`text-center py-2 rounded-lg ${
                  day === 14
                    ? 'bg-blue-500 text-white font-bold'
                    : day % 7 === 0
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2">
              <span>✨</span>
              <div>
                <p className="font-medium text-sm">Lunch with John</p>
                <p className="text-xs text-gray-600">Thu, Mar 14 • 1:00 PM • Joe's Pizza</p>
              </div>
            </div>
          </div>
        </div>

        {/* Limitations Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-3">❌ What's Missing in This Static Mockup?</h3>
          <ul className="space-y-2 text-sm text-red-800">
            <li>• <strong>No interactivity</strong> - Can't click anything, it's just screenshots in code</li>
            <li>• <strong>No animations</strong> - Messages don't type, calendars don't animate</li>
            <li>• <strong>No real data</strong> - Everything is hardcoded, no actual logic</li>
            <li>• <strong>No state</strong> - Can't change selections or see updates</li>
            <li>• <strong>Lifeless</strong> - Looks accurate but feels empty</li>
            <li>• <strong>Can't demonstrate flow</strong> - Users can't experience the actual workflow</li>
          </ul>
          <p className="mt-4 text-sm text-red-900 font-medium">
            This helped define the visual design but proved that <strong>visuals alone don't express intent</strong> - 
            we need motion, interaction, and real intelligence.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App

