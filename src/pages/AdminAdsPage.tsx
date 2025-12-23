import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, LogOut, Megaphone, Plus, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

type AdStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";
type AdActionType = "redirect" | "popup";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

interface AdClient {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
}

interface Ad {
  id: string;
  client_id: string | null;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: AdActionType;
  popup_image_url: string | null;
  popup_description: string | null;
  pages: string[];
  placement: string;
  target_state: string | null;
  target_city: string | null;
  target_pincode: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AdStatus;
  position: number;
  created_by: string | null;
  created_at: string;
  client?: AdClient | null;
}

export function AdminAdsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [clients, setClients] = useState<AdClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [pageFilter, setPageFilter] = useState<"ALL" | string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdStatus>("ALL");
  const [deleteTargetAd, setDeleteTargetAd] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedAdIds, setSelectedAdIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    title: '',
    pages: ['CLASSIFIEDS'] as string[],
    placement: 'TOP_LEFT',
    position: 0,
    actionType: 'redirect' as AdActionType,
    redirectUrl: '',
    popupDescription: '',
    targetState: '',
    targetCity: '',
    targetPincode: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as AdStatus,
    imageUrl: '',
    popupImageUrl: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPopupImage, setUploadingPopupImage] = useState(false);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const popupImageInputRef = useRef<HTMLInputElement>(null);

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
    await loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Load clients
      const { data: clientRows, error: clientError } = await supabase
        .from('ad_clients')
        .select('*')
        .order('name');

      if (clientError) throw clientError;

      // Load ads via edge function
      const adsResponse = await fetch(`${supabaseUrl}/functions/v1/admin-ads`, {
        headers: {
          'x-admin-token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!adsResponse.ok) {
        throw new Error('Failed to load ads');
      }

      const adRows = await adsResponse.json();

      const clientMap = new Map(clientRows?.map((c) => [c.id, c]) || []);
      const hydratedAds = (adRows || []).map((ad) => ({
        ...ad,
        client: ad.client_id ? clientMap.get(ad.client_id) ?? null : null,
      }));

      setAds(hydratedAds as Ad[]);
      setClients(clientRows as AdClient[] || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load ads data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const handleOpenNew = () => {
    setEditingAd(null);
    setFormData({
      clientName: '',
      title: '',
      pages: ['CLASSIFIEDS'],
      placement: 'TOP',
      actionType: 'redirect',
      redirectUrl: '',
      popupDescription: '',
      targetState: '',
      targetCity: '',
      targetPincode: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      imageUrl: '',
      popupImageUrl: '',
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);

    setFormData({
      clientName: ad.client?.name || '',
      title: ad.title,
      pages: ad.pages || [],
      placement: ad.placement || 'TOP_LEFT',
      position: ad.position || 0,
      actionType: ad.action_type,
      redirectUrl: ad.redirect_url || '',
      popupDescription: ad.popup_description || '',
      targetState: ad.target_state || '',
      targetCity: ad.target_city || '',
      targetPincode: ad.target_pincode || '',
      startDate: ad.start_date || '',
      endDate: ad.end_date || '',
      status: ad.status,
      imageUrl: ad.image_url || '',
      popupImageUrl: ad.popup_image_url || '',
    });
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetAd) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-ads/${deleteTargetAd.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete ad');
      }

      setAds((prev) => prev.filter((ad) => ad.id !== deleteTargetAd.id));
      setDeleteTargetAd(null);
    } catch (err) {
      console.error("Failed to delete ad:", err);
      alert("Failed to delete ad. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTargetAd(null);
  };

  const uploadImage = async (file: File, isPopup: boolean = false) => {
    try {
      if (isPopup) {
        setUploadingPopupImage(true);
      } else {
        setUploadingImage(true);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = isPopup ? `popup-${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from('ads-banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ads-banners')
        .getPublicUrl(filePath);

      if (isPopup) {
        setFormData({ ...formData, popupImageUrl: data.publicUrl });
      } else {
        setFormData({ ...formData, imageUrl: data.publicUrl });
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image');
    } finally {
      if (isPopup) {
        setUploadingPopupImage(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, isPopup: boolean = false) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file, isPopup);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isPopup: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, isPopup);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.clientName.trim()) {
      alert('Client Name is required');
      return;
    }
    if (!formData.imageUrl) {
      alert('Main Banner Image is required');
      return;
    }
    if (formData.pages.length === 0) {
      alert('Please select at least one page');
      return;
    }
    if (!formData.targetState.trim()) {
      alert('State is required');
      return;
    }
    if (!formData.targetCity.trim()) {
      alert('City is required');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      alert('Both Start Date and End Date are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const payload = {
        client_name: formData.clientName.trim() || null,
        title: formData.title || formData.clientName,
        image_url: formData.imageUrl,
        redirect_url: formData.redirectUrl || null,
        action_type: formData.actionType,
        popup_image_url: formData.popupImageUrl || null,
        popup_description: formData.popupDescription || null,
        pages: formData.pages,
        placement: formData.placement,
        position: formData.position,
        target_state: formData.targetState,
        target_city: formData.targetCity,
        target_pincode: formData.targetPincode || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        status: formData.status,
        created_by: null,
      };

      if (editingAd) {
        // Update existing ad
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-ads/${editingAd.id}`, {
          method: 'PUT',
          headers: {
            'x-admin-token': token || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update ad');
        }
      } else {
        // Create new ad
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-ads`, {
          method: 'POST',
          headers: {
            'x-admin-token': token || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to create ad:', errorData);
          throw new Error(errorData.error || 'Failed to create ad');
        }
      }

      setIsDrawerOpen(false);
      setEditingAd(null);
      await loadData();
    } catch (err) {
      console.error('Error saving ad:', err);
      setError(err instanceof Error ? err.message : 'Failed to save ad');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingAd(null);
  };

  const handleToggleSelect = (adId: string) => {
    const newSelected = new Set(selectedAdIds);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedAdIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAdIds.size === filteredAds.length) {
      setSelectedAdIds(new Set());
    } else {
      setSelectedAdIds(new Set(filteredAds.map(ad => ad.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAdIds.size === 0) return;
    if (!confirm(`Delete ${selectedAdIds.size} selected ad(s)?`)) return;

    setBulkDeleting(true);
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      for (const adId of Array.from(selectedAdIds)) {
        await fetch(`${supabaseUrl}/functions/v1/admin-ads/${adId}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': token || '',
          },
        });
      }

      setSelectedAdIds(new Set());
      await loadData();
    } catch (err) {
      console.error('Error deleting ads:', err);
      alert('Failed to delete some ads');
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusColor = (status: AdStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'INACTIVE':
        return 'bg-gray-500/20 text-gray-400';
      case 'EXPIRED':
        return 'bg-red-500/20 text-red-400';
    }
  };

  const getLocationString = (ad: Ad) => {
    const parts = [];
    if (ad.target_state) parts.push(`State: ${ad.target_state}`);
    if (ad.target_city) parts.push(`City: ${ad.target_city}`);
    if (ad.target_pincode) parts.push(`Pin: ${ad.target_pincode}`);
    return parts.length > 0 ? parts.join(', ') : 'All';
  };

  const filteredAds = ads.filter((ad) => {
    if (pageFilter !== "ALL" && !ad.pages.includes(pageFilter)) return false;
    if (statusFilter !== "ALL" && ad.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const blob =
        (ad.title ?? "") +
        " " +
        (ad.client?.name ?? "") +
        " " +
        (ad.pages.join(' ') ?? "") +
        " " +
        (ad.placement ?? "");
      if (!blob.toLowerCase().includes(q)) return false;
    }

    return true;
  });

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

      <div className="flex-1 container mx-auto w-full px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-8 h-8 text-emerald-400" />
              <h2 className="text-3xl font-bold text-white">Ads Management</h2>
            </div>
            <p className="text-sm text-slate-400">
              Create, schedule, and manage banner ads across i4uBuddy
            </p>
          </div>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Add New Ad
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="mt-4 mb-4 rounded-2xl border border-slate-800 bg-[#020617] px-3 py-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title, client, page, placement..."
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 sm:ml-3">
              <select
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-100"
                value={pageFilter}
                onChange={(e) => setPageFilter(e.target.value as any)}
              >
                <option value="ALL">All pages</option>
                <option value="HOME">Home</option>
                <option value="LOGIN">Login</option>
                <option value="SIGNUP">Signup</option>
                <option value="CLASSIFIEDS">Classifieds List</option>
                <option value="MY_CLASSIFIEDS">My Classifieds</option>
                <option value="CLASSIFIEDS_DETAIL">Classifieds Detail</option>
                <option value="CLASSIFIEDS_FORM">Post Classified Ad</option>
                <option value="DEALS">Deals Buddy</option>
                <option value="COUPONS">Coupons</option>
                <option value="SERVICES">Buddy Services List</option>
                <option value="SERVICES_DETAIL">Services Detail</option>
                <option value="BUDDY_SERVICE_FORM">Add Buddy Service</option>
                <option value="EVENTS">Events List</option>
                <option value="MY_EVENTS">My Events</option>
                <option value="POST_EVENT">Post Event</option>
                <option value="TRAVEL">Travel Companion</option>
              </select>

              <select
                className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-slate-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {selectedAdIds.size > 0 && (
          <div className="mb-4 flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-sm text-slate-300">
              {selectedAdIds.size} ad{selectedAdIds.size !== 1 ? 's' : ''} selected
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        )}

        <GlowingCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">
                    <input
                      type="checkbox"
                      checked={filteredAds.length > 0 && selectedAdIds.size === filteredAds.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Preview</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Title & Client</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Page / Placement / Pos</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Location</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Dates</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Action</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      {ads.length === 0 ? 'No ads yet. Create your first ad!' : 'No ads found for current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredAds.map((ad) => (
                    <tr key={ad.id} className="border-b border-slate-800/50 hover:bg-slate-900/30">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedAdIds.has(ad.id)}
                          onChange={() => handleToggleSelect(ad.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800"
                        />
                      </td>
                      <td className="p-4">
                        {ad.image_url ? (
                          <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-600" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-white">{ad.title}</div>
                        <div className="text-sm text-slate-400">
                          {ad.client?.name || 'No client'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-white">{ad.pages.join(', ')}</div>
                        <div className="text-xs text-slate-400">{ad.placement}</div>
                        <div className="text-xs text-slate-500 mt-1">Position: {ad.position}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        {getLocationString(ad)}
                      </td>
                      <td className="p-4 text-sm text-slate-300">
                        {ad.start_date && ad.end_date ? (
                          <div>
                            <div>{ad.start_date}</div>
                            <div className="text-slate-500">→ {ad.end_date}</div>
                          </div>
                        ) : ad.start_date ? (
                          <div>{ad.start_date}</div>
                        ) : (
                          <div className="text-slate-500">No dates</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ad.status)}`}>
                          {ad.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">
                          {ad.action_type === 'redirect' ? 'Redirect' : 'Popup'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(ad)}
                            className="p-2 text-purple-400 hover:bg-purple-500/20 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetAd(ad)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlowingCard>
      </div>

      <div className="mt-[50px]">
        <Footer />
      </div>

      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 p-4 sm:p-6 z-50 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingAd ? 'Edit Ad' : 'New Ad'}
              </h3>
              <button
                onClick={handleCloseDrawer}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Basic Info</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Client Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g., ABC Company"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g., Summer Sale Banner"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">
                  Main Banner Image <span className="text-red-400">*</span>
                </h4>
                <div
                  onDrop={(e) => handleDrop(e, false)}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => mainImageInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-slate-600 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="text-slate-400">Uploading...</div>
                  ) : formData.imageUrl ? (
                    <div className="space-y-2">
                      <img src={formData.imageUrl} alt="Preview" className="max-h-40 mx-auto rounded" />
                      <p className="text-xs text-slate-500">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-sm text-slate-400">Click or drag image here</p>
                    </div>
                  )}
                </div>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, false)}
                  className="hidden"
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Action Type</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="redirect"
                      checked={formData.actionType === 'redirect'}
                      onChange={(e) => setFormData({ ...formData, actionType: e.target.value as AdActionType })}
                      className="text-purple-500"
                    />
                    <span className="text-sm text-slate-300">Redirect to link</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="popup"
                      checked={formData.actionType === 'popup'}
                      onChange={(e) => setFormData({ ...formData, actionType: e.target.value as AdActionType })}
                      className="text-purple-500"
                    />
                    <span className="text-sm text-slate-300">Open popup</span>
                  </label>
                </div>

                {formData.actionType === 'redirect' && (
                  <div className="mt-3">
                    <label className="block text-sm text-slate-400 mb-1">Redirect URL</label>
                    <input
                      type="text"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {formData.actionType === 'popup' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Popup Description</label>
                      <textarea
                        value={formData.popupDescription}
                        onChange={(e) => setFormData({ ...formData, popupDescription: e.target.value })}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                        rows={3}
                        placeholder="Description shown in popup"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Popup Image (optional)</label>
                      <div
                        onDrop={(e) => handleDrop(e, true)}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => popupImageInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:border-slate-600 transition-colors"
                      >
                        {uploadingPopupImage ? (
                          <div className="text-slate-400 text-sm">Uploading...</div>
                        ) : formData.popupImageUrl ? (
                          <div className="space-y-2">
                            <img src={formData.popupImageUrl} alt="Popup preview" className="max-h-32 mx-auto rounded" />
                            <p className="text-xs text-slate-500">Click or drag to replace</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="w-6 h-6 mx-auto text-slate-600" />
                            <p className="text-xs text-slate-400">Click or drag image</p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={popupImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, true)}
                        className="hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-1">CTA Redirect URL (optional)</label>
                      <input
                        type="text"
                        value={formData.redirectUrl}
                        onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Page & Placement</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">
                      Pages <span className="text-red-400">*</span>
                      <span className="text-xs text-slate-500 ml-2">(Select multiple pages to display this ad on)</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'HOME', label: 'Home' },
                        { value: 'LOGIN', label: 'Login' },
                        { value: 'SIGNUP', label: 'Signup' },
                        { value: 'CLASSIFIEDS', label: 'Classifieds List' },
                        { value: 'MY_CLASSIFIEDS', label: 'My Classifieds' },
                        { value: 'CLASSIFIEDS_DETAIL', label: 'Classifieds Detail' },
                        { value: 'CLASSIFIEDS_FORM', label: 'Post Classified Ad' },
                        { value: 'DEALS', label: 'Deals Buddy' },
                        { value: 'COUPONS', label: 'Coupons' },
                        { value: 'SERVICES', label: 'Buddy Services List' },
                        { value: 'SERVICES_DETAIL', label: 'Services Detail' },
                        { value: 'BUDDY_SERVICE_FORM', label: 'Add Buddy Service' },
                        { value: 'EVENTS', label: 'Events List' },
                        { value: 'MY_EVENTS', label: 'My Events' },
                        { value: 'POST_EVENT', label: 'Post Event' },
                        { value: 'TRAVEL', label: 'Travel Companion' }
                      ].map((page) => (
                        <label key={page.value} className="flex items-center gap-2 p-2 rounded hover:bg-slate-900/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.pages.includes(page.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, pages: [...formData.pages, page.value] });
                              } else {
                                setFormData({ ...formData, pages: formData.pages.filter(p => p !== page.value) });
                              }
                            }}
                            className="w-4 h-4 text-purple-500 bg-slate-900 border-slate-700 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-slate-300">{page.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Placement <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.placement}
                      onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                    >
                      <option value="TOP_LEFT">Top Left Banner</option>
                      <option value="TOP_RIGHT">Top Right Banner</option>
                      <option value="RIGHT">Right Sidebar</option>
                      <option value="FOOTER_LEFT">Footer Left Banner</option>
                      <option value="FOOTER_RIGHT">Footer Right Banner</option>
                      <option value="INLINE">Inline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Position (Display Order)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="0-100 (lower shows first)"
                    />
                    <p className="text-xs text-slate-500 mt-1">Lower numbers display first (1, 2, 3...)</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Location Targeting</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      State <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.targetState}
                      onChange={(e) => setFormData({ ...formData, targetState: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g., TX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.targetCity}
                      onChange={(e) => setFormData({ ...formData, targetCity: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g., Dallas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Pincode (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.targetPincode}
                      onChange={(e) => setFormData({ ...formData, targetPincode: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g., 75063"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">Dates & Status</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Start Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      End Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      Status <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AdStatus })}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={handleCloseDrawer}
                  className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (editingAd ? 'Updating...' : 'Saving...') : (editingAd ? 'Update Ad' : 'Create Ad')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTargetAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-[#020617] border border-red-600/60 shadow-2xl p-5 relative">
            <button
              type="button"
              onClick={handleCancelDelete}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-sm"
            >
              ✕
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-red-500/20 border border-red-500/60 text-red-300">
                !
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-50">
                  Delete this ad?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  This action cannot be undone. The ad will be removed from all pages where it is displayed.
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2 text-xs sm:text-sm">
              <div className="font-medium text-slate-100 truncate">
                {deleteTargetAd.title}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Page: <span className="uppercase">{deleteTargetAd.page}</span> · Placement:{" "}
                <span>{deleteTargetAd.placement}</span>
              </div>
              {deleteTargetAd.client?.name && (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Client: {deleteTargetAd.client.name}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              If you just want to pause this ad temporarily, you can change its status to{" "}
              <span className="text-slate-200">INACTIVE</span> instead of deleting it.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="rounded-full border border-slate-600 px-4 py-2 text-xs sm:text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAdsPage;
