import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, MapPin, Phone, ChevronRight, Home, Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

interface BuddyServiceListing {
  id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  about_business: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  display_city: string;
  phone: string;
  email: string;
  website: string | null;
  whatsapp: string | null;
  social_link: string | null;
  listing_type: string;
  category: Category;
  subcategory: Subcategory | null;
}

export default function ServiceProvidersListPage() {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [listings, setListings] = useState<BuddyServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [subcategoryData, setSubcategoryData] = useState<Subcategory | null>(null);
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  const subcategorySlug = searchParams.get('subcategory');

  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  useEffect(() => {
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10);

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

      const activeByDate = data.filter((ad: any) => {
        const start = ad.start_date ?? today;
        const end = ad.end_date ?? today;
        return start <= today && today <= end;
      });

      const activeByLocation = activeByDate.filter((ad: any) => {
        const matchState =
          !ad.target_state || !userState || ad.target_state === userState;
        const matchCity =
          !ad.target_city || !userCity || ad.target_city === userCity;
        const matchPincode =
          !ad.target_pincode || !userPincode || ad.target_pincode === userPincode;

        return matchState && matchCity && matchPincode;
      });

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
    async function fetchListings() {
      try {
        setLoading(true);
        setError('');

        let query = supabase
          .from('buddy_service_listings')
          .select(`
            id,
            slug,
            business_name,
            tagline,
            about_business,
            street_address,
            city,
            state,
            zip_code,
            display_city,
            phone,
            email,
            website,
            whatsapp,
            social_link,
            listing_type,
            category:buddy_service_categories(id, name, slug),
            subcategory:buddy_service_subcategories(id, name, slug)
          `)
          .eq('is_active', true);

        if (category) {
          const { data: catData } = await supabase
            .from('buddy_service_categories')
            .select('id, name, slug')
            .eq('slug', category)
            .maybeSingle();

          if (catData) {
            setCategoryData(catData);
            query = query.eq('category_id', catData.id);
          }
        }

        if (subcategorySlug) {
          const { data: subData } = await supabase
            .from('buddy_service_subcategories')
            .select('id, name, slug')
            .eq('slug', subcategorySlug)
            .maybeSingle();

          if (subData) {
            setSubcategoryData(subData);
            query = query.eq('subcategory_id', subData.id);
          }
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Sort: Paid listings first, then free listings, both by created_at desc
        const sortedData = (data || []).sort((a, b) => {
          if (a.listing_type === 'Paid Listing' && b.listing_type !== 'Paid Listing') return -1;
          if (a.listing_type !== 'Paid Listing' && b.listing_type === 'Paid Listing') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setListings(sortedData);
      } catch (err: any) {
        console.error('Error fetching listings:', err);
        setError(err.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [category, subcategorySlug]);

  const categoryName = categoryData?.name || (category
    ? category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Services');

  const subCategoryName = subcategoryData?.name || null;

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
        <div className="container mx-auto px-4 lg:px-8">
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
            <Link
              to="/buddy-services"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Buddy Services
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            {subCategoryName ? (
              <>
                <Link
                  to={`/buddy-services/${category}`}
                  className="text-gray-400 hover:text-primary-400 transition-colors"
                >
                  {categoryName}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-white font-medium">{subCategoryName}</span>
              </>
            ) : (
              <span className="text-white font-medium">{categoryName}</span>
            )}
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

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-6 mt-5">
        {/* LEFT: providers list */}
        <div className="space-y-4">
          {loading ? (
            <div className="glass glass-border rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading service providers...</p>
            </div>
          ) : error ? (
            <div className="glass glass-border rounded-xl p-6 text-center">
              <p className="text-red-400 mb-2">Failed to load listings</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="glass glass-border rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-4">No service providers found in this category yet.</p>
              <Link
                to="/buddy-services/add"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:shadow-glow transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Be the first to add your service</span>
              </Link>
            </div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.id}
                className="glass glass-border rounded-xl p-5 hover:shadow-glow transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(`/buddy-services/${category}/${listing.slug}`)}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left side: Info */}
                  <div className="flex-1 min-w-0">
                    {/* Title - single line with ellipsis */}
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-2 truncate group-hover:text-primary-400 transition-colors">
                      {listing.business_name}
                    </h2>

                    {/* Tagline */}
                    {listing.tagline && (
                      <p className="text-sm text-primary-400 mb-2 font-medium">
                        {listing.tagline}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {listing.about_business}
                    </p>

                    {/* Contact info in a compact row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                      {/* Address */}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                          {listing.display_city}, {listing.state} {listing.zip_code}
                        </span>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <a
                          href={`tel:${listing.phone}`}
                          className="text-xs text-primary-400 hover:text-primary-300 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {listing.phone}
                        </a>
                      </div>

                      {/* Listing Type Badge */}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        listing.listing_type === 'Paid Listing'
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400'
                          : 'bg-white/10 text-gray-400'
                      }`}>
                        {listing.listing_type}
                      </span>
                    </div>
                  </div>

                  {/* Right side: Action buttons */}
                  <div className="flex sm:flex-col gap-2 sm:justify-center sm:min-w-[120px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/buddy-services/${category}/${listing.slug}`);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-glow rounded-lg transition-all duration-300"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT: Sponsored Ads sidebar */}
        <div>
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

      <div className="mt-[50px]">
        <Footer />
      </div>
    </div>
  );
}
