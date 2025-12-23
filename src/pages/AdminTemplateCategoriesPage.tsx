import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, Shield, ArrowLeft, LogOut } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { GlowingCard } from '../components/GlowingCard';
import { Footer } from '../components/Footer';
import {
  fetchTemplateCategories,
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory,
  generateSlug
} from '../lib/templates';
import type { TemplateCategory } from '../types/templates';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminTemplateCategoriesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      const data = await fetchTemplateCategories(false);
      setCategories(data);
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
      description: '',
      sort_order: 0,
      is_active: true
    });
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(category: TemplateCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setError('');
    setIsModalOpen(true);
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }

    try {
      if (editingCategory) {
        await updateTemplateCategory(editingCategory.id, formData);
        setSuccessMessage('Category updated successfully');
      } else {
        await createTemplateCategory(formData);
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

  async function handleDelete(category: TemplateCategory) {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await deleteTemplateCategory(category.id);
      setSuccessMessage('Category deleted successfully');
      await loadCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
      setTimeout(() => setError(''), 5000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">Master Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Welcome, {adminUser?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/master-admin">
                <GradientButton variant="secondary" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </GradientButton>
              </Link>
              <GradientButton onClick={handleLogout} variant="secondary" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 w-full">
        <GlowingCard>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">
                Template Categories
              </h1>
              <p className="text-gray-400">
                Manage invite template categories for RSVP events
              </p>
            </div>
            <GradientButton onClick={openCreateModal}>
              <Plus className="w-5 h-5 mr-2" />
              Add Category
            </GradientButton>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
              {successMessage}
            </div>
          )}

          {error && !isModalOpen && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No categories found</p>
              <button
                onClick={openCreateModal}
                className="mt-4 text-primary-400 hover:text-primary-300 transition-colors"
              >
                Create your first category
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-200/50 border-b border-border">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-semibold">Name</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Slug</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Sort Order</th>
                      <th className="text-right p-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-semibold text-white">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-400 mt-1">{category.description}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <code className="text-sm text-primary-400 bg-primary-500/10 px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              category.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{category.sort_order}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(category)}
                              className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlowingCard>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? 'Edit Category' : 'Create Category'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />

            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />

            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <Input
              label="Sort Order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) }))}
            />

            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              Active (visible to users)
            </label>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <GradientButton type="submit">
                {editingCategory ? 'Update' : 'Create'}
              </GradientButton>
            </div>
          </form>
        </Modal>
      </div>

      <Footer />
    </div>
  );
}
