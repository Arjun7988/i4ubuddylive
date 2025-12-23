import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Shield, ArrowLeft, LogOut, Eye, EyeOff } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { GlowingCard } from '../components/GlowingCard';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

export type BuddyServiceCategory = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  icon_emoji: string | null;
  badge: "HOT" | "NEW" | null;
  gradient_from: string | null;
  gradient_to: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

interface CategoryFormData {
  name: string;
  slug: string;
  subtitle: string;
  icon_emoji: string;
  badge: "HOT" | "NEW" | "";
  gradient_from: string;
  gradient_to: string;
  is_active: boolean;
}

const SERVICE_ICONS = [
  { emoji: '🏠', label: 'Home' },
  { emoji: '🚗', label: 'Car/Auto' },
  { emoji: '💪', label: 'Fitness' },
  { emoji: '📚', label: 'Education' },
  { emoji: '🎉', label: 'Events' },
  { emoji: '💼', label: 'Business' },
  { emoji: '🔧', label: 'Repair' },
  { emoji: '🎨', label: 'Arts/Design' },
  { emoji: '💻', label: 'Tech/IT' },
  { emoji: '🏥', label: 'Health' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '🍔', label: 'Food' },
  { emoji: '📷', label: 'Photography' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🏋️', label: 'Gym/Sports' },
  { emoji: '🧹', label: 'Cleaning' },
  { emoji: '🌱', label: 'Gardening' },
  { emoji: '🐕', label: 'Pet Services' },
  { emoji: '👶', label: 'Childcare' },
  { emoji: '👵', label: 'Elderly Care' },
  { emoji: '🔑', label: 'Real Estate' },
  { emoji: '💇', label: 'Beauty/Salon' },
  { emoji: '👔', label: 'Fashion' },
  { emoji: '📱', label: 'Mobile' },
  { emoji: '🏗️', label: 'Construction' },
  { emoji: '⚡', label: 'Electrical' },
  { emoji: '💧', label: 'Plumbing' },
  { emoji: '🎭', label: 'Entertainment' },
  { emoji: '📝', label: 'Writing' },
  { emoji: '🗣️', label: 'Speaking' },
  { emoji: '🚚', label: 'Moving/Transport' },
  { emoji: '📦', label: 'Delivery' },
  { emoji: '🛒', label: 'Shopping' },
  { emoji: '💰', label: 'Financial' },
  { emoji: '⚖️', label: 'Legal' },
  { emoji: '🔒', label: 'Security' },
  { emoji: '🌍', label: 'Global' },
  { emoji: '🎓', label: 'Training' },
  { emoji: '🧑‍🏫', label: 'Teaching' },
  { emoji: '🧑‍⚕️', label: 'Medical' },
];

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminBuddyServiceCategoriesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<BuddyServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BuddyServiceCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    subtitle: '',
    icon_emoji: '',
    badge: '',
    gradient_from: '#3b82f6',
    gradient_to: '#8b5cf6',
    is_active: true,
    sort_order: 0
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    setAdminUser(JSON.parse(userStr));
    loadCategories();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  async function loadCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('buddy_service_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      subtitle: '',
      icon_emoji: '',
      badge: '',
      gradient_from: '#3b82f6',
      gradient_to: '#8b5cf6',
      is_active: true
    });
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(category: BuddyServiceCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      subtitle: category.subtitle || '',
      icon_emoji: category.icon_emoji || '',
      badge: category.badge || '',
      gradient_from: category.gradient_from || '#3b82f6',
      gradient_to: category.gradient_to || '#8b5cf6',
      is_active: category.is_active
    });
    setError('');
    setIsModalOpen(true);
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      const payload: any = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        subtitle: formData.subtitle.trim() || null,
        icon_emoji: formData.icon_emoji.trim() || null,
        badge: formData.badge || null,
        gradient_from: formData.gradient_from || null,
        gradient_to: formData.gradient_to || null,
        is_active: formData.is_active
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('buddy_service_categories')
          .update(payload)
          .eq('id', editingCategory.id);

        if (error) throw error;
        setSuccessMessage('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('buddy_service_categories')
          .insert(payload);

        if (error) throw error;
        setSuccessMessage('Category created successfully');
      }

      setIsModalOpen(false);
      await loadCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
    }
  }

  async function handleToggleActive(category: BuddyServiceCategory) {
    try {
      const { error } = await supabase
        .from('buddy_service_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      setSuccessMessage(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`);
      await loadCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error toggling category:', err);
      setError(err.message || 'Failed to toggle category status');
    }
  }

  async function handleDelete(categoryId: string) {
    try {
      const { error } = await supabase
        .from('buddy_service_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      setSuccessMessage('Category deleted successfully');
      setDeleteConfirm(null);
      await loadCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/master-admin/dashboard"
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Buddy Service Categories</h1>
                  <p className="text-sm text-white/60">Manage service categories</p>
                </div>
              </div>
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
          <h2 className="text-2xl font-bold text-white">All Categories ({categories.length})</h2>
          <GradientButton onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </GradientButton>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <GlowingCard key={category.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {category.icon_emoji && (
                    <div className="text-4xl">{category.icon_emoji}</div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                      {category.badge && (
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            category.badge === 'HOT'
                              ? 'bg-red-500 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {category.badge}
                        </span>
                      )}
                      {!category.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-500/30 text-gray-300 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 mb-2">{category.subtitle}</p>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      <span>Slug: {category.slug}</span>
                    </div>
                    {(category.gradient_from || category.gradient_to) && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/40">Gradient:</span>
                        <div
                          className="h-6 w-24 rounded"
                          style={{
                            background: `linear-gradient(to right, ${category.gradient_from}, ${category.gradient_to})`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`p-2 rounded-lg transition-colors ${
                      category.is_active
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                        : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300'
                    }`}
                    title={category.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deleteConfirm === category.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(category.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </GlowingCard>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 text-white/60">
              No categories found. Create one to get started!
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Home Services"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Slug (Auto-generated)
            </label>
            <Input
              type="text"
              value={formData.slug}
              readOnly
              placeholder="Auto-generated from name"
              className="bg-white/5 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Subtitle
            </label>
            <Input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g., Find trusted professionals for your home"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Icon Emoji
            </label>
            <select
              value={formData.icon_emoji}
              onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="" className="bg-slate-800">None</option>
              {SERVICE_ICONS.map((icon) => (
                <option key={icon.emoji} value={icon.emoji} className="bg-slate-800">
                  {icon.emoji} {icon.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Badge
            </label>
            <select
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="" className="bg-slate-800">None</option>
              <option value="HOT" className="bg-slate-800">HOT</option>
              <option value="NEW" className="bg-slate-800">NEW</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Gradient From
              </label>
              <Input
                type="color"
                value={formData.gradient_from}
                onChange={(e) => setFormData({ ...formData, gradient_from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Gradient To
              </label>
              <Input
                type="color"
                value={formData.gradient_to}
                onChange={(e) => setFormData({ ...formData, gradient_to: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-white/80">
              Active
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <GradientButton type="submit" className="flex-1">
              {editingCategory ? 'Update' : 'Create'}
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
