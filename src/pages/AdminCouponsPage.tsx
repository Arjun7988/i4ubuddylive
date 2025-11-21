import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Copy, Check, Shield, ArrowLeft, LogOut, Ticket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Footer } from '../components/Footer';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Coupon {
  id: string;
  title: string;
  discount_percentage: number | null;
  discount_value: string;
  expires_at: string | null;
  coupon_code: string | null;
  terms: string | null;
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

export function AdminCouponsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    expires_at: '',
    coupon_code: '',
    terms: '',
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
    loadCoupons();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const loadCoupons = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-coupons`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load coupons');
      }

      const data = await response.json();
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.discount_percentage) {
      alert('Please fill in Title and Percentage');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-coupons`;

      const couponData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        discount_percentage: parseFloat(formData.discount_percentage),
        discount_value: `${formData.discount_percentage}%`,
        discount_type: 'OFF',
        expires_at: formData.expires_at || null,
        coupon_code: formData.coupon_code.trim() || null,
        terms: formData.terms || null,
        is_active: true,
        button_text: 'Show coupon code',
        button_action: 'show_code',
        badge_text: 'CODE',
        badge_color: '#ec4899',
      };

      const method = editingCoupon ? 'PUT' : 'POST';
      const body = editingCoupon ? { ...couponData, id: editingCoupon.id } : couponData;

      console.log('Sending coupon data:', JSON.stringify(body, null, 2));

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save coupon - Full error:', errorData);

        let errorMessage = errorData.error || 'Unknown error';
        if (errorData.details) {
          errorMessage += `\nDetails: ${errorData.details}`;
        }
        if (errorData.hint) {
          errorMessage += `\nHint: ${errorData.hint}`;
        }
        if (errorData.fullError) {
          console.error('Full error object:', errorData.fullError);
        }

        alert(`Failed to save coupon:\n${errorMessage}`);
        setLoading(false);
        return;
      }

      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert(`Failed to save coupon: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      description: (coupon as any).description || '',
      discount_percentage: coupon.discount_percentage?.toString() || '',
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '',
      coupon_code: coupon.coupon_code || '',
      terms: coupon.terms || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-coupons/${id}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete coupon');
      }

      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const token = localStorage.getItem('admin_token');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-coupons`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify({
          id: coupon.id,
          is_active: !coupon.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update coupon status');
      }

      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      expires_at: '',
      coupon_code: '',
      terms: '',
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCoupon(null);
    resetForm();
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
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <Link to="/master-admin/dashboard">
                <button className="flex items-center gap-2 px-4 py-2 bg-surface/50 text-white rounded-lg hover:bg-surface/70 transition-colors border border-white/10">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary-400" />
            <h2 className="text-3xl font-bold text-white">Coupon Management</h2>
          </div>
          <GradientButton
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Coupon
          </GradientButton>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <GlowingCard key={coupon.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{coupon.title}</h3>
                  <div className="text-3xl font-bold text-pink-400 mb-2">
                    {coupon.discount_percentage || coupon.discount_value}%
                  </div>
                  {coupon.coupon_code && (
                    <div className="bg-slate-800 px-3 py-2 rounded font-mono text-sm mb-2">
                      {coupon.coupon_code}
                    </div>
                  )}
                  {coupon.expires_at && (
                    <p className="text-sm text-slate-400">
                      Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold ${
                  coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {coupon.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {coupon.terms && (
                <div className="text-sm text-slate-300 mb-4 line-clamp-3">
                  <div dangerouslySetInnerHTML={{ __html: coupon.terms }} />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(coupon)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                    coupon.is_active
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {coupon.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleEdit(coupon)}
                  className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlowingCard>
          ))}
        </div>

        {coupons.length === 0 && (
          <div className="text-center text-slate-400 mt-12">
            <p>No coupons yet. Create your first coupon!</p>
          </div>
        )}
      </div>

      <div className="mt-[50px]"><Footer /></div>

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Up to 10% Off First Purchase"
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., instead of 2%"
          />

          <Input
            label="Discount Percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
            required
            placeholder="e.g., 10"
          />

          <Input
            label="Coupon Code"
            value={formData.coupon_code}
            onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
            placeholder="e.g., SAVE10"
          />

          <Input
            label="Valid Until Date"
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Terms & Conditions
            </label>
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300">
              <ReactQuill
                theme="snow"
                value={formData.terms}
                onChange={(value) => setFormData({ ...formData, terms: value })}
                placeholder="Enter terms and conditions..."
                className="quill-editor"
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    [{ font: [] }],
                    [{ size: ['small', false, 'large', 'huge'] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ color: [] }, { background: [] }],
                    [{ script: 'sub' }, { script: 'super' }],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                    [{ align: [] }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
                formats={[
                  'header', 'font', 'size',
                  'bold', 'italic', 'underline', 'strike',
                  'color', 'background',
                  'script',
                  'list', 'bullet', 'indent',
                  'align',
                  'blockquote', 'code-block',
                  'link', 'image'
                ]}
                style={{ minHeight: '200px' }}
              />
            </div>
          </div>

          <style>{`
            .quill-editor .ql-container {
              min-height: 200px;
              font-size: 14px;
            }
            .quill-editor .ql-editor {
              min-height: 200px;
              color: #1a1a1a;
              font-size: 14px;
              line-height: 1.6;
            }
            .quill-editor .ql-editor.ql-blank::before {
              color: #9ca3af;
              font-style: normal;
            }
            .quill-editor .ql-toolbar {
              background: #f9fafb;
              border-bottom: 1px solid #e5e7eb;
            }
            .quill-editor .ql-stroke {
              stroke: #374151;
            }
            .quill-editor .ql-fill {
              fill: #374151;
            }
            .quill-editor .ql-picker-label {
              color: #374151;
            }
            .quill-editor .ql-editor p,
            .quill-editor .ql-editor ol,
            .quill-editor .ql-editor ul,
            .quill-editor .ql-editor pre,
            .quill-editor .ql-editor blockquote,
            .quill-editor .ql-editor h1,
            .quill-editor .ql-editor h2,
            .quill-editor .ql-editor h3,
            .quill-editor .ql-editor h4,
            .quill-editor .ql-editor h5,
            .quill-editor .ql-editor h6 {
              color: #1a1a1a;
            }
          `}</style>

          <div className="flex gap-3 pt-4">
            <GradientButton type="submit" className="flex-1">
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </GradientButton>
            <button
              type="button"
              onClick={handleModalClose}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
