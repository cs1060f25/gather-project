import type { SVGProps, ComponentType } from 'react'
import { ClockIcon, ChatBubbleLeftRightIcon, UsersIcon } from '@heroicons/react/24/outline'

type Stat = {
  name: string
  value: string
  change: string
  changeType: 'up' | 'down'
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const stats: Stat[] = [
  { name: 'Total Scheduled', value: '12', change: '+12%', changeType: 'up', icon: ClockIcon },
  { name: 'Responses Received', value: '8', change: '+5%', changeType: 'up', icon: ChatBubbleLeftRightIcon },
  { name: 'Active Conversations', value: '4', change: '-2%', changeType: 'down', icon: UsersIcon },
]

const recentActivity = [
  { id: 1, name: 'Alex Johnson', type: 'Scheduled', time: '2m ago', status: 'Scheduled for Nov 12, 2:30 PM' },
  { id: 2, name: 'Taylor Smith', type: 'Response', time: '15m ago', status: 'Confirmed: Nov 12, 2:30 PM' },
  { id: 3, name: 'Jordan Lee', type: 'Reminder', time: '1h ago', status: 'Reminder sent for Nov 11, 10:00 AM' },
  { id: 4, name: 'Casey Kim', type: 'New', time: '2h ago', status: 'New scheduling request' },
]

export default function Dashboard() {
  return (
    <div className="page">
      <div className="section">
        <h2>Dashboard</h2>
        <p className="kicker">Overview of your scheduling outreach activities</p>
      </div>

      <div className="grid grid-3">
        {stats.map((s) => (
          <div key={s.name} className="card">
            <div className="stat">
              <div className="stat-icon">
                <s.icon width={18} height={18} />
              </div>
              <div>
                <div className="stat-title">{s.name}</div>
                <div className="stat-value">{s.value}
                  <span className={`stat-change ${s.changeType === 'up' ? 'up' : 'down'}`}>{s.change}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">Recent Activity</div>
        <div className="panel-body">
          <ul className="list">
            {recentActivity.map((a) => (
              <li key={a.id} className="list-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div className="kicker">{a.status}</div>
                </div>
                <div className="kicker">{a.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
