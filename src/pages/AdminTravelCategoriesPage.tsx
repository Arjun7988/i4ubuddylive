import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Edit2, Trash2, Plus, Shield, LogOut } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';
import { supabase } from '../lib/supabase';

interface TravelCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
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

export function AdminTravelCategoriesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TravelCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

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

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!token) {
        setPasswordError('Session expired. Please login again.');
        setTimeout(() => navigate('/master-admin/login'), 2000);
        return;
      }
      const url = `${supabaseUrl}/functions/v1/admin-users`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          if (responseData.error === 'Current password is incorrect') {
            setPasswordError('Current password is incorrect');
          } else {
            setPasswordError('Session expired. Please login again.');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setTimeout(() => navigate('/master-admin/login'), 2000);
          }
          return;
        }
        throw new Error(responseData.error || 'Failed to change password');
      }
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password: ' + (error as Error).message);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleOpenModal = (category?: TravelCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!categoryForm.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        slug: generateSlug(categoryForm.name),
        description: categoryForm.name.trim(),
        icon: 'MapPin',
        display_order: editingCategory ? editingCategory.display_order : categories.length,
        is_active: true,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('travel_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        alert('Category updated successfully!');
      } else {
        const { error } = await supabase
          .from('travel_categories')
          .insert(categoryData);

        if (error) throw error;
        alert('Category created successfully!');
      }

      setShowModal(false);
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleToggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('travel_categories')
        .update({ is_active: !currentStatus })
        .eq('id', categoryId);

      if (error) throw error;
      await loadCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update category status');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Posts with this category will have it removed.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('travel_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      await loadCategories();
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      <AdminHeader
        adminName={adminUser?.full_name}
        showBackButton={true}
        onChangePassword={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <GlowingCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-white">Travel Categories ({categories.length})</h2>
            <GradientButton onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </GradientButton>
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">{category.name}</p>
                    {category.is_active ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{category.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Slug: {category.slug} | Icon: {category.icon} | Order: {category.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(category.id, category.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      category.is_active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-primary-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlowingCard>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Travel Category' : 'Add Travel Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ name: e.target.value })}
            placeholder="e.g., Adventure Travel"
            required
          />
          <p className="text-xs text-gray-500">
            Other fields (slug, description, icon) will be auto-generated
          </p>
          <div className="flex gap-3 pt-4">
            <GradientButton onClick={handleSave} className="flex-1">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </GradientButton>
            <GradientButton onClick={() => setShowModal(false)} variant="secondary" className="flex-1">
              Cancel
            </GradientButton>
          </div>
        </div>
      </Modal>

      <AdminFooter />

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
        }}
        title="Change Admin Password"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {passwordError}
            </div>
          )}
          <Input
            type="password"
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
          />
          <Input
            type="password"
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Enter new password (min 8 characters)"
            required
          />
          <Input
            type="password"
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
          />
          <div className="flex gap-3 pt-4">
            <GradientButton onClick={handleChangePassword} className="flex-1">
              Change Password
            </GradientButton>
            <GradientButton
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
