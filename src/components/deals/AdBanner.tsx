import { ArrowRight } from 'lucide-react';
import { AdBanner as AdBannerType } from '../../types/deals';

interface AdBannerProps {
  banner: AdBannerType;
  onClick?: (target: string) => void;
}

export function AdBanner({ banner, onClick }: AdBannerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(banner.onClickTarget);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-gradient-to-br ${banner.gradientFrom || 'from-primary-500'} ${banner.gradientTo || 'to-primary-600'} rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-2xl shadow-glow`}
    >
      <h3 className="text-lg font-bold text-white mb-1">
        {banner.title}
      </h3>
      <p className="text-sm text-white/90 mb-4">
        {banner.subtitle}
      </p>
      <div className="flex items-center gap-2 text-white font-semibold">
        <span>{banner.ctaLabel}</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}
