import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Gatherly
          </h1>
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Schedule hangouts with friends,
            <br />
            <span className="text-indigo-600">effortlessly</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gatherly is an intelligent scheduling agent that finds mutual availability, 
            coordinates details, and seamlessly books time in everyone's calendars.
          </p>

          {/* CTA Button */}
          <div className="pt-8">
            <button
              onClick={() => navigate('/app')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Scheduling
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-4">
          {['AI-Powered', 'Calendar Sync', 'Group Coordination', 'Smart Suggestions'].map((feature) => (
            <div 
              key={feature}
              className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm text-gray-700"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

