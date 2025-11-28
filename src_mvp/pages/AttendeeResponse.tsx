import React from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/common/Card'
import Button from '../components/common/Button'

export default function AttendeeResponse() {
  const { id } = useParams()

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h1 className="text-2xl font-semibold mb-6">Select Available Time</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Choose a time that works best for you.
        </p>

        {/* Placeholder for time slot selection */}
        <div className="space-y-4 mb-8">
          {['9:00 AM', '2:00 PM', '4:30 PM'].map((time, i) => (
            <Button
              key={i}
              variant="secondary"
              fullWidth
              onClick={() => {
                // TODO: Implement slot selection
                console.log(`Selected ${time}`)
              }}
            >
              {time}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
