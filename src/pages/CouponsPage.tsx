import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CouponCard } from '../components/coupons/CouponCard';
import { AdSenseAd } from '../components/ads/AdSenseAd';
import { ADSENSE_SLOTS } from '../config/adsense';
import { supabase } from '../lib/supabase';

interface Coupon {
  id: string;
  title: string;
  description?: string;
  discount_value: string;
  discount_type: string;
  badge_text?: string;
  badge_color?: string;
  expires_at: string;
  coupon_code?: string;
  button_text: string;
  button_action: string;
  terms?: string;
  is_active: boolean;
}

export function CouponsPage() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    const filtered = coupons.filter((coupon) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        coupon.title.toLowerCase().includes(searchLower) ||
        coupon.description?.toLowerCase().includes(searchLower) ||
        coupon.coupon_code?.toLowerCase().includes(searchLower) ||
        coupon.discount_value.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCoupons(filtered);
  }, [searchQuery, coupons]);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
      setFilteredCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCouponAction = (couponId: string, action: string) => {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon) return;

    switch (action) {
      case 'register':
        navigate('/auth');
        break;
      case 'show_code':
        if (coupon.coupon_code) {
          navigator.clipboard.writeText(coupon.coupon_code);
        }
        break;
      case 'view_deal':
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 -mx-4 lg:-mx-8 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 via-magenta-500 to-pink-500 py-3">
            <div className="relative overflow-hidden">
              <div className="animate-scroll whitespace-nowrap inline-block">
                <span className="inline-flex items-center gap-3 text-white font-semibold text-sm md:text-base px-4">
                  <Ticket className="w-5 h-5" />
                  <span>Save Big with Exclusive Deals!</span>
                  <span className="mx-4">•</span>
                  <span>Limited Time Offers</span>
                  <span className="mx-4">•</span>
                  <span>New Coupons Added Daily</span>
                  <span className="mx-4">•</span>
                  <span>Up to 70% Off!</span>
                  <span className="mx-4">•</span>
                  <Ticket className="w-5 h-5" />
                  <span>Save Big with Exclusive Deals!</span>
                  <span className="mx-4">•</span>
                  <span>Limited Time Offers</span>
                  <span className="mx-4">•</span>
                  <span>New Coupons Added Daily</span>
                  <span className="mx-4">•</span>
                  <span>Up to 70% Off!</span>
                  <span className="mx-4">•</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow">
              <Ticket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-2">
              Exclusive Coupons & Deals
            </h1>
            <p className="text-gray-400 text-lg">
              Save money with our handpicked deals and discount codes
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupons by title, code, or discount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface/50 rounded-2xl border border-white/5 p-6 h-48 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/5 p-12 text-center">
                <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No Coupons Found' : 'No Coupons Available'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery ? 'Try a different search term' : 'Check back soon for new deals and discounts!'}
                </p>
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  id={coupon.id}
                  title={coupon.title}
                  description={coupon.description}
                  discountValue={coupon.discount_value}
                  discountType={coupon.discount_type}
                  badgeText={coupon.badge_text}
                  badgeColor={coupon.badge_color}
                  expiresAt={coupon.expires_at}
                  couponCode={coupon.coupon_code}
                  buttonText={coupon.button_text}
                  buttonAction={coupon.button_action}
                  terms={coupon.terms}
                  onAction={handleCouponAction}
                />
              ))
            )}
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <div className="sticky top-32 space-y-6">
              <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_1} />
              <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_2} />
              <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_3} />
            </div>
          </aside>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
