import { useMemo, useState } from 'react'

export default function ScheduleNew() {
  const [name, setName] = useState('Alex Johnson')
  const [contact, setContact] = useState('alex@example.com')
  const [title, setTitle] = useState('Intro call with Gatherly')
  const [duration, setDuration] = useState(30)
  const [sms, setSms] = useState(true)
  const [email, setEmail] = useState(true)
  const [optA, setOptA] = useState<string>('')
  const [optB, setOptB] = useState<string>('')
  const [optC, setOptC] = useState<string>('')
  const [deadlineHours, setDeadlineHours] = useState(12)
  const [message, setMessage] = useState('Hi there! Gatherly can help coordinate a time that works for you.')
  const [sent, setSent] = useState(false)

  const preview = useMemo(() => {
    const lines = [
      `Hey ${name.split(' ')[0]}, I’m Gatherly. I’m helping schedule: ${title} (${duration} min).`,
      'Here are a few times that could work:',
    ]
    const options: string[] = []
    if (optA) options.push(`A) ${new Date(optA).toLocaleString()}`)
    if (optB) options.push(`B) ${new Date(optB).toLocaleString()}`)
    if (optC) options.push(`C) ${new Date(optC).toLocaleString()}`)
    if (options.length) lines.push(options.join('\n'))
    lines.push('Reply with A, B, or C. If none work, reply D to suggest another time.')
    lines.push(`Please reply within ${deadlineHours}h so we can get this on the calendar.`)
    if (message) lines.push(`\nNote: ${message}`)
    return lines.join('\n')
  }, [name, title, duration, optA, optB, optC, deadlineHours, message])

  return (
    <div className="page">
      <div className="section">
        <h2>Schedule Outreach</h2>
        <p className="kicker">Create a new scheduling request with three options and a response window.</p>
      </div>

      <form className="form" onSubmit={(e) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 2500) }}>
        <div className="row">
          <div>
            <label className="label">Recipient Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="label">Contact (SMS or Email)</label>
            <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. (555) 123-4567 or user@email.com" />
            <div className="kicker" style={{ marginTop: 6 }}>Prototype only — no messages will be sent.</div>
          </div>
        </div>

        <div className="row">
          <div>
            <label className="label">Meeting Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <select className="select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[15, 30, 45, 60].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Proposed Times</label>
          <div className="row">
            <input className="input" type="datetime-local" value={optA} onChange={(e) => setOptA(e.target.value)} />
            <input className="input" type="datetime-local" value={optB} onChange={(e) => setOptB(e.target.value)} />
            <input className="input" type="datetime-local" value={optC} onChange={(e) => setOptC(e.target.value)} />
          </div>
          <div className="help">Provide up to three specific options. Recipients can also decline or suggest an alternative.</div>
        </div>

        <div className="row">
          <div>
            <label className="label">Delivery Channels</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} /> SMS (Twilio/Sendblue)</label>
              <label><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> Email (SendGrid)</label>
            </div>
          </div>
          <div>
            <label className="label">Response Deadline (hours)</label>
            <input className="input" type="number" min={1} max={72} value={deadlineHours} onChange={(e) => setDeadlineHours(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="label">Additional Note (optional)</label>
          <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div>
          <label className="label">Preview</label>
          <pre className="preview" style={{ whiteSpace: 'pre-wrap' }}>{preview}</pre>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => alert('This is a UI prototype. No messages will be sent.')}>Test Preview</button>
          <button type="submit" className="btn btn-primary">Send</button>
        </div>
        {sent && <div className="kicker" style={{ textAlign: 'right' }}>Preview sent (mock). No real messages were sent.</div>}
      </form>
    </div>
  )
}
