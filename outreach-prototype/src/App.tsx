import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { HomeIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Dashboard from './pages/Dashboard'
import ScheduleNew from './pages/ScheduleNew'
import Responses from './pages/Responses'

function App() {
  return (
    <Router>
      <header className="topbar">
        <div className="brand">Gatherly</div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <HomeIcon width={18} height={18} /> Dashboard
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <ClockIcon width={18} height={18} /> Schedule New
          </NavLink>
          <NavLink to="/responses" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <UserGroupIcon width={18} height={18} /> Responses
          </NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<ScheduleNew />} />
          <Route path="/responses" element={<Responses />} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
