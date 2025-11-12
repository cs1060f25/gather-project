import ChatPanel from '../components/ChatPanel';
import UserPanel from '../components/UserPanel';
import CalendarPanel from '../components/CalendarPanel';
import MobileNav from '../components/MobileNav';

export default function Dashboard() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - User Info & Nav (Desktop only) */}
        <UserPanel />

        {/* Main Content Area - Chat */}
        <div className="flex-1 flex flex-col">
          <ChatPanel />
        </div>

        {/* Right Panel - Calendar/Timeline (Desktop only) */}
        <CalendarPanel />
      </div>
    </div>
  );
}

