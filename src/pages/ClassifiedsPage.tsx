import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Home, ChevronRight, ArrowRight, TrendingUp, Star, Clock, Plus, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getClassifieds } from '../lib/classifieds';
import { ClassifiedCard } from '../components/classifieds/ClassifiedCard';
import { OldStyleClassifiedCard } from '../components/classifieds/OldStyleClassifiedCard';
import { HouseAds } from '../components/ads/HouseAds';
import { GradientButton } from '../components/GradientButton';
import { useAuthStore } from '../store/authStore';
import type { Classified } from '../types/classifieds';

export function ClassifiedsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [topClassifieds, setTopClassifieds] = useState<Classified[]>([]);
  const [featuredClassifieds, setFeaturedClassifieds] = useState<Classified[]>([]);
  const [latestClassifieds, setLatestClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllClassifieds();
  }, []);

  const fetchAllClassifieds = async () => {
    try {
      setLoading(true);

      const [topResult, featuredResult, latestResult] = await Promise.all([
        getClassifieds({ topOnly: true, sort: 'most_viewed', pageSize: 6, status: 'active' }),
        getClassifieds({ featuredOnly: true, pageSize: 8, status: 'active' }),
        getClassifieds({ sort: 'newest', pageSize: 8, status: 'active', excludeTopAndFeatured: true }),
      ]);

      setTopClassifieds(topResult.data);
      setFeaturedClassifieds(featuredResult.data);
      setLatestClassifieds(latestResult.data);
    } catch (error) {
      console.error('Error fetching classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative pt-[calc(128px+50px)] pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
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

            <div className="flex items-center gap-3">
              {user && (
                <Link to="/classifieds/my-listings">
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-all text-sm border border-slate-700">
                    <Package className="w-4 h-4" />
                    My Listings
                  </button>
                </Link>
              )}
              <GradientButton
                onClick={() => navigate('/classifieds/new')}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Post Ad
              </GradientButton>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HouseAds page="CLASSIFIEDS" placement="top-left" limit={10} />
            <HouseAds page="CLASSIFIEDS" placement="top-right" limit={10} />
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <p className="mt-4 text-gray-400">Loading classifieds...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {topClassifieds.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-white">Top Classifieds</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topClassifieds.map((classified) => (
                          <ClassifiedCard key={classified.id} classified={classified} />
                        ))}
                      </div>
                    </section>
                  )}

                  {featuredClassifieds.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-white">Featured Classifieds</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuredClassifieds.map((classified, index) => (
                          <OldStyleClassifiedCard
                            key={classified.id}
                            classified={classified}
                            variant="multicolor"
                            index={index}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {latestClassifieds.length > 0 && (
                    <section>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-white">Latest Classifieds</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {latestClassifieds.map((classified) => (
                          <OldStyleClassifiedCard
                            key={classified.id}
                            classified={classified}
                            variant="single"
                          />
                        ))}
                      </div>

                      <div className="flex justify-center mt-8">
                        <Link
                          to="/classifieds/all"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary rounded-xl font-semibold text-white hover:shadow-glow transition-all duration-300"
                        >
                          View All Classifieds
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="mb-6">
                <h3 className="text-xl font-heading font-bold text-white mb-1">
                  Sponsored Ads
                </h3>
                <div className="h-0.5 w-28 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
              </div>

              <div className="space-y-4">
                <HouseAds page="CLASSIFIEDS" placement="right" limit={10} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <HouseAds page="CLASSIFIEDS" placement="bottom-left" limit={10} />
          </div>
          <div className="space-y-4">
            <HouseAds page="CLASSIFIEDS" placement="bottom-right" limit={10} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
