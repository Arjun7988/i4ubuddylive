import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ArrowLeft, Eye, Edit2, Trash2, Shield, LogOut } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { supabase } from '../lib/supabase';
import type { Classified } from '../types/classifieds';
import { StatusBadge } from '../components/classifieds/StatusBadge';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminClassifiedsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadClassifieds();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const loadClassifieds = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-classifieds/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classifieds');
      }

      const result = await response.json();
      setClassifieds(result.data || []);
    } catch (error) {
      console.error('Error loading classifieds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (classifiedId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-classifieds/${classifiedId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await loadClassifieds();
      alert('Classified status updated successfully!');
    } catch (error) {
      console.error('Error updating classified status:', error);
      alert('Failed to update classified status');
    }
  };

  const handleDelete = async (classifiedId: string) => {
    if (!confirm('Are you sure you want to delete this classified? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-classifieds/${classifiedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete classified');
      }

      await loadClassifieds();
      alert('Classified deleted successfully!');
    } catch (error) {
      console.error('Error deleting classified:', error);
      alert('Failed to delete classified');
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
          <h2 className="text-xl font-heading font-semibold text-white mb-4">Classified Management ({classifieds.length} listings)</h2>
          <div className="space-y-3">
            {classifieds.map((classified) => (
              <div
                key={classified.id}
                className="flex items-start justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {classified.images[0] && (
                      <img
                        src={classified.images[0]}
                        alt={classified.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/classifieds/${classified.id}`}
                          className="font-medium text-white hover:text-primary-400 transition-colors truncate"
                        >
                          {classified.title}
                        </Link>
                        <StatusBadge status={classified.status} />
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {classified.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {classified.category && (
                          <span>{classified.category.name}</span>
                        )}
                        {classified.price && (
                          <span className="font-semibold text-primary-400">
                            {classified.currency} {classified.price.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {classified.views_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={classified.status}
                    onChange={(e) => handleUpdateStatus(classified.id, e.target.value)}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Link to={`/classifieds/${classified.id}/edit`}>
                    <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-primary-400" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(classified.id)}
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
    </div>
  );
}
