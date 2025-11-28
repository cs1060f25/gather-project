import React from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

interface PreferencesFormProps {
  onSubmit: (data: {
    workingHoursStart: string;
    workingHoursEnd: string;
    timezone: string;
    defaultDuration: number;
  }) => void;
  isLoading?: boolean;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = React.useState({
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultDuration: 30
  });

  // Get list of timezones
  const timezones = React.useMemo(() => {
    return Intl.supportedValuesOf('timeZone');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium">Working Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            value={formData.workingHoursStart}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              workingHoursStart: e.target.value 
            }))}
          />
          <Input
            label="End Time"
            type="time"
            value={formData.workingHoursEnd}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              workingHoursEnd: e.target.value 
            }))}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Time Zone</h3>
        <select
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20"
          value={formData.timezone}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            timezone: e.target.value 
          }))}
        >
          {timezones.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Default Meeting Duration</h3>
        <select
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20"
          value={formData.defaultDuration}
          onChange={e => setFormData(prev => ({ 
            ...prev, 
            defaultDuration: parseInt(e.target.value) 
          }))}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>1 hour</option>
        </select>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Complete Setup'}
      </Button>
    </form>
  );
};

export default PreferencesForm;
