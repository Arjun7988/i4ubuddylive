import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Tag, Eye, Mail, Phone, CreditCard as Edit, Trash2, Check, Archive, Share2, X, ChevronLeft, Home, ChevronRight, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getClassifiedById, incrementViews, updateClassifiedStatus, deleteClassified, getClassifieds } from '../lib/classifieds';
import type { Classified } from '../types/classifieds';
import { ClassifiedCard } from '../components/classifieds/ClassifiedCard';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { StatusBadge } from '../components/classifieds/StatusBadge';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Avatar } from '../components/Avatar';
import { supabase } from '../lib/supabase';

const PAGE_KEY = "CLASSIFIEDS_DETAIL";

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

export function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classified, setClassified] = useState<Classified | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [relatedClassifieds, setRelatedClassifieds] = useState<Classified[]>([]);
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
    if (id) {
      loadClassified();
      incrementViews(id);
    }
  }, [id]);

  const loadClassified = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await getClassifiedById(id);
      setClassified(data);
      if (data?.images && data.images.length > 0) {
        setMainImage(data.images[0]);
      } else {
        setMainImage('https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg');
      }

      // Load related posts from same category
      if (data?.category_id) {
        const related = await getClassifieds({
          categoryId: data.category_id,
          status: 'active',
          pageSize: 12,
        });
        let relatedPosts = related.data.filter(c => c.id !== id);

        // If not enough related posts, add some latest posts from other categories
        if (relatedPosts.length < 8) {
          const latest = await getClassifieds({
            status: 'active',
            pageSize: 12,
            sort: 'newest',
          });
          const otherPosts = latest.data.filter(c => c.id !== id && !relatedPosts.find(r => r.id === c.id));
          relatedPosts = [...relatedPosts, ...otherPosts].slice(0, 12);
        }

        setRelatedClassifieds(relatedPosts);
      } else {
        // No category, just show latest posts
        const latest = await getClassifieds({
          status: 'active',
          pageSize: 12,
          sort: 'newest',
        });
        setRelatedClassifieds(latest.data.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to load classified:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!id || !confirm('Mark this listing as sold?')) return;

    try {
      await updateClassifiedStatus(id, 'sold');
      await loadClassified();
      alert('Listing marked as sold');
    } catch (error) {
      console.error('Failed to mark as sold:', error);
      alert('Failed to update listing');
    }
  };

  const handleArchive = async () => {
    if (!id || !confirm('Archive this listing?')) return;

    try {
      await updateClassifiedStatus(id, 'archived');
      await loadClassified();
      alert('Listing archived');
    } catch (error) {
      console.error('Failed to archive:', error);
      alert('Failed to update listing');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this listing permanently?')) return;

    try {
      await deleteClassified(id);
      alert('Listing deleted');
      navigate('/classifieds');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete listing');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const shareToSocial = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(classified?.title || 'Check out this listing');
    const description = encodeURIComponent(classified?.description?.substring(0, 200) || '');

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
      case 'telegram':
        url = `https://t.me/share/url?url=${shareUrl}&text=${title}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${shareUrl}&title=${title}`;
        break;
      case 'pinterest':
        const imageUrl = encodeURIComponent(classified?.images?.[0] || '');
        url = `https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${imageUrl}&description=${title}`;
        break;
      case 'email':
        url = `mailto:?subject=${title}&body=${description}%20${shareUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: classified?.title || 'Check out this listing',
          text: classified?.description || '',
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
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

  const isOwner = user && classified && user.id === classified.created_by_id;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!classified) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Classified not found</p>
          <Link to="/classifieds">
            <GradientButton>Back to Listings</GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />
      <main className="relative flex-1 pt-[calc(128px+50px)] py-8">
        <div className="container mx-auto px-4 lg:px-8">
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
            <Link to="/classifieds" className="text-gray-400 hover:text-primary-400 transition-colors">
              Classifieds
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">{classified?.title || 'Ad'}</span>
          </nav>

          <GradientButton
              onClick={() => navigate('/classifieds/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Post Ad
            </GradientButton>
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

        {classified.status !== 'active' && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400">
            This listing is no longer active.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <GlowingCard>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      src={classified.created_by?.avatar_url}
                      alt={classified.created_by?.full_name || 'User'}
                      size="md"
                    />
                    <div>
                      <div className="text-sm text-gray-400">Posted by</div>
                      <div className="font-semibold text-white">
                        {classified.created_by?.full_name || 'Anonymous'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">{classified.title}</h1>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={classified.status} />
                        {classified.is_featured && (
                          <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                            FEATURED
                          </span>
                        )}
                        {classified.category && (
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/50 text-xs rounded flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {classified.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary-400">
                        {classified.price
                          ? `${classified.currency} ${classified.price.toLocaleString()}`
                          : ''}
                      </div>
                      {classified.condition && (
                        <div className="text-sm text-gray-400 capitalize">{classified.condition.replace('_', ' ')}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                    {classified.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{classified.city}, {classified.state}, {classified.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{classified.views_count} views</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <img
                      src={mainImage}
                      alt={classified.title}
                      className="w-full h-96 object-cover rounded-lg mb-4"
                    />
                    {classified.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {classified.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setMainImage(img)}
                            className={`rounded-lg overflow-hidden border-2 transition-all ${
                              mainImage === img
                                ? 'border-primary-500'
                                : 'border-transparent hover:border-gray-600'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${classified.title} ${idx + 1}`}
                              className="w-full h-20 object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">{classified.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="font-semibold text-white mb-3">Share Listing</h3>
                      <button
                        onClick={handleShare}
                        className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-magenta-500 hover:from-primary-600 hover:to-magenta-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>

                    {classified.status === 'active' && !isOwner && (
                      <div>
                        <h3 className="font-semibold text-white mb-3">Contact Seller</h3>
                        <div className="space-y-2">
                          {classified.contact_email && (
                            <a
                              href={`mailto:${classified.contact_email}?subject=${encodeURIComponent(`Inquiry about: ${classified.title}`)}`}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Email Seller
                            </a>
                          )}
                          {classified.contact_phone && (
                            <a
                              href={`tel:${classified.contact_phone}`}
                              className="flex items-center gap-2 px-4 py-2 border border-border hover:border-primary-500 text-white rounded-lg transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              {classified.contact_phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="text-sm text-gray-400">
                    Posted on {new Date(classified.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </GlowingCard>
          </div>

          <div className="lg:col-span-3">
            <div>
              {isOwner && (
                <GlowingCard className="mb-6">
                  <h3 className="font-semibold text-white mb-4">Manage Listing</h3>
                  <div className="space-y-2">
                    <Link to={`/classifieds/${id}/edit`}>
                      <button className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit Listing
                      </button>
                    </Link>
                    {classified.status === 'active' && (
                      <button
                        onClick={handleMarkAsSold}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Sold
                      </button>
                    )}
                    <button
                      onClick={handleArchive}
                      className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </GlowingCard>
              )}

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
        </div>

        {relatedClassifieds.length > 0 && (
          <div className="mt-16 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {classified?.category_id ? 'More from this Category' : 'More Listings'}
                </h2>
                <p className="text-gray-400 text-sm">Explore other available listings</p>
              </div>
              <Link
                to="/classifieds"
                className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                View All
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedClassifieds.map((item) => (
                <ClassifiedCard key={item.id} classified={item} />
              ))}
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

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Share this listing</h3>

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
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#1DA1F2] hover:bg-[#1A8CD8] transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-xs text-white">Twitter</span>
              </button>

              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] transition-colors"
                title="Share on WhatsApp"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-xs text-white">WhatsApp</span>
              </button>

              <button
                onClick={() => shareToSocial('linkedin')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#0A66C2] hover:bg-[#095196] transition-colors"
                title="Share on LinkedIn"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-xs text-white">LinkedIn</span>
              </button>

              <button
                onClick={() => shareToSocial('telegram')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#0088CC] hover:bg-[#0077B5] transition-colors"
                title="Share on Telegram"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-xs text-white">Telegram</span>
              </button>

              <button
                onClick={() => shareToSocial('reddit')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#FF4500] hover:bg-[#E03D00] transition-colors"
                title="Share on Reddit"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                <span className="text-xs text-white">Reddit</span>
              </button>

              <button
                onClick={() => shareToSocial('pinterest')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#BD081C] hover:bg-[#A00717] transition-colors"
                title="Share on Pinterest"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                </svg>
                <span className="text-xs text-white">Pinterest</span>
              </button>

              <button
                onClick={() => shareToSocial('email')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                title="Share via Email"
              >
                <Mail className="w-6 h-6 text-white" />
                <span className="text-xs text-white">Email</span>
              </button>
            </div>

            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full mb-4 px-4 py-2 border border-border hover:border-primary-500 text-white rounded-lg transition-colors"
              >
                Share via...
              </button>
            )}

            <button
              onClick={copyToClipboard}
              className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
