import { X } from 'lucide-react';
import type { ClassifiedFilters } from '../../types/classifieds';
import { Input } from '../Input';

interface ClassifiedFiltersProps {
  filters: ClassifiedFilters;
  onFiltersChange: (filters: ClassifiedFilters) => void;
  onClear: () => void;
}

export function ClassifiedFilters({ filters, onFiltersChange, onClear }: ClassifiedFiltersProps) {
  const updateFilter = (key: keyof ClassifiedFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const minPrice = filters.minPrice || 0;
  const maxPrice = filters.maxPrice || 10000;

  const handleMinPriceChange = (value: number) => {
    updateFilter('minPrice', value > 0 ? value : undefined);
  };

  const handleMaxPriceChange = (value: number) => {
    updateFilter('maxPrice', value < 10000 ? value : undefined);
  };

  const hasActiveFilters = !!(
    filters.city ||
    filters.state ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.featuredOnly
  );

  return (
    <div className="glass-border rounded-lg p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <div className="space-y-2">
          <Input
            placeholder="City"
            value={filters.city || ''}
            onChange={(e) => updateFilter('city', e.target.value || undefined)}
          />
          <Input
            placeholder="State"
            value={filters.state || ''}
            onChange={(e) => updateFilter('state', e.target.value || undefined)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Price Range
        </label>
        <div className="space-y-4">
          <div className="px-2">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>${minPrice.toLocaleString()}</span>
              <span>${maxPrice.toLocaleString()}</span>
            </div>
            <div className="relative h-2 bg-surface rounded-lg">
              <div
                className="absolute h-2 bg-primary-500 rounded-lg"
                style={{
                  left: `${(minPrice / 10000) * 100}%`,
                  right: `${100 - (maxPrice / 10000) * 100}%`,
                }}
              />
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(Number(e.target.value))}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer accent-primary-500"
                style={{ zIndex: minPrice > maxPrice - 1000 ? 5 : 3 }}
              />
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer accent-primary-500"
                style={{ zIndex: 4 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.featuredOnly || false}
            onChange={(e) => updateFilter('featuredOnly', e.target.checked || undefined)}
            className="rounded border-gray-600 bg-surface text-primary-500 focus:ring-primary-500"
          />
          Featured Only
        </label>
      </div>
    </div>
  );
}
