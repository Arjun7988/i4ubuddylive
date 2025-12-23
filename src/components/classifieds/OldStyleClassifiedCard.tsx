import { Link } from 'react-router-dom';
import type { Classified } from '../../types/classifieds';

interface OldStyleClassifiedCardProps {
  classified: Classified;
  variant?: 'multicolor' | 'single';
  index?: number;
}

const multicolors = [
  'from-blue-500 via-blue-600 to-cyan-600',
  'from-emerald-500 via-green-600 to-teal-600',
  'from-violet-500 via-purple-600 to-pink-600',
  'from-orange-500 via-amber-600 to-yellow-600',
  'from-rose-500 via-pink-600 to-fuchsia-600',
  'from-cyan-500 via-teal-600 to-blue-600',
  'from-amber-500 via-orange-600 to-red-600',
  'from-indigo-500 via-blue-600 to-purple-600',
];

export function OldStyleClassifiedCard({ classified, variant = 'single', index = 0 }: OldStyleClassifiedCardProps) {
  const formatPrice = () => {
    if (!classified.price) return null;
    return `${classified.currency} ${classified.price.toLocaleString()}`;
  };

  const bgColor = variant === 'multicolor'
    ? `bg-gradient-to-br ${multicolors[index % multicolors.length]}`
    : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900';

  const price = formatPrice();

  return (
    <Link to={`/classifieds/${classified.id}`}>
      <div className={`${bgColor} p-4 rounded-lg border border-white/20 hover:border-white/40 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] transform`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-white text-base line-clamp-1 flex-1 drop-shadow-md">
            {classified.title}
          </h3>
          {price && (
            <span className="text-white text-sm font-extrabold whitespace-nowrap flex-shrink-0 bg-black/20 px-2 py-1 rounded">
              {price}
            </span>
          )}
        </div>

        <p className="text-white/90 text-sm line-clamp-2 drop-shadow">
          {classified.description}
        </p>
      </div>
    </Link>
  );
}
