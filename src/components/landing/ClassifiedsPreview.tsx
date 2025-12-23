import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getClassifieds } from '../../lib/classifieds';
import type { Classified } from '../../types/classifieds';

export function ClassifiedsPreview() {
  const navigate = useNavigate();
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadClassifieds();
  }, []);

  const loadClassifieds = async () => {
    try {
      const result = await getClassifieds({
        page: 1,
        pageSize: 20,
        sort: 'newest'
      });
      setClassifieds(result.data);
    } catch (error) {
      console.error('Error loading classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 2));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(classifieds.length - 2, prev + 2));
  };

  const visibleClassifieds = classifieds.slice(currentIndex, currentIndex + 2);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-white">Trending Classifieds</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass glass-border rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (classifieds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-white">Trending Classifieds</h2>
        </div>
        <div className="glass glass-border rounded-xl p-8 text-center">
          <p className="text-gray-400">No classifieds available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-white">Trending Classifieds</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg border border-border bg-surface disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary-500 hover:bg-primary-500/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex >= classifieds.length - 2}
            className="p-2 rounded-lg border border-border bg-surface disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary-500 hover:bg-primary-500/10 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleClassifieds.map((item) => (
          <div
            key={item.id}
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
        ))}
      </div>
    </div>
  );
}
