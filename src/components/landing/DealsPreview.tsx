import { useNavigate } from 'react-router-dom';
import { Tag, ArrowRight, MapPin, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Deal {
  id: string;
  title: string;
  description: string | null;
  merchant_name: string;
  merchant_logo: string | null;
  image_url: string | null;
  discount_text: string;
  original_price: number | null;
  discounted_price: number | null;
  coupon_code: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  valid_until: string | null;
  is_featured: boolean;
}

export function DealsPreview() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateDiscountPercentage = (original: number | null, discounted: number | null): string => {
    if (!original || !discounted || original <= discounted) return '0';
    return Math.round(((original - discounted) / original) * 100).toString();
  };

  if (loading) {
    return (
      <section className="bg-dark-200 border border-white/10 rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white">Deals Buddy</h2>
              <p className="text-sm text-gray-400">Smart savings near you</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full bg-dark-100 border border-white/10 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-dark-200 border border-white/10 rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">
              Deals Buddy
            </h2>
            <p className="text-sm text-gray-400">Smart savings near you</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/deals')}
          className="text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 text-sm font-semibold"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm mb-3">No featured deals available</p>
          <button
            onClick={() => navigate('/deals')}
            className="px-4 py-2 bg-gradient-primary text-white rounded-xl text-sm font-medium hover:shadow-glow transition-all"
          >
            Browse All Deals
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const discountPercentage = calculateDiscountPercentage(deal.original_price, deal.discounted_price);
            const locationText = deal.location || (deal.city && deal.state ? `${deal.city}, ${deal.state}` : 'Online');

            return (
              <button
                key={deal.id}
                onClick={() => navigate('/deals')}
                className="w-full group bg-dark-100 border border-white/10 rounded-2xl p-4 hover:border-primary-500/50 transition-all text-left"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-dark-200">
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    {/* Discount Badge */}
                    {discountPercentage !== '0' && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full font-bold text-xs shadow-lg">
                        {discountPercentage}%
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Merchant */}
                    <div className="flex items-center gap-2 mb-1">
                      {deal.merchant_logo && (
                        <img
                          src={deal.merchant_logo}
                          alt={deal.merchant_name}
                          className="w-4 h-4 rounded-full object-cover border border-white/20"
                        />
                      )}
                      <span className="text-xs text-gray-400 font-medium">
                        {deal.merchant_name}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors">
                      {deal.title}
                    </h3>

                    {/* Price */}
                    {deal.original_price && deal.discounted_price && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-primary-400">
                          ${deal.discounted_price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${deal.original_price.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Discount Text */}
                    {!deal.original_price && deal.discount_text && (
                      <div className="mb-2">
                        <span className="text-lg font-bold text-primary-400">
                          {deal.discount_text}
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{locationText}</span>
                      </div>
                      {deal.valid_until && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires {formatDate(deal.valid_until)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={() => navigate('/deals')}
        className="w-full mt-4 px-4 py-3 bg-gradient-primary text-white font-semibold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2"
      >
        <span>Explore All Deals</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
