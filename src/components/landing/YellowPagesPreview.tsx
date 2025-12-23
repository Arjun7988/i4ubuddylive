import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, ArrowRight, Building2, Star } from 'lucide-react';

const dummyBusinesses = [
  {
    id: 1,
    name: 'Ace Plumbing Services',
    category: 'Home Services',
    location: 'Dallas, TX',
    phone: '(555) 123-4567',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Green Thumb Landscaping',
    category: 'Landscaping',
    location: 'Austin, TX',
    phone: '(555) 234-5678',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'Tech Repair Hub',
    category: 'Electronics',
    location: 'Houston, TX',
    phone: '(555) 345-6789',
    rating: 4.7,
  },
];

export function YellowPagesPreview() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-white">Featured Businesses</h2>
        <button
          onClick={() => navigate('/classifieds?category=services')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-3">
        {dummyBusinesses.map((business) => (
          <div
            key={business.id}
            onClick={() => navigate('/classifieds')}
            className="glass glass-border rounded-xl p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1 line-clamp-1">{business.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs">
                    {business.category}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <Star className="w-3 h-3 fill-yellow-500" />
                    {business.rating}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                  <MapPin className="w-3 h-3" />
                  {business.location}
                </div>
                <a
                  href={`tel:${business.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-xs"
                >
                  <Phone className="w-3 h-3" />
                  {business.phone}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
