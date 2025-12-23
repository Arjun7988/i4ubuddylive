import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Star,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Share2,
  Plus,
  MessageCircle,
  Globe,
  Clock,
  X,
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

const PAGE_KEY = "SERVICES_DETAIL";

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
  business_hours: any;
  listing_type: string;
  images: any;
  category: Category;
  subcategory: Subcategory | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  is_approved: boolean;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function ServiceProviderDetailPage() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const [listing, setListing] = useState<BuddyServiceListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

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

      setRightAds(right);
    };

    loadPageAds();
  }, [userState, userCity, userPincode]);

  useEffect(() => {
    async function fetchListing() {
      try {
        setLoading(true);
        setError('');

        const { data, error: fetchError } = await supabase
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
            business_hours,
            listing_type,
            images,
            category:buddy_service_categories(id, name, slug),
            subcategory:buddy_service_subcategories(id, name, slug)
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Listing not found');

        setListing(data as any);
      } catch (err: any) {
        console.error('Error fetching listing:', err);
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchListing();
    }
  }, [slug]);

  useEffect(() => {
    async function fetchReviews() {
      if (!listing) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('buddy_service_reviews')
          .select('*')
          .eq('listing_id', listing.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setReviews(data || []);
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
      }
    }

    fetchReviews();
  }, [listing]);

  const categoryName = listing?.category?.name || (category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : 'Services');

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listing) return;

    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setReviewError('You must be logged in to submit a review');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || user.email?.split('@')[0] || 'Anonymous';

      const { error: insertError } = await supabase
        .from('buddy_service_reviews')
        .insert({
          listing_id: listing.id,
          user_id: user.id,
          rating: reviewRating,
          comment: reviewComment,
          user_name: userName,
          is_approved: false
        });

      if (insertError) throw insertError;

      setReviewSuccess('Review submitted successfully! It will appear after admin approval.');
      setReviewRating(5);
      setReviewComment('');
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
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

  const handleShareProfile = () => {
    setShowShareModal(true);
  };

  const shareToSocial = (platform: string) => {
    if (!listing) return;
    const shareUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(listing.business_name);
    const description = encodeURIComponent(listing.tagline || listing.about_business.substring(0, 200));

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${title}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${title}%20${shareUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert('Link copied to clipboard!');
        });
        setShowShareModal(false);
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const handleShareGoogleMaps = () => {
    if (!listing) return;
    const address = `${listing.street_address}, ${listing.city}, ${listing.state} ${listing.zip_code}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />
        <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 pb-6 sm:pb-8 w-full">
          <div className="glass glass-border rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading service provider...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />
        <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 pb-6 sm:pb-8 w-full">
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-red-400 mb-2">Service provider not found</p>
            <p className="text-gray-400 text-sm mb-4">{error || 'The listing you are looking for does not exist or has been removed.'}</p>
            <Link
              to="/buddy-services"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold hover:shadow-glow transition-all duration-300"
            >
              Browse Services
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] pb-6 sm:pb-8">
        <div className="container mx-auto px-4 lg:px-8">
        {/* Breadcrumb & Add Service Button */}
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
            <Link
              to={`/buddy-services/${category}`}
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              {categoryName}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium truncate max-w-xs sm:max-w-md">
              {listing.business_name}
            </span>
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] gap-6">
          {/* LEFT: Provider Details */}
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="glass glass-border rounded-xl overflow-hidden">
              {listing.images && Array.isArray(listing.images) && listing.images.length > 0 && (
                <img
                  src={listing.images[0]}
                  alt={listing.business_name}
                  className="w-full object-cover"
                  style={{ height: '30vh', minHeight: '250px', maxHeight: '400px' }}
                />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-primary-400 font-medium">
                    {listing.category.name}
                    {listing.subcategory && ` · ${listing.subcategory.name}`}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    listing.listing_type === 'Paid Listing'
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400'
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {listing.listing_type}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-heading font-bold text-white mb-2">
                      {listing.business_name}
                    </h1>
                    {listing.tagline && (
                      <p className="text-lg text-primary-400 font-medium">
                        {listing.tagline}
                      </p>
                    )}
                  </div>

                  {/* Rating Display */}
                  {reviews.length > 0 && (() => {
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    return (
                      <div className="flex flex-col items-end gap-1 bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(avgRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{avgRating.toFixed(1)}</div>
                          <div className="text-xs text-gray-400">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handleShareProfile}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] text-white rounded-xl transition-all duration-300 font-medium"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleShareGoogleMaps}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] text-white rounded-xl transition-all duration-300 font-medium"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Open in Google Maps</span>
                  </button>
                </div>
              </div>
            </div>

            {/* About Card */}
            <div className="glass glass-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                About this provider
              </h2>
              <p className="text-gray-300 leading-relaxed">{listing.about_business}</p>
            </div>

            {/* Contact & Address Card */}
            <div className="glass glass-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Contact & Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Address
                  </h3>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-300">
                      <div>{listing.street_address}</div>
                      <div>{listing.city}, {listing.state} {listing.zip_code}</div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Contact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                      <a
                        href={`tel:${listing.phone}`}
                        className="text-gray-300 hover:text-primary-400 transition-colors"
                      >
                        {listing.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                      <a
                        href={`mailto:${listing.email}`}
                        className="text-gray-300 hover:text-primary-400 transition-colors"
                      >
                        {listing.email}
                      </a>
                    </div>
                    {listing.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <a
                          href={listing.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-primary-400 transition-colors"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                    {listing.whatsapp && (
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <a
                          href={`https://wa.me/${listing.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-primary-400 transition-colors"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                    {listing.social_link && (
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <a
                          href={listing.social_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-primary-400 transition-colors"
                        >
                          Social Media
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Card */}
            {listing.business_hours && Object.keys(listing.business_hours).length > 0 && (
              <div className="glass glass-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-400" />
                  Business Hours
                </h2>
                <div className="space-y-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                    .filter(day => listing.business_hours[day])
                    .map((day) => {
                      const hours = listing.business_hours[day];
                      return (
                        <div key={day} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <span className="text-gray-300 font-medium">{day}</span>
                          <span className="text-gray-400">
                            {hours.closed ? (
                              <span className="text-red-400">Closed</span>
                            ) : (
                              `${hours.open} - ${hours.close}`
                            )}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Map Card */}
            <div className="glass glass-border rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Location on map
              </h2>
              <div className="h-48 bg-slate-800 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                <iframe
                  title="Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${listing.street_address}, ${listing.city}, ${listing.state} ${listing.zip_code}`)}&output=embed`}
                  allowFullScreen
                />
              </div>

              {/* Star Ratings */}
              {reviews.length > 0 && (() => {
                const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                return (
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(avgRating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-300">
                      {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                );
              })()}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.street_address}, ${listing.city}, ${listing.state} ${listing.zip_code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center gap-1"
              >
                Open in Google Maps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Reviews Card */}
            <div className="glass glass-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Reviews</h2>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 mb-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-4 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {review.user_name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-300">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Add your review
                </h3>

                {reviewError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {reviewError}
                  </div>
                )}

                {reviewSuccess && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                    {reviewSuccess}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rating
                    </label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value={5} className="bg-gray-800 text-white">5 - Excellent</option>
                      <option value={4} className="bg-gray-800 text-white">4 - Very Good</option>
                      <option value={3} className="bg-gray-800 text-white">3 - Good</option>
                      <option value={2} className="bg-gray-800 text-white">2 - Fair</option>
                      <option value={1} className="bg-gray-800 text-white">1 - Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      required
                      placeholder="Share your experience..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reviewLoading || !reviewComment.trim()}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: Sponsored Ads Sidebar */}
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

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-6">Share this provider</h3>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] transition-colors"
                  title="Share on Facebook"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-xs text-white">Facebook</span>
                </button>

                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#1DA1F2] hover:bg-[#1A94DA] transition-colors"
                  title="Share on Twitter"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  <span className="text-xs text-white">Twitter</span>
                </button>

                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#0077B5] hover:bg-[#006399] transition-colors"
                  title="Share on LinkedIn"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-xs text-white">LinkedIn</span>
                </button>

                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#25D366] hover:bg-[#22C55E] transition-colors"
                  title="Share on WhatsApp"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-xs text-white">WhatsApp</span>
                </button>
              </div>

              <button
                onClick={() => shareToSocial('copy')}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
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
