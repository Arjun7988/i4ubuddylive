import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', type, ...props }, ref) => {
    const isDateInput = type === 'date' || type === 'datetime-local';

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full px-4 py-2 bg-surface border border-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            error ? 'border-red-500' : ''
          } ${isDateInput ? 'cursor-pointer date-input-white-icon' : ''} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
