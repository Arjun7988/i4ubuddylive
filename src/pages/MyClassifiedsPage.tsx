import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Edit, Trash2, Plus, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Home, ChevronRight, Eye, DollarSign } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { Classified } from '../types/classifieds';
import { useAuthStore } from '../store/authStore';
import { StatusBadge } from '../components/classifieds/StatusBadge';

const PAGE_KEY = "MY_CLASSIFIEDS";

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

export function MyClassifiedsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);

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

      const sortedMapped = mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

      const topLeft = sortedMapped.filter((ad) => ad.placement === 'TOP_LEFT');
      const topRight = sortedMapped.filter((ad) => ad.placement === 'TOP_RIGHT');
      const footerLeft = sortedMapped.filter((ad) => ad.placement === 'FOOTER_LEFT');
      const footerRight = sortedMapped.filter((ad) => ad.placement === 'FOOTER_RIGHT');
      const right = sortedMapped.filter((ad) => ad.placement === 'RIGHT');

      setTopLeftAds(topLeft);
      setTopRightAds(topRight);
      setFooterLeftAds(footerLeft);
      setFooterRightAds(footerRight);
      setRightAds(right);
    };

    loadPageAds();
  }, [userState, userCity, userPincode]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadMyClassifieds();
  }, [user]);

  const loadMyClassifieds = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('classifieds')
      .select(`
        *,
        category:classified_categories(id, name, slug)
      `)
      .eq('created_by_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClassifieds(data);
    }
    setLoading(false);
  };

  const handleDelete = async (classifiedId: string) => {
    if (!confirm('Are you sure you want to delete this classified?')) return;

    const { error } = await supabase.from('classifieds').delete().eq('id', classifiedId);

    if (!error) {
      setClassifieds(classifieds.filter((c) => c.id !== classifiedId));
    } else {
      alert('Failed to delete classified');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAdClick = (ad: PageAd) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="relative pt-[calc(128px+50px)] pb-12 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <Link to="/classifieds" className="text-gray-400 hover:text-primary-400 transition-colors">
                Classifieds
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">My Listings</span>
            </nav>

            <button
              onClick={() => navigate('/classifieds/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Post Ad
            </button>
          </div>

          {(topLeftAds.length > 0 || topRightAds.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-4">
                {topLeftAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {topRightAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 mt-4">Loading your listings...</p>
                </div>
              ) : classifieds.length === 0 ? (
                <div className="text-center py-12 bg-[#111827] border border-slate-800 rounded-2xl">
                  <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">You haven't posted any classifieds yet</p>
                  <p className="text-gray-500 text-sm mb-6">
                    Share your items with the community
                  </p>
                  <button
                    onClick={() => navigate('/classifieds/new')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Post Your First Classified
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {classifieds.map((classified) => (
                    <div
                      key={classified.id}
                      className="bg-[#111827] border border-slate-800 rounded-2xl p-6 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex gap-6">
                        {classified.images && classified.images[0] && (
                          <div className="flex-shrink-0">
                            <img
                              src={classified.images[0]}
                              alt={classified.title}
                              className="w-32 h-32 object-cover rounded-xl"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {classified.title}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <StatusBadge status={classified.status} />
                                {classified.is_featured_classified && (
                                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                                    Featured
                                  </span>
                                )}
                                {classified.is_top_classified && (
                                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                                    Top
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/classifieds/${classified.id}/edit`)}
                                className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(classified.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-4">
                              {classified.price && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-semibold text-primary-400">
                                    {classified.currency} {classified.price.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{classified.views_count || 0} views</span>
                              </div>
                            </div>
                            {(classified.city || classified.state) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {[classified.city, classified.state].filter(Boolean).join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>Posted {formatDate(classified.created_at)}</span>
                            </div>
                          </div>

                          <p className="text-gray-500 mt-3 line-clamp-2">{classified.description}</p>

                          {classified.status === 'pending' && (
                            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-sm text-yellow-400">
                                Your listing is pending approval. It will be visible once reviewed.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
      </main>

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

      <Footer />
    </div>
  );
}
