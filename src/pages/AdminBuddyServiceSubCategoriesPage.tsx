import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';

interface BuddyServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon_emoji: string;
}

interface BuddyServiceSubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubCategoryWithCategory extends BuddyServiceSubCategory {
  category_name?: string;
  category_emoji?: string;
}

interface SubCategoryFormData {
  category_id: string;
  name: string;
}

interface AdminUser {
  id: string;
  username: string;
  full_name?: string;
}

export default function AdminBuddyServiceSubCategoriesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<BuddyServiceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryWithCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubCategoryFormData>({
    category_id: '',
    name: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (!storedUser) {
      navigate('/master-admin/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setAdminUser(user);
    } catch (err) {
      console.error('Error parsing admin user:', err);
      navigate('/master-admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (adminUser) {
      loadCategories();
      loadSubCategories();
    }
  }, [adminUser]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('buddy_service_categories')
        .select('id, name, slug, icon_emoji')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    }
  }

  async function loadSubCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buddy_service_subcategories')
        .select(`
          *,
          buddy_service_categories!inner(name, icon_emoji)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        category_id: item.category_id,
        name: item.name,
        slug: item.slug,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        category_name: item.buddy_service_categories?.name,
        category_emoji: item.buddy_service_categories?.icon_emoji
      }));

      setSubCategories(formatted);
    } catch (err) {
      console.error('Error loading sub-categories:', err);
      setError('Failed to load sub-categories');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSubCategory(null);
    setFormData({
      category_id: '',
      name: ''
    });
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(subCategory: SubCategoryWithCategory) {
    setEditingSubCategory(subCategory);
    setFormData({
      category_id: subCategory.category_id,
      name: subCategory.name
    });
    setError('');
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      const slug = generateSlug(formData.name);
      const payload: any = {
        category_id: formData.category_id,
        name: formData.name.trim(),
        slug,
        is_active: true
      };

      if (editingSubCategory) {
        const { error } = await supabase
          .from('buddy_service_subcategories')
          .update(payload)
          .eq('id', editingSubCategory.id);

        if (error) throw error;
        setSuccessMessage('Sub-category updated successfully!');
      } else {
        const { error } = await supabase
          .from('buddy_service_subcategories')
          .insert([payload]);

        if (error) throw error;
        setSuccessMessage('Sub-category created successfully!');
      }

      setIsModalOpen(false);
      loadSubCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving sub-category:', err);
      setError(err.message || 'Failed to save sub-category');
    }
  }

  async function handleToggleActive(subCategory: SubCategoryWithCategory) {
    try {
      const { error } = await supabase
        .from('buddy_service_subcategories')
        .update({ is_active: !subCategory.is_active })
        .eq('id', subCategory.id);

      if (error) throw error;
      setSuccessMessage(`Sub-category ${subCategory.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadSubCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error toggling sub-category:', err);
      setError(err.message || 'Failed to toggle sub-category status');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('buddy_service_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMessage('Sub-category deleted successfully!');
      loadSubCategories();
      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting sub-category:', err);
      setError(err.message || 'Failed to delete sub-category');
    }
  }

  const groupedSubCategories = subCategories.reduce((acc, subCat) => {
    const categoryName = subCat.category_name || 'Unknown';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(subCat);
    return acc;
  }, {} as Record<string, SubCategoryWithCategory[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/master-admin')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-white">Buddy Service Sub-Categories</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/80 text-sm">{adminUser?.full_name || adminUser?.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">All Sub-Categories ({subCategories.length})</h2>
          <GradientButton onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Sub-Category
          </GradientButton>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading sub-categories...</p>
            </div>
          </div>
        ) : Object.keys(groupedSubCategories).length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No sub-categories yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedSubCategories)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([categoryName, subCats]) => {
                const categoryEmoji = subCats[0]?.category_emoji;
                return (
                  <div key={categoryName}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                      {categoryEmoji && <span className="text-2xl">{categoryEmoji}</span>}
                      {categoryName}
                      <span className="text-sm font-normal text-white/60">({subCats.length})</span>
                    </h3>
                    <div className="grid gap-4">
                      {subCats.map((subCategory) => (
                        <GlowingCard key={subCategory.id} className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-lg font-semibold text-white">{subCategory.name}</h4>
                                {!subCategory.is_active && (
                                  <span className="px-2 py-1 text-xs font-semibold bg-gray-500/30 text-gray-300 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/40">Slug: {subCategory.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleActive(subCategory)}
                                className={`p-2 rounded-lg transition-colors ${
                                  subCategory.is_active
                                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                                    : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300'
                                }`}
                                title={subCategory.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {subCategory.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => openEditModal(subCategory)}
                                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === subCategory.id ? (
                                <>
                                  <button
                                    onClick={() => handleDelete(subCategory.id)}
                                    className="px-3 py-2 bg-red-500/30 hover:bg-red-500/40 text-red-300 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg text-xs transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(subCategory.id)}
                                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </GlowingCard>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubCategory ? 'Edit Sub-Category' : 'Create Sub-Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Select Category *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="" className="bg-slate-800">Select a category...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-slate-800">
                  {category.icon_emoji} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Sub-Category Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Plumbing, Electrical, etc."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <GradientButton type="submit" className="flex-1">
              {editingSubCategory ? 'Update' : 'Create'}
            </GradientButton>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
