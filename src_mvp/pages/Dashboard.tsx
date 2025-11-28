import React from 'react'
import Card from '../components/common/Card'

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Your Meetings</h1>
      
      {/* Placeholder for dashboard content */}
      <Card>
        <p className="text-[var(--color-text-secondary)]">
          Your scheduled meetings will appear here.
        </p>
      </Card>
    </div>
  )
}
