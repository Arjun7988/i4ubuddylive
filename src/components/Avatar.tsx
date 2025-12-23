import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Avatar({ src, alt = 'Profile', size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-magenta-500 p-0.5 flex-shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-dark-100 flex items-center justify-center">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const icon = document.createElement('div');
                icon.className = 'flex items-center justify-center w-full h-full';
                parent.appendChild(icon);
              }
            }}
          />
        ) : (
          <User className={`${iconSizes[size]} text-gray-500`} />
        )}
      </div>
    </div>
  );
}
