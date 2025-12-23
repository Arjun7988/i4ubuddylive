import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Shield, ArrowLeft, LogOut, BadgePercent, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Footer } from '../components/Footer';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';
import { SingleImageUpload } from '../components/SingleImageUpload';

interface Deal {
  id: string;
  category_id: string;
  merchant_name: string;
  merchant_logo: string | null;
  image_url: string | null;
  title: string;
  description: string | null;
  original_price: number | null;
  discounted_price: number | null;
  discount_text: string;
  coupon_code: string | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  pincode: string | null;
  city: string | null;
  state: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  deal_categories?: {
    name: string;
    icon: string;
  };
}

interface DealCategory {
  id: string;
  name: string;
  icon: string;
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

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export function AdminDealsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [locationValue, setLocationValue] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    merchant_name: '',
    image_url: '',
    title: '',
    description: '',
    original_price: '',
    discounted_price: '',
    discount_text: '',
    coupon_code: '',
    location: '',
    location_lat: '',
    location_lng: '',
    pincode: '',
    city: '',
    state: '',
    valid_from: '',
    valid_until: '',
    is_featured: false,
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
    loadDeals();
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
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDeals = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load deals');
      }

      const data = await response.json();
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (place: { address: string; lat: number; lng: number; city?: string; state?: string; postalCode?: string }) => {
    setLocationValue(place.address);
    setFormData({
      ...formData,
      location: place.address,
      location_lat: place.lat.toString(),
      location_lng: place.lng.toString(),
      city: place.city || formData.city,
      state: place.state || formData.state,
      pincode: place.postalCode || formData.pincode,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id || !formData.merchant_name || !formData.title || !formData.discount_text || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.image_url) {
      alert('Please upload a deal banner image');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('Admin token not found');
        return;
      }

      const dealData = {
        category_id: formData.category_id,
        merchant_name: formData.merchant_name.trim(),
        merchant_logo: null,
        image_url: formData.image_url || null,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        discount_text: formData.discount_text.trim(),
        coupon_code: formData.coupon_code.trim() || null,
        location: formData.location || null,
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        pincode: formData.pincode.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        is_featured: formData.is_featured,
        is_active: true,
      };

      const url = editingDeal
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals/${editingDeal.id}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals`;

      const response = await fetch(url, {
        method: editingDeal ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(dealData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save deal');
      }

      alert(editingDeal ? 'Deal updated successfully!' : 'Deal created successfully!');
      setShowModal(false);
      resetForm();
      loadDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert(`Failed to save deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setLocationValue(deal.location || '');
    setFormData({
      category_id: deal.category_id,
      merchant_name: deal.merchant_name,
      image_url: deal.image_url || '',
      title: deal.title,
      description: deal.description || '',
      original_price: deal.original_price?.toString() || '',
      discounted_price: deal.discounted_price?.toString() || '',
      discount_text: deal.discount_text,
      coupon_code: deal.coupon_code || '',
      location: deal.location || '',
      location_lat: deal.location_lat?.toString() || '',
      location_lng: deal.location_lng?.toString() || '',
      pincode: deal.pincode || '',
      city: deal.city || '',
      state: deal.state || '',
      valid_from: deal.valid_from || '',
      valid_until: deal.valid_until || '',
      is_featured: deal.is_featured,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('Admin token not found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete deal');
      }

      alert('Deal deleted successfully!');
      loadDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      alert(`Failed to delete deal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleActive = async (deal: Deal) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('Admin token not found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals/${deal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          ...deal,
          is_active: !deal.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      loadDeals();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleToggleFeatured = async (deal: Deal) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('Admin token not found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-deals/${deal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          ...deal,
          is_featured: !deal.is_featured,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      loadDeals();
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      merchant_name: '',
      image_url: '',
      title: '',
      description: '',
      original_price: '',
      discounted_price: '',
      discount_text: '',
      coupon_code: '',
      location: '',
      location_lat: '',
      location_lng: '',
      pincode: '',
      city: '',
      state: '',
      valid_from: '',
      valid_until: '',
      is_featured: false,
    });
    setLocationValue('');
    setEditingDeal(null);
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
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg flex items-center justify-center shadow-glow">
                <BadgePercent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">Deals Management</h1>
                <p className="text-sm text-gray-400">Manage merchant deals and discounts</p>
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
          <h2 className="text-2xl font-bold text-white">All Deals</h2>
          <GradientButton
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Deal
          </GradientButton>
        </div>

        {deals.length === 0 ? (
          <GlowingCard>
            <div className="text-center py-12">
              <BadgePercent className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No deals yet</p>
              <GradientButton onClick={() => setShowModal(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Create First Deal
              </GradientButton>
            </div>
          </GlowingCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <GlowingCard key={deal.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {deal.merchant_logo ? (
                      <img src={deal.merchant_logo} alt={deal.merchant_name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center">
                        <BadgePercent className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{deal.merchant_name}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        {deal.deal_categories?.icon} {deal.deal_categories?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {deal.is_featured && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        Featured
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deal.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {deal.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <h4 className="text-white font-medium mb-2">{deal.title}</h4>
                {deal.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{deal.description}</p>
                )}

                <div className="mb-4 p-3 bg-primary-500/10 rounded-lg">
                  <p className="text-primary-400 font-semibold">{deal.discount_text}</p>
                  {deal.original_price && deal.discounted_price && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 line-through text-sm">${deal.original_price}</span>
                      <span className="text-white font-semibold">${deal.discounted_price}</span>
                    </div>
                  )}
                  {deal.coupon_code && (
                    <p className="text-xs text-gray-400 mt-1">Code: {deal.coupon_code}</p>
                  )}
                </div>

                {deal.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-400 mb-4">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{deal.location}</span>
                  </div>
                )}

                {(deal.valid_from || deal.valid_until) && (
                  <p className="text-xs text-gray-500 mb-4">
                    Valid: {deal.valid_from ? new Date(deal.valid_from).toLocaleDateString() : 'Now'} - {deal.valid_until ? new Date(deal.valid_until).toLocaleDateString() : 'Ongoing'}
                  </p>
                )}

                <div className="flex gap-2">
                  <GradientButton
                    onClick={() => handleEdit(deal)}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </GradientButton>
                  <button
                    onClick={() => handleToggleFeatured(deal)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      deal.is_featured
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-surface text-gray-400 hover:bg-surface/80'
                    }`}
                    title={deal.is_featured ? 'Remove from featured' : 'Mark as featured'}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => handleToggleActive(deal)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      deal.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                    title={deal.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {deal.is_active ? '✓' : '✗'}
                  </button>
                  <button
                    onClick={() => handleDelete(deal.id)}
                    className="px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
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
        title={editingDeal ? 'Edit Deal' : 'Add Deal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Select
            label="Category"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            required
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </Select>

          <Input
            label="Merchant Name"
            value={formData.merchant_name}
            onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
            placeholder="e.g., Pizza Palace"
            required
          />

          <SingleImageUpload
            imageUrl={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            bucket="deal-images"
            folder="banners"
            label="Deal Banner Image *"
          />

          <Input
            label="Deal Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Buy 1 Get 1 Free Pizza"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Deal Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the deal..."
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          <Input
            label="Discount Text"
            value={formData.discount_text}
            onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
            placeholder="e.g., 50% OFF"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Original Price"
              value={formData.original_price}
              onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
              placeholder="29.99"
            />
            <Input
              type="number"
              label="Discounted Price"
              value={formData.discounted_price}
              onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
              placeholder="14.99"
            />
          </div>

          <Input
            label="Coupon Code"
            value={formData.coupon_code}
            onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
            placeholder="e.g., SAVE50"
          />

          <GooglePlacesAutocomplete
            value={locationValue}
            onChange={handleLocationChange}
            label="Location *"
          />

          {formData.location && (
            <div className="p-3 bg-surface/50 rounded-lg">
              <p className="text-sm text-gray-400 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {formData.location}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="e.g., 75001"
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Dallas"
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="e.g., TX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Valid From"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            />
            <Input
              type="date"
              label="Valid Until"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-4 h-4 rounded border-border bg-surface text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-300">Mark as Featured</span>
          </label>

          <div className="flex gap-3 pt-4">
            <GradientButton type="submit" className="flex-1">
              {editingDeal ? 'Update Deal' : 'Create Deal'}
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
