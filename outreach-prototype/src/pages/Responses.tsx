type Row = {
  name: string
  channel: 'SMS' | 'Email'
  choice: 'A' | 'B' | 'C' | 'Declined' | 'Pending' | 'Suggest'
  message?: string
  updated: string
}

const rows: Row[] = [
  { name: 'Alex Johnson', channel: 'SMS', choice: 'A', updated: '2m ago' },
  { name: 'Taylor Smith', channel: 'Email', choice: 'B', updated: '15m ago' },
  { name: 'Jordan Lee', channel: 'SMS', choice: 'Suggest', message: 'Can we do Friday at 3pm?', updated: '1h ago' },
  { name: 'Casey Kim', channel: 'Email', choice: 'Pending', updated: '2h ago' },
]

function badgeClass(choice: Row['choice']) {
  switch (choice) {
    case 'A':
    case 'B':
    case 'C':
      return 'badge green'
    case 'Declined':
      return 'badge gray'
    case 'Pending':
      return 'badge yellow'
    case 'Suggest':
      return 'badge blue'
  }
}

export default function Responses() {
  return (
    <div className="page">
      <div className="section">
        <h2>Responses</h2>
        <p className="kicker">Monitor who accepted, declined, or suggested an alternative time.</p>
      </div>

      <div className="panel">
        <div className="panel-header">Latest Replies</div>
        <div style={{ padding: 16 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Choice</th>
                <th>Message</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.channel}</td>
                  <td><span className={badgeClass(r.choice)}>{r.choice}</span></td>
                  <td>{r.message ?? '-'}</td>
                  <td>{r.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
