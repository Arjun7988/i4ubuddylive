import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export function TimeSelect({ value, onChange, label, error, required }: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && value && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-value="${value}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, value]);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 bg-surface border rounded-lg text-left flex items-center justify-between transition-all ${
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-border focus:ring-2 focus:ring-primary-500'
        } ${value ? 'text-gray-200' : 'text-gray-500'} focus:outline-none`}
      >
        <span>{value ? formatDisplayTime(value) : 'Select time'}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {timeOptions.map((time) => (
            <button
              key={time}
              type="button"
              data-value={time}
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-dark-200 transition-colors ${
                value === time ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300'
              }`}
            >
              {formatDisplayTime(time)}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  );
}
