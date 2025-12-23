import { useEffect, useState } from 'react';
import { Search, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { fetchTemplates, fetchTemplateCategories } from '../lib/templates';
import type { TemplateWithCategory, TemplateCategory } from '../types/templates';

interface EventThemePickerProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: TemplateWithCategory | null) => void;
}

export function EventThemePicker({
  selectedTemplateId,
  onSelectTemplate,
}: EventThemePickerProps) {
  const [templates, setTemplates] = useState<TemplateWithCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateWithCategory[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTemplates();
    } else {
      setTemplates([]);
      setFilteredTemplates([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    applyFilters();
  }, [templates, searchQuery]);

  async function loadCategories() {
    try {
      setLoading(true);
      const categoriesData = await fetchTemplateCategories(true);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    try {
      setLoading(true);
      const templatesData = await fetchTemplates({ activeOnly: true });
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    if (templates.length === 0) {
      setFilteredTemplates([]);
      return;
    }

    let filtered = [...templates];

    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category_id === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query),
      );
    }

    setFilteredTemplates(filtered);
  }

  function handleSelect(template: TemplateWithCategory) {
    if (selectedTemplateId === template.id) {
      // clicking the same one again clears selection
      onSelectTemplate(null);
    } else {
      // send full object (with editable_fields etc.)
      onSelectTemplate(template);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 mt-2 text-sm">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTemplateId && (
        <button
          type="button"
          onClick={() => onSelectTemplate(null)}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          Clear selection
        </button>
      )}

      {!selectedCategory ? (
        <div className="text-center py-12 glass glass-border rounded-2xl">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            Please select a category to view templates
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 glass glass-border rounded-2xl">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {searchQuery
              ? 'No templates match your search'
              : 'No templates available in this category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleSelect(template)}
                className={`group relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-primary-500 shadow-lg shadow-primary-500/50 scale-105'
                    : 'ring-1 ring-border hover:ring-2 hover:ring-primary-400 hover:scale-102'
                }`}
              >
                <img
                  src={template.thumbnail_url || template.image_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />

                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-300 text-xs">
                      {template.category?.name}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div
                  className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium transition-opacity ${
                    isSelected
                      ? 'bg-primary-500 text-white opacity-100'
                      : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
