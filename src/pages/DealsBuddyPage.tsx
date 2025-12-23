import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Sparkles, Store, TrendingUp, ArrowRight, Home, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { DealCard } from '../components/deals/DealCard';
import { Deal } from '../types/deals';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "DEALS";

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

interface DbDeal {
  id: string;
  category_id: string;
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
  location_lat: number | null;
  location_lng: number | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

export function DealsBuddyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterPincode, setFilterPincode] = useState('');
  const [categories, setCategories] = useState<Array<{id: string; name: string; icon: string}>>([]);
  const [dbDeals, setDbDeals] = useState<DbDeal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [userPincode, setUserPincode] = useState<string | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userState, setUserState] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availablePincodes, setAvailablePincodes] = useState<string[]>([]);

  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const requestCurrentLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLat(position.coords.latitude);
            setUserLng(position.coords.longitude);
            console.log('📍 Current location:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            loadUserLocationFromProfile();
          }
        );
      } else {
        console.log('Geolocation not available, using profile location');
        loadUserLocationFromProfile();
      }
    };

    const loadUserLocationFromProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('pincode, city, state')
        .eq('id', user.id)
        .maybeSingle();

      if (data && !error) {
        setUserPincode(data.pincode || null);
        setUserCity(data.city || null);
        setUserState(data.state || null);

        if (data.city && data.state) {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            `${data.city}, ${data.state}`
          )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

          try {
            const response = await fetch(geocodeUrl);
            const geocodeData = await response.json();
            if (geocodeData.results && geocodeData.results[0]) {
              const location = geocodeData.results[0].geometry.location;
              setUserLat(location.lat);
              setUserLng(location.lng);
            }
          } catch (error) {
            console.error('Error geocoding user location:', error);
          }
        }
      }
    };

    requestCurrentLocation();
  }, [user]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('deal_categories')
          .select('id, name, icon')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadDeals = async () => {
      setLoadingDeals(true);
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDbDeals(data || []);

        const states = [...new Set(data?.map(d => d.state).filter(Boolean) as string[])].sort();
        const cities = [...new Set(data?.map(d => d.city).filter(Boolean) as string[])].sort();
        const pincodes = [...new Set(data?.map(d => d.pincode).filter(Boolean) as string[])].sort();

        setAvailableStates(states);
        setAvailableCities(cities);
        setAvailablePincodes(pincodes);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoadingDeals(false);
      }
    };

    loadDeals();
  }, []);

  useEffect(() => {
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      console.log('🔍 [DEALS] Loading ads for page:', PAGE_KEY);

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "ACTIVE")
        .contains("pages", [PAGE_KEY]);

      if (error) {
        console.error("❌ [DEALS] Error loading ads for page:", PAGE_KEY, error);
        return;
      }
      if (!data) {
        console.log('⚠️ [DEALS] No data returned from ads query');
        return;
      }

      console.log(`✅ [DEALS] Fetched ${data.length} ads from database`);

      // Filter by date window
      const activeByDate = data.filter((ad: any) => {
        const start = ad.start_date ?? today;
        const end = ad.end_date ?? today;
        return start <= today && today <= end;
      });

      console.log(`📅 [DEALS] After date filter: ${activeByDate.length} ads (showing all ads, no location filtering)`);

      // Map to PageAd (no location filtering - show all ads)
      const mapped: PageAd[] = activeByDate.map((ad: any) => ({
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

      console.log('📊 [DEALS] Ads by placement:', {
        topLeft: topLeft.length,
        topRight: topRight.length,
        footerLeft: footerLeft.length,
        footerRight: footerRight.length,
        right: right.length,
        inline: inline.length
      });
    };

    loadPageAds();
  }, []);

  const sortedAndFilteredDeals = useMemo(() => {
    let filtered = [...dbDeals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(deal =>
        deal.title.toLowerCase().includes(query) ||
        (deal.description && deal.description.toLowerCase().includes(query)) ||
        deal.merchant_name.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(deal => deal.category_id === selectedCategory);
    }

    if (filterState) {
      filtered = filtered.filter(deal => deal.state === filterState);
    }

    if (filterCity) {
      filtered = filtered.filter(deal => deal.city === filterCity);
    }

    if (filterPincode) {
      filtered = filtered.filter(deal => deal.pincode === filterPincode);
    }

    filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;

      if (userLat && userLng) {
        const distA = (a.location_lat && a.location_lng)
          ? calculateDistance(userLat, userLng, a.location_lat, a.location_lng)
          : 999999;
        const distB = (b.location_lat && b.location_lng)
          ? calculateDistance(userLat, userLng, b.location_lat, b.location_lng)
          : 999999;
        return distA - distB;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [dbDeals, searchQuery, selectedCategory, filterState, filterCity, filterPincode, userLat, userLng]);

  const convertDbDealToMockDeal = (dbDeal: DbDeal): Deal => {
    const originalPrice = dbDeal.original_price || 0;
    const discountedPrice = dbDeal.discounted_price || 0;
    const discountPercentage = originalPrice > 0 && discountedPrice > 0
      ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
      : 0;

    const distance = (userLat && userLng && dbDeal.location_lat && dbDeal.location_lng)
      ? calculateDistance(userLat, userLng, dbDeal.location_lat, dbDeal.location_lng)
      : 0;

    return {
      id: dbDeal.id,
      merchantId: dbDeal.id,
      title: dbDeal.title,
      description: dbDeal.description || '',
      merchantName: dbDeal.merchant_name,
      merchantLogo: dbDeal.merchant_logo,
      category: 'all',
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      discountPercentage: discountPercentage,
      imageUrl: dbDeal.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      location: dbDeal.location || dbDeal.city || 'Location not specified',
      distance: distance,
      expiresAt: dbDeal.valid_until || '',
      isSponsored: false,
      isFeatured: dbDeal.is_featured,
      tags: [],
      termsAndConditions: dbDeal.description || undefined,
      redeemInstructions: dbDeal.coupon_code ? `Use code: ${dbDeal.coupon_code}` : undefined,
    };
  };

  const filteredDeals = useMemo(() => {
    return sortedAndFilteredDeals.map(dbDeal => ({
      deal: convertDbDealToMockDeal(dbDeal),
      locationAddress: dbDeal.location,
      locationLat: dbDeal.location_lat,
      locationLng: dbDeal.location_lng
    }));
  }, [sortedAndFilteredDeals, userLat, userLng]);

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

  const handleDealClick = (deal: Deal) => {
    // TODO: Navigate to deal detail page
    console.log('Deal clicked:', deal);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative pt-[calc(128px+50px)] pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb and Post Deal Button */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">Deals</span>
            </nav>

            <button
              onClick={() => navigate('/merchant')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold hover:shadow-glow transition-all duration-300"
            >
              <Store className="w-4 h-4" />
              <span>Post Deal</span>
            </button>
          </div>
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

          {/* Filter Section */}
          <div className="glass glass-border rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-200 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>

              {/* State Filter */}
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity('');
                  setFilterPincode('');
                }}
                className="bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-500/50 transition-colors"
              >
                <option value="">All States</option>
                {availableStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {/* City Filter */}
              <select
                value={filterCity}
                onChange={(e) => {
                  setFilterCity(e.target.value);
                  setFilterPincode('');
                }}
                className="bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-500/50 transition-colors"
              >
                <option value="">All Cities</option>
                {availableCities
                  .filter(city => !filterState || dbDeals.some(d => d.city === city && d.state === filterState))
                  .map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>

              {/* Pincode Filter */}
              <select
                value={filterPincode}
                onChange={(e) => setFilterPincode(e.target.value)}
                className="bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-500/50 transition-colors"
              >
                <option value="">All Pincodes</option>
                {availablePincodes
                  .filter(pincode => {
                    if (!filterState && !filterCity) return true;
                    return dbDeals.some(d =>
                      d.pincode === pincode &&
                      (!filterState || d.state === filterState) &&
                      (!filterCity || d.city === filterCity)
                    );
                  })
                  .map((pincode) => (
                    <option key={pincode} value={pincode}>
                      {pincode}
                    </option>
                  ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-dark-200 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary-500/50 transition-colors"
              >
                <option value="">All Deals</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-9">

          {/* TOP DEALS NEAR YOU */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-white">
                  Top Deals Near You
                </h2>
                <p className="text-sm text-gray-400">
                  {filteredDeals.length} deals found
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.map((item) => (
                <DealCard
                  key={item.deal.id}
                  deal={item.deal}
                  onClick={handleDealClick}
                  locationAddress={item.locationAddress || undefined}
                  locationLat={item.locationLat || undefined}
                  locationLng={item.locationLng || undefined}
                />
              ))}
            </div>

            {filteredDeals.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-4">
                  No deals found matching your search
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setFilterState('');
                    setFilterCity('');
                    setFilterPincode('');
                  }}
                  className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>

          {/* BOTTOM CTA FOR MERCHANTS */}
          <section>
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
              <div className="relative z-10 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                  Are You a Business Owner?
                </h2>
                <p className="text-lg text-white/90 mb-8">
                  Join Deals Buddy and reach thousands of local customers actively looking for great deals. Boost your sales and grow your business today!
                </p>
                <button
                  onClick={() => navigate('/merchant')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
                >
                  <span>List Your Business</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
          </div>

          {/* RIGHT COLUMN - Sidebar Ads */}
          <div className="lg:col-span-3">
            <div>
              {rightAds.length > 0 ? (
                <div className="space-y-4 mb-4">
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
                        className="w-full max-h-[420px] object-cover rounded-2xl border border-slate-800 shadow-md"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-heading font-bold text-white mb-1">
                      Sponsored Ads
                    </h3>
                    <div className="h-0.5 w-28 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div
                        key={num}
                        className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105"
                      >
                        <div className="aspect-[4/3] bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"></div>
                          <div className="relative z-10 text-center p-4">
                            <div className="text-4xl mb-2">📢</div>
                            <div className="text-white text-sm font-bold">Ad Space {num}</div>
                            <div className="text-gray-400 text-xs mt-1">Your ad here</div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                            Ad
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
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

      <Footer />
    </div>
  );
}
