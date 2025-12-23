import { MapPin, Star, BadgeCheck, Tag } from 'lucide-react';
import { Merchant } from '../../types/deals';

interface MerchantCardProps {
  merchant: Merchant;
  onClick?: (merchant: Merchant) => void;
}

export function MerchantCard({ merchant, onClick }: MerchantCardProps) {
  return (
    <button
      onClick={() => onClick?.(merchant)}
      className="group bg-dark-200 border border-white/10 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all hover:scale-[1.02] hover:shadow-xl text-left w-full"
    >
      {/* Cover Image */}
      {merchant.coverImage && (
        <div className="relative aspect-[2/1] overflow-hidden bg-dark-100">
          <img
            src={merchant.coverImage}
            alt={merchant.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Logo and Name */}
        <div className="flex items-start gap-3 mb-3">
          <img
            src={merchant.logo}
            alt={merchant.name}
            className="w-14 h-14 rounded-xl object-cover border-2 border-white/20"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-primary-400 transition-colors">
                {merchant.name}
              </h3>
              {merchant.isVerified && (
                <BadgeCheck className="w-5 h-5 text-primary-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-400">{merchant.category}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {merchant.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{merchant.location} • {merchant.distance} mi</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold">{merchant.rating}</span>
            <span className="text-gray-400">({merchant.reviewCount})</span>
          </div>
        </div>

        {/* Active Deals Badge */}
        <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-primary rounded-lg text-white text-sm font-semibold">
          <Tag className="w-4 h-4" />
          <span>{merchant.activeDealsCount} Active {merchant.activeDealsCount === 1 ? 'Deal' : 'Deals'}</span>
        </div>
      </div>
    </button>
  );
}
