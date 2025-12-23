import { useNavigate } from 'react-router-dom';
import { ArrowRight, Tag, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Coupon {
  id: string;
  title: string;
  description: string;
  discount_percentage: number | null;
  discount_value: string | null;
  discount_type: string | null;
  badge_text: string | null;
  expires_at: string;
  is_active: boolean;
}

export function CouponsPreview() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiresIn = (date: string) => {
    const days = Math.floor((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-white">Hot Coupons & Deals</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass glass-border rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-white">Hot Coupons & Deals</h2>
        </div>
        <div className="glass glass-border rounded-xl p-8 text-center">
          <p className="text-gray-400">No active coupons available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-white">Hot Coupons & Deals</h2>
        <button
          onClick={() => navigate('/coupons')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 group"
        >
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-3">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            onClick={() => navigate('/coupons')}
            className="glass glass-border rounded-xl p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-full blur-2xl" />

            <div className="flex items-start gap-4 relative">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Tag className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-white font-semibold line-clamp-1">{coupon.title}</h3>
                  {coupon.badge_text && (
                    <span className="px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg text-white text-sm font-bold flex-shrink-0">
                      {coupon.badge_text}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">{coupon.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock className="w-3 h-3" />
                    Expires in {getExpiresIn(coupon.expires_at)}
                  </div>
                  <button className="flex items-center gap-1 text-primary-400 text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    Get Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
