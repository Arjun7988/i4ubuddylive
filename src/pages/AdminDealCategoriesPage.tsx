import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, ArrowLeft, LogOut, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Footer } from '../components/Footer';

interface DealCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminDealCategoriesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DealCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    display_order: '',
  });

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

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.icon) {
      alert('Please fill in name and icon');
      return;
    }

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const categoryData = {
        name: formData.name.trim(),
        slug,
        icon: formData.icon.trim(),
        description: formData.description.trim() || null,
        display_order: formData.display_order ? parseInt(formData.display_order) : categories.length + 1,
        is_active: true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('deal_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('deal_categories')
          .insert([categoryData]);

        if (error) throw error;
      }

      alert(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (category: DealCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      description: category.description || '',
      display_order: category.display_order.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('deal_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Category deleted successfully!');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleToggleActive = async (category: DealCategory) => {
    try {
      const { error } = await supabase
        .from('deal_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      description: '',
      display_order: '',
    });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/master-admin">
                <button className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center hover:bg-surface/80 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-lime-500 to-green-500 rounded-lg flex items-center justify-center shadow-glow">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">Deal Categories</h1>
                <p className="text-sm text-gray-400">Manage deal categories</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <GradientButton onClick={handleLogout} variant="secondary" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Deal Categories</h2>
          <GradientButton
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </GradientButton>
        </div>

        {categories.length === 0 ? (
          <GlowingCard>
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No categories yet</p>
              <GradientButton onClick={() => setShowModal(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Create First Category
              </GradientButton>
            </div>
          </GlowingCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <GlowingCard key={category.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {category.description && (
                  <p className="text-gray-400 text-sm mb-4">{category.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Order: {category.display_order}</span>
                </div>

                <div className="flex gap-2">
                  <GradientButton
                    onClick={() => handleEdit(category)}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </GradientButton>
                  <GradientButton
                    onClick={() => handleToggleActive(category)}
                    variant="secondary"
                    className="flex-1"
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </GradientButton>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlowingCard>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Food & Dining"
            required
          />

          <Input
            label="Icon (Emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="e.g., 🍔"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          <Input
            type="number"
            label="Display Order"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
            placeholder="e.g., 1"
          />

          <div className="flex gap-3 pt-4">
            <GradientButton type="submit" className="flex-1">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </GradientButton>
            <GradientButton
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GradientButton>
          </div>
        </form>
      </Modal>

      <div className="mt-[50px]">
        <Footer />
      </div>
    </div>
  );
}
