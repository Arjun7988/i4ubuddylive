import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getClassifieds } from '../lib/classifieds';
import type { Classified, ClassifiedFilters } from '../types/classifieds';
import { ClassifiedCard } from '../components/classifieds/ClassifiedCard';
import { ClassifiedFilters as FiltersComponent } from '../components/classifieds/ClassifiedFilters';
import { ClassifiedsBanner } from '../components/classifieds/ClassifiedsBanner';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { AdSenseAd } from '../components/ads/AdSenseAd';
import { ADSENSE_SLOTS } from '../config/adsense';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function ClassifiedsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClassifiedFilters>({
    page: 1,
    pageSize: 12,
    sort: 'newest',
  });

  useEffect(() => {
    loadClassifieds();
  }, [filters]);

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

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, pageSize: 12, sort: filters.sort });
  };

  const handlePostClick = () => {
    if (!user) {
      alert('Please log in to post a listing');
      navigate('/auth');
    } else {
      navigate('/classifieds/new');
    }
  };

  const totalPages = Math.ceil(total / (filters.pageSize || 12));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />
      <main className="relative flex-1 pt-32 max-w-7xl mx-auto px-4 py-8 w-full">
        <ClassifiedsBanner />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Browse Listings</h1>
            <p className="text-gray-400">Find what you're looking for</p>
          </div>
          <GradientButton onClick={handlePostClick} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Post a Listing
          </GradientButton>
        </div>

        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search classifieds..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.sort || 'newest'}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as any, page: 1 })}
              className="md:w-48"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="most_viewed">Most Viewed</option>
            </Select>
          </div>
        </div>

        <AdSenseAd slotId={ADSENSE_SLOTS.LIST_TOP} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="hidden lg:block">
            <FiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onClear={handleClearFilters}
            />
            <AdSenseAd slotId={ADSENSE_SLOTS.LIST_SIDEBAR} className="mt-6" />
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-border rounded-lg p-6 h-96 animate-pulse bg-surface/50" />
                ))}
              </div>
            ) : classifieds.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-gray-400 mb-4">No classifieds found</p>
                {user && (
                  <Link to="/classifieds/new">
                    <GradientButton>Post Your First Listing</GradientButton>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-400">
                  Showing {classifieds.length} of {total} listings
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {classifieds.map((classified, index) => (
                    <>
                      <ClassifiedCard key={classified.id} classified={classified} />
                      {(index + 1) % 4 === 0 && (
                        <div key={`ad-${index}`} className="md:col-span-2 xl:col-span-3">
                          <AdSenseAd slotId={ADSENSE_SLOTS.LIST_INLINE} />
                        </div>
                      )}
                    </>
                  ))}
                </div>

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
          </div>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
