import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Home, ChevronRight, TrendingUp, Star, Clock, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getClassifieds } from '../lib/classifieds';
import { ClassifiedCard } from '../components/classifieds/ClassifiedCard';
import { OldStyleClassifiedCard } from '../components/classifieds/OldStyleClassifiedCard';
import { HouseAds } from '../components/ads/HouseAds';
import type { Classified } from '../types/classifieds';
import { GradientButton } from '../components/GradientButton';

export function AllClassifiedsPage() {
  const navigate = useNavigate();
  const [topClassifieds, setTopClassifieds] = useState<Classified[]>([]);
  const [featuredClassifieds, setFeaturedClassifieds] = useState<Classified[]>([]);
  const [latestClassifieds, setLatestClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topPage, setTopPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [latestPage, setLatestPage] = useState(1);
  const [hasMoreTop, setHasMoreTop] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const [hasMoreLatest, setHasMoreLatest] = useState(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchInitialClassifieds();
  }, []);

  const fetchInitialClassifieds = async () => {
    try {
      setLoading(true);

      const [topResult, featuredResult, latestResult] = await Promise.all([
        getClassifieds({ topOnly: true, sort: 'most_viewed', pageSize: PAGE_SIZE, page: 1, status: 'active' }),
        getClassifieds({ featuredOnly: true, pageSize: PAGE_SIZE, page: 1, status: 'active' }),
        getClassifieds({ sort: 'newest', pageSize: PAGE_SIZE, page: 1, status: 'active', excludeTopAndFeatured: true }),
      ]);

      setTopClassifieds(topResult.data);
      setFeaturedClassifieds(featuredResult.data);
      setLatestClassifieds(latestResult.data);

      setHasMoreTop(topResult.data.length === PAGE_SIZE);
      setHasMoreFeatured(featuredResult.data.length === PAGE_SIZE);
      setHasMoreLatest(latestResult.data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      setLoadingMore(true);

      const nextTopPage = topPage + 1;
      const nextFeaturedPage = featuredPage + 1;
      const nextLatestPage = latestPage + 1;

      const [topResult, featuredResult, latestResult] = await Promise.all([
        hasMoreTop
          ? getClassifieds({ topOnly: true, sort: 'most_viewed', pageSize: PAGE_SIZE, page: nextTopPage, status: 'active' })
          : { data: [], total: 0, page: topPage, pageSize: PAGE_SIZE, totalPages: 0 },
        hasMoreFeatured
          ? getClassifieds({ featuredOnly: true, pageSize: PAGE_SIZE, page: nextFeaturedPage, status: 'active' })
          : { data: [], total: 0, page: featuredPage, pageSize: PAGE_SIZE, totalPages: 0 },
        hasMoreLatest
          ? getClassifieds({ sort: 'newest', pageSize: PAGE_SIZE, page: nextLatestPage, status: 'active', excludeTopAndFeatured: true })
          : { data: [], total: 0, page: latestPage, pageSize: PAGE_SIZE, totalPages: 0 },
      ]);

      if (hasMoreTop && topResult.data.length > 0) {
        setTopClassifieds((prev) => [...prev, ...topResult.data]);
        setTopPage(nextTopPage);
        setHasMoreTop(topResult.data.length === PAGE_SIZE);
      } else {
        setHasMoreTop(false);
      }

      if (hasMoreFeatured && featuredResult.data.length > 0) {
        setFeaturedClassifieds((prev) => [...prev, ...featuredResult.data]);
        setFeaturedPage(nextFeaturedPage);
        setHasMoreFeatured(featuredResult.data.length === PAGE_SIZE);
      } else {
        setHasMoreFeatured(false);
      }

      if (hasMoreLatest && latestResult.data.length > 0) {
        setLatestClassifieds((prev) => [...prev, ...latestResult.data]);
        setLatestPage(nextLatestPage);
        setHasMoreLatest(latestResult.data.length === PAGE_SIZE);
      } else {
        setHasMoreLatest(false);
      }
    } catch (error) {
      console.error('Error loading more classifieds:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMoreData = hasMoreTop || hasMoreFeatured || hasMoreLatest;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative pt-[calc(128px+50px)] pb-12 px-4 lg:px-8">
        <div className="container mx-auto">
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
              <Link to="/classifieds" className="text-gray-400 hover:text-primary-400 transition-colors">
                Classifieds
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">All Classifieds</span>
            </nav>

            <GradientButton
              onClick={() => navigate('/classifieds/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Post Ad
            </GradientButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <HouseAds page="CLASSIFIEDS" placement="top-left" limit={10} />
            <HouseAds page="CLASSIFIEDS" placement="top-right" limit={10} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  <p className="mt-4 text-gray-400">Loading classifieds...</p>
                </div>
              ) : (
                <>
                  {topClassifieds.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-white">Top Classifieds</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {topClassifieds.map((classified) => (
                          <ClassifiedCard key={classified.id} classified={classified} />
                        ))}
                      </div>
                    </div>
                  )}

                  {featuredClassifieds.length > 0 && (
                    <div className="mb-12">
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
                    </div>
                  )}

                  {latestClassifieds.length > 0 && (
                    <div className="mb-8">
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
                    </div>
                  )}

                  {hasMoreData && (
                    <div className="flex justify-center">
                      <GradientButton
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-8 py-3"
                      >
                        {loadingMore ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </GradientButton>
                    </div>
                  )}
                </>
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
