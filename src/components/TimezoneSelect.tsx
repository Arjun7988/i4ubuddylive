import { Globe } from 'lucide-react';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: string;
}

const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time - America/New York', offset: 'EST/EDT' },
  { value: 'America/Chicago', label: 'Central Time - America/Chicago', offset: 'CST/CDT' },
  { value: 'America/Denver', label: 'Mountain Time - America/Denver', offset: 'MST/MDT' },
  { value: 'America/Phoenix', label: 'Mountain Time (no DST) - America/Phoenix', offset: 'MST' },
  { value: 'America/Los_Angeles', label: 'Pacific Time - America/Los Angeles', offset: 'PST/PDT' },
  { value: 'America/Anchorage', label: 'Alaska Time - America/Anchorage', offset: 'AKST/AKDT' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time - Pacific/Honolulu', offset: 'HST' },
  { value: 'Europe/London', label: 'London - Europe/London', offset: 'GMT/BST' },
  { value: 'Europe/Paris', label: 'Paris - Europe/Paris', offset: 'CET/CEST' },
  { value: 'Asia/Tokyo', label: 'Tokyo - Asia/Tokyo', offset: 'JST' },
  { value: 'Asia/Dubai', label: 'Dubai - Asia/Dubai', offset: 'GST' },
  { value: 'Asia/Kolkata', label: 'India - Asia/Kolkata', offset: 'IST' },
  { value: 'Australia/Sydney', label: 'Sydney - Australia/Sydney', offset: 'AEST/AEDT' },
];

export function TimezoneSelect({ value, onChange, error }: TimezoneSelectProps) {
  const getCurrentTime = (timezone: string) => {
    try {
      const now = new Date();
      return now.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const selectedTimezone = COMMON_TIMEZONES.find(tz => tz.value === value);
  const currentTime = value ? getCurrentTime(value) : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Timezone <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
        >
          <option value="">Select timezone...</option>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {currentTime && (
        <p className="mt-1 text-xs text-gray-400">
          Current time: {currentTime}
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
