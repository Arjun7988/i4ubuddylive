import { Link } from 'react-router-dom';
import { MapPin, Tag, Eye } from 'lucide-react';
import type { Classified } from '../../types/classifieds';
import { GlowingCard } from '../GlowingCard';
import { Avatar } from '../Avatar';

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
              className="w-full h-48 sm:h-40 md:h-32 object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
              {(classified.is_top_classified) && (
                <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded shadow-md">
                  TOP
                </span>
              )}
              {(classified.is_featured || classified.is_featured_classified) && (
                <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded shadow-md">
                  FEATURED
                </span>
              )}
              {isNew && (
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-md">
                  NEW
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Avatar
              src={classified.created_by?.avatar_url}
              alt={classified.created_by?.full_name || 'User'}
              size="sm"
            />
            <span className="text-sm text-gray-400 truncate">
              {classified.created_by?.full_name || 'Anonymous'}
            </span>
          </div>

          <div>
            <h3 className="font-semibold text-white line-clamp-1 mb-1">
              {classified.title}
            </h3>

            <p className="text-sm text-gray-400 line-clamp-1 mb-2">
              {classified.description}
            </p>

            <div className="text-xs text-gray-500">
              {new Date(classified.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </GlowingCard>
    </Link>
  );
}
