import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, ArrowLeft, Edit2, Trash2, Users, MapPin, Shield, LogOut } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';

interface TravelPost {
  id: string;
  user_id: string;
  category_id: string | null;
  destination: string;
  travel_dates: string;
  description: string;
  budget_range: string;
  looking_for: string;
  contact_preference: string;
  is_active: boolean;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  category?: {
    name: string;
  };
}

interface TravelCategory {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminTravelPostsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [posts, setPosts] = useState<TravelPost[]>([]);
  const [categories, setCategories] = useState<TravelCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<TravelPost | null>(null);
  const [postForm, setPostForm] = useState({
    destination: '',
    travel_dates: '',
    description: '',
    budget_range: '',
    looking_for: '',
    category_id: '',
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
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const loadData = async () => {
    try {
      const [postsResult, categoriesResult] = await Promise.all([
        supabase.from('travel_posts').select(`
          *,
          user:profiles!user_id(full_name, email),
          category:travel_categories!category_id(name)
        `).order('created_at', { ascending: false }),
        supabase.from('travel_categories').select('id, name').order('name'),
      ]);

      if (postsResult.error) throw postsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setPosts(postsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (post: TravelPost) => {
    setEditingPost(post);
    setPostForm({
      destination: post.destination,
      travel_dates: post.travel_dates,
      description: post.description,
      budget_range: post.budget_range,
      looking_for: post.looking_for,
      category_id: post.category_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!postForm.destination || !postForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('travel_posts')
        .update({
          destination: postForm.destination,
          travel_dates: postForm.travel_dates,
          description: postForm.description,
          budget_range: postForm.budget_range,
          looking_for: postForm.looking_for,
          category_id: postForm.category_id || null,
        })
        .eq('id', editingPost!.id);

      if (error) throw error;

      setShowModal(false);
      await loadData();
      alert('Travel post updated successfully!');
    } catch (error) {
      console.error('Error updating travel post:', error);
      alert('Failed to update travel post');
    }
  };

  const handleToggleStatus = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('travel_posts')
        .update({ is_active: !currentStatus })
        .eq('id', postId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error toggling post status:', error);
      alert('Failed to update post status');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this travel post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('travel_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      await loadData();
      alert('Travel post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GlowingCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-heading font-semibold text-white">Travel Posts Management</h2>
            <div className="text-sm text-gray-400">
              Total Posts: <span className="text-white font-medium">{posts.length}</span>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No travel posts found
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-5 bg-surface/50 rounded-xl border border-border hover:border-primary-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <MapPin className="w-4 h-4 text-primary-400" />
                        <h3 className="font-semibold text-white text-lg">{post.destination}</h3>
                        {post.is_active ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                            Inactive
                          </span>
                        )}
                        {post.category && (
                          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {post.user?.full_name || 'Unknown'}
                        </span>
                        <span>•</span>
                        <span>{post.user?.email || 'No email'}</span>
                        <span>•</span>
                        <span>Posted: {new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-background/50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Travel Dates</p>
                      <p className="text-sm text-gray-300">{post.travel_dates}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget Range</p>
                      <p className="text-sm text-gray-300">{post.budget_range}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Looking For</p>
                      <p className="text-sm text-gray-300">{post.looking_for}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{post.description}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => handleToggleStatus(post.id, post.is_active)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        post.is_active
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {post.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(post)}
                      className="px-4 py-2 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowingCard>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Travel Post">
        <div className="space-y-4">
          <Input
            label="Destination"
            value={postForm.destination}
            onChange={(e) => setPostForm({ ...postForm, destination: e.target.value })}
            placeholder="e.g., Paris, France"
            required
          />

          <Input
            label="Travel Dates"
            value={postForm.travel_dates}
            onChange={(e) => setPostForm({ ...postForm, travel_dates: e.target.value })}
            placeholder="e.g., Dec 15-20, 2025"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={postForm.category_id}
              onChange={(e) => setPostForm({ ...postForm, category_id: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Budget Range
            </label>
            <select
              value={postForm.budget_range}
              onChange={(e) => setPostForm({ ...postForm, budget_range: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Budget Range</option>
              <option value="Budget ($)">Budget ($)</option>
              <option value="Moderate ($$)">Moderate ($$)</option>
              <option value="Comfortable ($$$)">Comfortable ($$$)</option>
              <option value="Luxury ($$$$)">Luxury ($$$$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Looking For
            </label>
            <select
              value={postForm.looking_for}
              onChange={(e) => setPostForm({ ...postForm, looking_for: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select Type</option>
              <option value="Travel Companion">Travel Companion</option>
              <option value="Group">Group</option>
              <option value="Guide">Guide</option>
              <option value="Advice">Advice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={postForm.description}
              onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
              placeholder="Describe your travel plans..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <GradientButton onClick={handleSave} className="flex-1">
              Update Post
            </GradientButton>
            <GradientButton onClick={() => setShowModal(false)} variant="secondary" className="flex-1">
              Cancel
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
