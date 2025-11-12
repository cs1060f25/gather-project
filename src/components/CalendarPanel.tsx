export default function CalendarPanel() {
  const upcomingEvents = [
    { id: 1, title: 'Team Meeting', time: '2:00 PM', date: 'Today' },
    { id: 2, title: 'Coffee with Sarah', time: '4:30 PM', date: 'Tomorrow' },
    { id: 3, title: 'Project Review', time: '10:00 AM', date: 'Friday' },
  ];

  return (
    <div className="hidden lg:flex lg:w-80 xl:w-96 bg-white border-l border-gray-200 flex-col">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
        <p className="text-sm text-gray-500 mt-1">Your schedule at a glance</p>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Mini Calendar */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">November 2025</h4>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-white/50 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 hover:bg-white/50 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-xs font-medium text-gray-600 py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 2; // Start from day 1 on Wednesday
              const isToday = day === 4;
              const hasEvent = [4, 5, 8].includes(day);
              
              return (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                    day < 1 || day > 30
                      ? 'text-gray-300'
                      : isToday
                      ? 'bg-indigo-600 text-white font-semibold'
                      : hasEvent
                      ? 'bg-white text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {day > 0 && day <= 30 ? day : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Timeline</h4>
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{event.title}</h5>
                  <p className="text-sm text-gray-500 mt-1">{event.time}</p>
                  <p className="text-xs text-gray-400 mt-1">{event.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder for future events */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500 text-center">
            More events will appear here as you schedule them
          </p>
        </div>
      </div>
    </div>
  );
}

