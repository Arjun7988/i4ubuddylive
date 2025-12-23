import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home, Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

// 🔹 Set this according to the page you are editing
const PAGE_KEY = "SERVICES";

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

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  icon_emoji: string;
  badge: "HOT" | "NEW" | null;
  gradient_from: string;
  gradient_to: string;
  is_active: boolean;
};

type ServiceSubCategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

const sideAds = [
  {
    id: 'ad1',
    title: 'Grow your local business',
    subtitle: 'Feature your services on i4uBuddy.',
    ctaLabel: 'List your service',
  },
  {
    id: 'ad2',
    title: 'Promote your events',
    subtitle: 'Boost visibility for shows & meetups.',
    ctaLabel: 'Promote now',
  },
  {
    id: 'ad3',
    title: 'Reach more customers',
    subtitle: 'Advertise your business today.',
    ctaLabel: 'Get started',
  },
];

export default function BuddyServicesPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ServiceSubCategory[]>([]);
  const [loading, setLoading] = useState(true);
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
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      const { data, error} = await supabase
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
    const loadData = async () => {
      try {
        setLoading(true);

        const [categoriesResult, subCategoriesResult] = await Promise.all([
          supabase
            .from('buddy_service_categories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true }),
          supabase
            .from('buddy_service_subcategories')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })
        ]);

        if (categoriesResult.error) throw categoriesResult.error;
        if (subCategoriesResult.error) throw subCategoriesResult.error;

        setCategories(categoriesResult.data || []);
        setSubCategories(subCategoriesResult.data || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCategoryClick = (slug: string) => {
    navigate(`/buddy-services/${slug}`);
  };

  const handleSubCategoryClick = (e: React.MouseEvent, categorySlug: string, subCategorySlug: string) => {
    e.stopPropagation();
    navigate(`/buddy-services/${categorySlug}?subcategory=${subCategorySlug}`);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] pb-6 sm:pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
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
              <span className="text-white font-medium">Buddy Services</span>
            </nav>

            <Link
              to="/buddy-services/add"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold hover:shadow-glow transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          <div className="lg:col-span-9">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading categories...</p>
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No categories available yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((category, index) => {
                  const gradientFrom = category.gradient_from || '#3b82f6';
                  const gradientTo = category.gradient_to || '#8b5cf6';
                  const borderColor = `${gradientFrom}80`;

                  return (
                    <React.Fragment key={category.id}>
                      <button
                        onClick={() => handleCategoryClick(category.slug)}
                        className="relative bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-3xl p-6 text-left transition-all duration-300 group border-2 w-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
                          borderColor: borderColor,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${gradientFrom}CC`;
                          e.currentTarget.style.boxShadow = `0 20px 60px ${gradientFrom}50`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = borderColor;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {category.badge && (
                          <div className="absolute top-4 right-4 z-10">
                            <span
                              className={`px-3 py-1 rounded-md text-white text-xs font-bold uppercase shadow-lg ${
                                category.badge === 'HOT'
                                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}
                            >
                              {category.badge}
                            </span>
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
                            }}
                          >
                            {category.icon_emoji || '📋'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                              {category.name}
                            </h3>
                            {category.subtitle && (
                              <p className="text-sm text-gray-400 italic mb-3">
                                {category.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {(() => {
                          const categorySubCats = subCategories.filter(
                            (sub) => sub.category_id === category.id
                          );

                          if (categorySubCats.length > 0) {
                            return (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex flex-wrap gap-2">
                                  {categorySubCats.map((subCat) => (
                                    <button
                                      key={subCat.id}
                                      onClick={(e) => handleSubCategoryClick(e, category.slug, subCat.slug)}
                                      className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-all duration-200 py-2 px-3 rounded-lg hover:bg-white/5 border border-white/10 hover:border-white/20"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: gradientFrom }} />
                                      <span className="whitespace-nowrap">{subCat.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </button>

                        {/* Inline Ad after 4th item */}
                        {inlineAds.length > 0 && inlineAds[0].image_url && index === 4 && (
                          <button
                            type="button"
                            onClick={() => handleAdClick(inlineAds[0])}
                            className="block w-full"
                          >
                            <img
                              src={inlineAds[0].image_url}
                              alt={inlineAds[0].title}
                              className="w-full max-h-32 object-cover rounded-xl border border-slate-800 shadow"
                            />
                          </button>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>
            )}
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

      {/* Footer Banner Ads - Full Width */}
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

      <div className="mt-[50px]">
        <Footer />
      </div>
    </div>
  );
}
