import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface SubCategory {
  id: string;
  name: string;
  category_id: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon_emoji: string | null;
  badge: 'HOT' | 'NEW' | null;
  gradient_from: string;
  gradient_to: string;
  subcategories: string[];
}

export function BuddyServicesPreview() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const [categoriesResponse, subCategoriesResponse] = await Promise.all([
        supabase
          .from('buddy_service_categories')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('buddy_service_subcategories')
          .select('*')
          .eq('is_active', true)
          .order('name')
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (subCategoriesResponse.error) throw subCategoriesResponse.error;

      const categoriesWithSubs = (categoriesResponse.data || []).map(cat => ({
        ...cat,
        subcategories: (subCategoriesResponse.data || [])
          .filter((sub: SubCategory) => sub.category_id === cat.id)
          .map((sub: SubCategory) => sub.name)
      }));

      // Shuffle and take 6 random categories
      const shuffled = categoriesWithSubs.sort(() => Math.random() - 0.5);
      setCategories(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-white">Buddy Services</h2>
            <p className="text-sm text-gray-400">Discover local businesses & professionals</p>
          </div>
        </div>
        
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading services...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => {
            const featured = category.badge === 'HOT';
            return (
              <div
                key={category.id}
                onClick={() => navigate('/buddy-services')}
                className="group relative glass glass-border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden"
                style={{
                  background: featured
                    ? 'rgba(16, 21, 38, 0.9)'
                    : 'rgba(16, 21, 38, 0.6)',
                  borderColor: featured
                    ? 'rgba(251, 146, 60, 0.5)'
                    : 'rgba(77, 184, 255, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(251, 146, 60, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.8)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = featured
                    ? 'rgba(251, 146, 60, 0.5)'
                    : 'rgba(77, 184, 255, 0.2)';
                }}
              >
                {/* Badge */}
                {category.badge && (
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-white text-[10px] font-bold tracking-wide shadow-lg ${
                    category.badge === 'HOT'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}>
                    {category.badge}
                  </div>
                )}

                {/* Gradient glow effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(251, 146, 60, 0.5), rgba(249, 115, 22, 0.5))`
                  }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: `linear-gradient(135deg, ${category.gradient_from || '#3b82f6'}, ${category.gradient_to || '#8b5cf6'})`
                    }}
                  >
                    <span className="text-2xl">{category.icon_emoji || '📋'}</span>
                  </div>

                  {/* Category name */}
                  <h3 className="text-white font-bold text-base mb-2 group-hover:text-orange-400 transition-colors">
                    {category.name}
                  </h3>

                  {/* Subcategories */}
                  {category.subcategories.length > 0 ? (
                    <div className="space-y-1">
                      {category.subcategories.slice(0, 3).map((sub, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-orange-500/60" />
                          <span className="text-gray-400 text-xs hover:text-orange-400 transition-colors line-clamp-1">
                            {sub}
                          </span>
                        </div>
                      ))}
                      {category.subcategories.length > 3 && (
                        <div className="text-orange-500 text-xs font-semibold mt-2">
                          +{category.subcategories.length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">Browse services</p>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4 text-orange-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA banner */}
      <div className="relative glass glass-border rounded-2xl p-6 overflow-hidden" style={{ background: 'rgba(16, 21, 38, 0.6)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Looking for a specific service?</h3>
            <p className="text-gray-400 text-sm">Browse our complete directory of local businesses and professionals</p>
          </div>
          <button
            onClick={() => navigate('/buddy-services')}
            className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-orange-500/30 text-orange-400 font-semibold text-sm hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/30"
          >
            View All Services
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
