import { MapPin, Clock, Tag, Star } from 'lucide-react';
import { Deal } from '../../types/deals';

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
}

export function DealCard({ deal, onClick, locationAddress, locationLat, locationLng }: DealCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysUntilExpiry = () => {
    if (!deal.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(deal.expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = locationAddress || deal.location;
    if (locationLat && locationLng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${locationLat},${locationLng}`, '_blank');
    } else if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    }
  };

  const days = daysUntilExpiry();
  const isExpiringSoon = days !== null && days <= 3;
  const hasPrices = deal.originalPrice > 0 && deal.discountedPrice > 0;

  return (
    <button
      onClick={() => onClick?.(deal)}
      className="group bg-dark-200 border border-white/10 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all hover:scale-[1.02] hover:shadow-xl text-left w-full"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-dark-100">
        <img
          src={deal.imageUrl}
          alt={deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {deal.isSponsored && (
            <span className="px-2 py-1 bg-yellow-500 text-dark-300 text-xs font-bold rounded-full">
              SPONSORED
            </span>
          )}
          {deal.isFeatured && (
            <span className="px-2 py-1 bg-gradient-primary text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              FEATURED
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {deal.discountPercentage > 0 && hasPrices && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
            {deal.discountPercentage}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Merchant */}
        <div className="flex items-center gap-2 mb-2">
          {deal.merchantLogo && (
            <img
              src={deal.merchantLogo}
              alt={deal.merchantName}
              className="w-6 h-6 rounded-full object-cover border border-white/20"
            />
          )}
          <span className="text-xs text-gray-400 font-medium">
            {deal.merchantName}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {deal.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {deal.description}
        </p>

        {/* Price */}
        {hasPrices && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold text-primary-400">
              ${deal.discountedPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 line-through">
              ${deal.originalPrice.toFixed(2)}
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
          <button
            onClick={handleLocationClick}
            className="flex items-center gap-1 hover:text-primary-400 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{deal.location} • {deal.distance.toFixed(1)} mi</span>
          </button>
          {deal.expiresAt && (
            <div className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-400' : ''}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>Expires {formatDate(deal.expiresAt)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {deal.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-dark-100 border border-white/10 text-gray-300 text-xs rounded-lg flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
