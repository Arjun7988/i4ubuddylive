import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, MapPin, DollarSign, Clock, Home } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getClassifieds } from '../lib/classifieds';
import type { Classified, ClassifiedFilters } from '../types/classifieds';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "CLASSIFIEDS";

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

export function ClassifiedsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClassifiedFilters>({
    page: 1,
    pageSize: 20,
    sort: 'newest',
  });

  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  // Location context for ad targeting (adapt to your real user/location data)
  const userState: string | null = null;    // e.g. user?.state ?? null
  const userCity: string | null = null;     // e.g. user?.city ?? null
  const userPincode: string | null = null;  // e.g. user?.pincode ?? null

  useEffect(() => {
    loadClassifieds();
  }, [filters]);

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

  const loadClassifieds = async () => {
    setLoading(true);
    try {
      const result = await getClassifieds(filters);
      setClassifieds(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = () => {
    if (!user) {
      alert('Please log in to post a listing');
      navigate('/auth');
    } else {
      navigate('/classifieds/new');
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

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const totalPages = Math.ceil(total / (filters.pageSize || 20));

  const topClassifieds = classifieds.filter(c => c.is_top_classified);
  const featuredClassifieds = classifieds.filter(c => c.is_featured_classified);
  const latestClassifieds = classifieds.filter(c => !c.is_top_classified && !c.is_featured_classified); // Start from index 9 since Featured is now static

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 py-8 w-full">

        {/* Breadcrumb and Post Button */}
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
            <span className="text-white font-medium">Classifieds</span>
          </nav>

          <GradientButton onClick={handlePostClick} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold">
            <Plus className="w-4 h-4" />
            Post Ad
          </GradientButton>
        </div>

        {/* Google Ads - Hidden for now */}
        {/* <AdSenseAd slotId={ADSENSE_SLOTS.LIST_TOP} className="mb-8" /> */}

        {/* Top Banner Ads - Side by Side */}
        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
        )}

        {/* Filter Section */}
        <div className="glass glass-border rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search classifieds..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
                className="pl-10"
              />
            </div>

            {/* State */}
            <Select
              value={filters.state || ''}
              onChange={(e) => setFilters({ ...filters, state: e.target.value || undefined, page: 1 })}
              className="lg:w-40"
            >
              <option value="">All States</option>
              <option value="TX">Texas</option>
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="FL">Florida</option>
            </Select>

            {/* City */}
            <Select
              value={filters.city || ''}
              onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined, page: 1 })}
              className="lg:w-40"
            >
              <option value="">All Cities</option>
              <option value="Dallas">Dallas</option>
              <option value="Houston">Houston</option>
              <option value="Austin">Austin</option>
              <option value="San Antonio">San Antonio</option>
            </Select>

            {/* Pincode */}
            <Select
              value={filters.city || ''}
              onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined, page: 1 })}
              className="lg:w-40"
            >
              <option value="">All Pincodes</option>
              <option value="75001">75001</option>
              <option value="75002">75002</option>
              <option value="77001">77001</option>
              <option value="78701">78701</option>
            </Select>

            {/* Sort */}
            <Select
              value={filters.sort || 'newest'}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as any, page: 1 })}
              className="lg:w-48"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="most_viewed">Most Viewed</option>
            </Select>

            {/* Clear Filters */}
            {(filters.search || filters.state || filters.city) && (
              <button
                onClick={() => setFilters({ page: 1, pageSize: 20, sort: filters.sort })}
                className="text-sm text-primary-400 hover:text-primary-300 whitespace-nowrap lg:ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass glass-border rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          </>
        ) : classifieds.length === 0 ? (
          <div className="glass glass-border rounded-xl p-12 text-center">
            <p className="text-xl text-gray-400 mb-4">No classifieds found</p>
            <GradientButton onClick={handlePostClick}>Post Your First Listing</GradientButton>
          </div>
        ) : (
          <>
            {/* Main 2-Column Layout: Content + Ads */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
              {/* LEFT COLUMN - All Content */}
              <div className="lg:col-span-9 space-y-12">
                {/* Top Classifieds */}
                {topClassifieds.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-heading font-bold text-white mb-1">
                          Top Classifieds
                        </h2>
                        <div className="h-1 w-32 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                      </div>
                      <span className="text-sm text-gray-400">{topClassifieds.length} ads</span>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {topClassifieds.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <div
                          onClick={() => navigate(`/classifieds/${item.id}`)}
                          className="glass glass-border rounded-xl overflow-hidden hover:shadow-glow transition-all duration-300 cursor-pointer group"
                        >
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={item.images?.[0] || 'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=400'}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-gradient-primary rounded-lg text-white text-xs font-bold">
                                New
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              {item.created_by?.avatar_url ? (
                                <img
                                  src={item.created_by.avatar_url}
                                  alt={item.created_by.full_name || 'User'}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                                  <span className="text-primary-400 text-xs font-semibold">
                                    {item.created_by?.full_name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                              <span className="text-gray-400 text-xs">{item.created_by?.full_name || 'Unknown'}</span>
                            </div>

                            <h3 className="text-white font-semibold line-clamp-1">{item.title}</h3>

                            <p className="text-sm text-gray-400 line-clamp-1">{item.description}</p>

                            <div className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {index === 4 && inlineAds.length > 0 && (
                          <div className="md:col-span-2 lg:col-span-3 my-4 space-y-4">
                            {inlineAds.filter(ad => ad.image_url).map((ad) => (
                              <button
                                key={ad.id}
                                type="button"
                                onClick={() => handleAdClick(ad)}
                                className="block w-full"
                              >
                                <img
                                  src={ad.image_url}
                                  alt={ad.title}
                                  className="w-full max-h-32 object-cover rounded-xl border border-slate-800 shadow"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                )}

                {/* Featured Classifieds */}
                {featuredClassifieds.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-heading font-bold text-white mb-1">
                          Featured Classifieds
                        </h2>
                        <div className="h-1 w-44 bg-gradient-to-r from-amber-500 to-pink-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {featuredClassifieds.slice(0, 8).map((item, index) => {
                        const gradients = [
                          { bg: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', shadow: '0 10px 40px rgba(139, 92, 246, 0.3)' },
                          { bg: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)', shadow: '0 10px 40px rgba(59, 130, 246, 0.3)' },
                          { bg: 'linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)', shadow: '0 10px 40px rgba(20, 184, 166, 0.3)' },
                          { bg: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', shadow: '0 10px 40px rgba(245, 158, 11, 0.3)' },
                          { bg: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', shadow: '0 10px 40px rgba(236, 72, 153, 0.3)' },
                          { bg: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)', shadow: '0 10px 40px rgba(16, 185, 129, 0.3)' },
                          { bg: 'linear-gradient(135deg, #F59E0B 0%, #10B981 100%)', shadow: '0 10px 40px rgba(245, 158, 11, 0.3)' },
                          { bg: 'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)', shadow: '0 10px 40px rgba(239, 68, 68, 0.3)' },
                        ];
                        const gradient = gradients[index % gradients.length];

                        return (
                          <div
                            key={item.id}
                            onClick={() => navigate(`/classifieds/${item.id}`)}
                            className="relative rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl overflow-hidden"
                            style={{
                              background: gradient.bg,
                              boxShadow: gradient.shadow
                            }}
                          >
                            <h3 className="text-white text-xl font-bold mb-2 line-clamp-1">{item.title}</h3>
                            <p className="text-white/90 text-sm line-clamp-2">
                              {item.description}
                            </p>
                            {item.price && (
                              <div className="mt-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-white" />
                                <span className="text-white font-semibold">${item.price}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Latest Classifieds */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-heading font-bold text-white mb-1">
                        Latest Classifieds
                      </h2>
                      <div className="h-1 w-36 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full"></div>
                    </div>
                    {latestClassifieds.length > 0 && (
                      <button
                        onClick={() => setFilters({ ...filters, pageSize: (filters.pageSize || 20) + 20 })}
                        className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {latestClassifieds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestClassifieds.slice(0, 10).map((item, index) => {
                        const isPaidHighlight = index < 5;
                        const highlightColors = [
                          'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50',
                          'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/50',
                          'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50',
                          'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/50',
                          'bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/50'
                        ];

                        return (
                          <div
                            key={item.id}
                            onClick={() => navigate(`/classifieds/${item.id}`)}
                            className={`glass rounded-lg p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group border-2 ${
                              isPaidHighlight ? highlightColors[index] : 'glass-border'
                            }`}
                          >
                            <h3 className="text-white font-semibold mb-1 group-hover:text-primary-400 transition-colors">{item.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-1">{item.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass glass-border rounded-lg p-8 text-center">
                      <p className="text-gray-400">No more classifieds to show</p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Vertical Ads */}
              <div className="lg:col-span-3 space-y-4">
                {rightAds.length > 0 ? (
                  <>
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
                  </>
                ) : (
                    <>
                      <div className="mb-6">
                        <h3 className="text-xl font-heading font-bold text-white mb-1">
                          Sponsored Ads
                        </h3>
                        <div className="h-0.5 w-28 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                      </div>

                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={filters.page === 1}
                  className="p-2 rounded-lg border border-border bg-surface disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= (filters.page || 1) - 2 && page <= (filters.page || 1) + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setFilters({ ...filters, page })}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            filters.page === page
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border bg-surface hover:border-primary-500'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === (filters.page || 1) - 3 || page === (filters.page || 1) + 3) {
                      return <span key={page} className="text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={filters.page === totalPages}
                  className="p-2 rounded-lg border border-border bg-surface disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

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

      {/* Footer Banner Ads - Side by Side */}
      {(footerLeftAds.length > 0 || footerRightAds.length > 0) && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {footerLeftAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {footerRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
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
