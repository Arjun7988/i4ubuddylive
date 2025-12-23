import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  is_approved: boolean;
  listing: {
    id: string;
    business_name: string;
    slug: string;
  };
  category: {
    slug: string;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export default function AdminBuddyServiceReviewsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    checkAuth();
    fetchReviews();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    setAdminUser(JSON.parse(userStr));
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

  async function fetchReviews() {
    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services?action=reviews`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || `Failed to fetch reviews (${response.status})`);
      }

      const { data } = await response.json();
      setReviews(data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    setActionLoading(reviewId);
    setError('');
    setSuccess('');

    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services?action=approve-review`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({ reviewId }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || 'Failed to approve review');
      }

      setSuccess('Review approved successfully!');
      await fetchReviews();
    } catch (err: any) {
      console.error('Error approving review:', err);
      setError(err.message || 'Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    setActionLoading(reviewId);
    setError('');
    setSuccess('');

    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services?action=delete-review`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({ reviewId }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || 'Failed to delete review');
      }

      setSuccess('Review deleted successfully!');
      await fetchReviews();
    } catch (err: any) {
      console.error('Error deleting review:', err);
      setError(err.message || 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (filter === 'pending') return !review.is_approved;
    if (filter === 'approved') return review.is_approved;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      <AdminHeader
        adminName={adminUser?.full_name}
        showBackButton={true}
        onChangePassword={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-6">
        <div className="container mx-auto">

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
              {success}
            </div>
          )}

          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Approved
            </button>
          </div>

          {loading ? (
            <div className="glass glass-border rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="glass glass-border rounded-xl p-8 text-center">
              <p className="text-gray-400">No reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="glass glass-border rounded-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/buddy-services/${review.category.slug}/${review.listing.slug}`}
                          className="text-lg font-bold text-white hover:text-primary-400 transition-colors"
                        >
                          {review.listing.business_name}
                        </Link>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            review.is_approved
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        By {review.user_name} •{' '}
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={actionLoading === review.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{actionLoading === review.id ? 'Approving...' : 'Approve'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{actionLoading === review.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
