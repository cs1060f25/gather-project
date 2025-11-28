import React from 'react';
import Button from '../common/Button';

interface CalendarConnectProps {
  onConnect: () => Promise<void>;
  isConnecting?: boolean;
}

export const CalendarConnect: React.FC<CalendarConnectProps> = ({
  onConnect,
  isConnecting
}) => {
  return (
    <div className="space-y-6">
      {/* Calendar permissions explanation */}
      <div className="space-y-4 bg-[var(--color-background)] rounded-lg p-4">
        <h3 className="font-medium">Gatherly will be able to:</h3>
        <ul className="space-y-3">
          {[
            {
              icon: '📅',
              title: 'View your calendar',
              description: 'To check your availability for scheduling'
            },
            {
              icon: '✏️',
              title: 'Create events',
              description: 'To add confirmed meetings to your calendar'
            },
            {
              icon: '✉️',
              title: 'Send invitations',
              description: 'To invite attendees to confirmed meetings'
            }
          ].map(({ icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={onConnect}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
      </Button>

      <p className="text-xs text-center text-[var(--color-text-secondary)]">
        You can revoke access at any time through your Google Account settings
      </p>
    </div>
  );
};

export default CalendarConnect;
