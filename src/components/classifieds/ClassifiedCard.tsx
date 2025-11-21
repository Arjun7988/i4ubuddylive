import { Link } from 'react-router-dom';
import { MapPin, Tag, Eye } from 'lucide-react';
import type { Classified } from '../../types/classifieds';
import { GlowingCard } from '../GlowingCard';

interface ClassifiedCardProps {
  classified: Classified;
}

export function ClassifiedCard({ classified }: ClassifiedCardProps) {
  const isNew = new Date(classified.created_at) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const thumbnail = classified.images[0] || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg';

  const formatPrice = () => {
    if (!classified.price) return 'Negotiable';
    return `${classified.currency} ${classified.price.toLocaleString()}`;
  };

  return (
    <Link to={`/classifieds/${classified.id}`}>
      <GlowingCard className="h-full hover:scale-[1.02] transition-transform duration-200">
        <div className="space-y-3">
          <div className="relative">
            <img
              src={thumbnail}
              alt={classified.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 flex gap-2">
              {classified.is_featured && (
                <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                  FEATURED
                </span>
              )}
              {isNew && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                  NEW
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white line-clamp-2 mb-2">
              {classified.title}
            </h3>

            <p className="text-2xl font-bold text-primary-400 mb-2">
              {formatPrice()}
            </p>

            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
              {classified.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {classified.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{classified.city}, {classified.state}</span>
                  </div>
                )}
                {classified.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{classified.category.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{classified.views_count}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border text-xs text-gray-500">
              {new Date(classified.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </GlowingCard>
    </Link>
  );
}
