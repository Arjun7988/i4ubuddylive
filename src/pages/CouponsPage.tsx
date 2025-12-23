import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Search, Home, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { CouponCard } from '../components/coupons/CouponCard';
import { AdSenseAd } from '../components/ads/AdSenseAd';
import { ADSENSE_SLOTS } from '../config/adsense';
import { supabase } from '../lib/supabase';

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "COUPONS";

type AdActionType = "redirect" | "popup";

type PageAd = {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: AdActionType;
  popup_image_url: string | null;
  popup_description: string | null;
  pages: string[];
  placement: string;
  position: number | null;
  target_state: string | null;
  target_city: string | null;
  target_pincode: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
};

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

  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  // Location context for ad targeting
  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "ACTIVE")
        .contains("pages", [PAGE_KEY]);

      if (error) {
        console.error("Error loading ads for page:", PAGE_KEY, error);
        return;
      }
      if (!data) return;

      // Filter by date window
      const activeByDate = data.filter((ad: any) => {
        const start = ad.start_date ?? today;
        const end = ad.end_date ?? today;
        return start <= today && today <= end;
      });

      // Filter by location (if target_* is set, must match; if null, it's global)
      const activeByLocation = activeByDate.filter((ad: any) => {
        const matchState =
          !ad.target_state || !userState || ad.target_state === userState;
        const matchCity =
          !ad.target_city || !userCity || ad.target_city === userCity;
        const matchPincode =
          !ad.target_pincode || !userPincode || ad.target_pincode === userPincode;

        return matchState && matchCity && matchPincode;
      });

      // Map to PageAd
      const mapped: PageAd[] = activeByLocation.map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        image_url: ad.image_url,
        redirect_url: ad.redirect_url,
        action_type: (ad.action_type ?? "redirect") as AdActionType,
        popup_image_url: ad.popup_image_url,
        popup_description: ad.popup_description,
        pages: ad.pages || [],
        placement: ad.placement,
        position: ad.position,
        target_state: ad.target_state,
        target_city: ad.target_city,
        target_pincode: ad.target_pincode,
        start_date: ad.start_date,
        end_date: ad.end_date,
        status: ad.status ?? "ACTIVE",
      }));

      // Sort by position (lower position numbers display first)
      const sortedMapped = mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

      // Get ALL ads for each placement (using filter for arrays)
      const topLeft = sortedMapped.filter((ad) => ad.placement === 'TOP_LEFT');
      const topRight = sortedMapped.filter((ad) => ad.placement === 'TOP_RIGHT');
      const footerLeft = sortedMapped.filter((ad) => ad.placement === 'FOOTER_LEFT');
      const footerRight = sortedMapped.filter((ad) => ad.placement === 'FOOTER_RIGHT');

      setTopLeftAds(topLeft);
      setTopRightAds(topRight);
      setFooterLeftAds(footerLeft);
      setFooterRightAds(footerRight);

      const right = sortedMapped.filter(
        (ad) => ad.placement === 'RIGHT'
      );
      const inline = sortedMapped.filter(
        (ad) => ad.placement === 'INLINE'
      );

      setRightAds(right);
      setInlineAds(inline);
    };

    loadPageAds();
  }, [userState, userCity, userPincode]);

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

  const handleAdClick = (ad: PageAd | null) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }

    if (ad.action_type === "popup") {
      setPopupAd(ad);
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

      <main className="relative flex-1 pt-[calc(128px+50px)] pb-6 sm:pb-8">
        <div className="container mx-auto px-4 lg:px-8">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <span className="text-white font-medium">Coupons</span>
        </nav>
        </div>

        <div className="container mx-auto px-4 lg:px-8">
        {/* Top Banner Ads */}
        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                {topLeftAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {topRightAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
         

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-9 space-y-6">
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
              filteredCoupons.map((coupon, index) => (
                <React.Fragment key={coupon.id}>
                  <CouponCard
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

                  {inlineAds.length > 0 && inlineAds[0].image_url && index === 4 && (
                    <div className="my-6">
                      <button
                        type="button"
                        onClick={() => handleAdClick(inlineAds[0])}
                        className="block w-full"
                      >
                        <img
                          src={inlineAds[0].image_url}
                          alt={inlineAds[0].title}
                          className="w-full max-h-32 object-cover rounded-xl border border-white/10 shadow"
                        />
                      </button>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>

          <aside className="lg:col-span-3">
            <div className="sticky top-32 space-y-6">
              {rightAds.length > 0 ? (
                <div className="space-y-4">
                  {rightAds.filter(ad => ad.image_url).map((ad) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => handleAdClick(ad)}
                      className="block w-full"
                    >
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full max-h-[420px] object-cover rounded-2xl border border-white/10 shadow-md"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_1} />
                  <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_2} />
                  <AdSenseAd slotId={ADSENSE_SLOTS.COUPON_SIDEBAR_3} />
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Popup Modal for Popup Ads */}
        {popupAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#020617] border border-slate-800 shadow-2xl p-5 relative">
              <button
                type="button"
                onClick={() => setPopupAd(null)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-sm"
              >
                ✕
              </button>

              <h2 className="text-sm sm:text-base font-semibold text-slate-50 mb-2">
                {popupAd.title}
              </h2>

              <img
                src={popupAd.popup_image_url ?? popupAd.image_url ?? ""}
                alt={popupAd.title}
                className="w-full rounded-xl mb-3"
              />

              {popupAd.popup_description && (
                <p className="mb-3 text-xs sm:text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {popupAd.popup_description}
                </p>
              )}

              {popupAd.redirect_url && (
                <a
                  href={popupAd.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Footer Banner Ads */}
      {(footerLeftAds.length > 0 || footerRightAds.length > 0) && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {footerLeftAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {footerRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
