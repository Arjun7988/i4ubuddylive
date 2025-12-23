import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, Clock, Eye, Trash2, AlertCircle } from 'lucide-react';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';

interface ServiceRequest {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  listing_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'hold';
  created_at: string;
  category_name?: string;
  subcategory_name?: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export default function AdminBuddyServiceRequestsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    checkAuth();
    fetchRequests();
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

  async function fetchRequests() {
    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        setError('Not authenticated. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services`,
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
        console.error('Fetch error:', error);
        throw new Error(error.error || `Failed to fetch requests (${response.status})`);
      }

      const { data } = await response.json();
      console.log('Fetched requests:', data?.length || 0);

      const formatted = (data || []).map((req: any) => ({
        ...req,
        category_name: req.category?.name || 'N/A',
        subcategory_name: req.subcategory?.name || 'N/A',
      }));

      setRequests(formatted);
      setError('');
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(requestId: string, newStatus: 'approved' | 'rejected' | 'hold') {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
          body: JSON.stringify({
            requestId,
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error('Update error response:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));

        let errorMsg = error.error || 'Failed to update request';
        if (error.details) errorMsg += `\n\nDetails: ${error.details}`;
        if (error.hint) errorMsg += `\n\nHint: ${error.hint}`;
        if (error.code) errorMsg += `\n\nCode: ${error.code}`;
        if (error.fullError && error.fullError !== errorMsg) errorMsg += `\n\n${error.fullError}`;

        throw new Error(errorMsg);
      }

      setSuccess(`Request ${newStatus} successfully`);
      fetchRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(requestId: string) {
    if (!confirm('Are you sure you want to delete this request?')) return;

    setActionLoading(true);
    setError('');

    try {
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-buddy-services/${requestId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete request');
      }

      setSuccess('Request deleted successfully');
      fetchRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Error deleting request:', err);
      setError(err.message || 'Failed to delete request');
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      hold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
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

      <div className="p-6 space-y-6">

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-200">{success}</p>
        </div>
      )}

      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Business Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{request.business_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">{request.category_name}</div>
                    {request.subcategory_name !== 'N/A' && (
                      <div className="text-xs text-gray-500">{request.subcategory_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">{request.city}, {request.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">{request.email}</div>
                    <div className="text-xs text-gray-500">{request.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">{request.listing_type}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {requests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No requests found</p>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass glass-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedRequest.business_name}</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Category</label>
                  <p className="text-white mt-1">{selectedRequest.category_name}</p>
                </div>
                {selectedRequest.subcategory_name !== 'N/A' && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide">Sub Category</label>
                    <p className="text-white mt-1">{selectedRequest.subcategory_name}</p>
                  </div>
                )}
              </div>

              {selectedRequest.tagline && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Tagline</label>
                  <p className="text-white mt-1">{selectedRequest.tagline}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">About Business</label>
                <p className="text-white mt-1 whitespace-pre-wrap">{selectedRequest.about_business}</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Address</label>
                <p className="text-white mt-1">
                  {selectedRequest.street_address}<br />
                  {selectedRequest.city}, {selectedRequest.state} {selectedRequest.zip_code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Display City</label>
                  <p className="text-white mt-1">{selectedRequest.display_city || 'Dallas'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Phone</label>
                  <p className="text-white mt-1">{selectedRequest.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Email</label>
                  <p className="text-white mt-1">{selectedRequest.email}</p>
                </div>
              </div>

              {(selectedRequest.website || selectedRequest.whatsapp || selectedRequest.social_link) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.website && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Website</label>
                      <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline mt-1 block">
                        {selectedRequest.website}
                      </a>
                    </div>
                  )}
                  {selectedRequest.whatsapp && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">WhatsApp</label>
                      <p className="text-white mt-1">{selectedRequest.whatsapp}</p>
                    </div>
                  )}
                  {selectedRequest.social_link && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Social Link</label>
                      <a href={selectedRequest.social_link} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline mt-1 block">
                        {selectedRequest.social_link}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.business_hours && Object.keys(selectedRequest.business_hours).length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">Business Hours</label>
                  <div className="space-y-2">
                    {Object.entries(selectedRequest.business_hours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 font-medium w-24">{day}</span>
                        {hours.closed ? (
                          <span className="text-red-400">Closed</span>
                        ) : (
                          <span className="text-white">{hours.open} - {hours.close}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.images && Array.isArray(selectedRequest.images) && selectedRequest.images.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-3 block">Images</label>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedRequest.images.map((imageUrl: string, index: number) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Business image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Listing Type</label>
                  <p className="text-white mt-1">{selectedRequest.listing_type}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Submitted Date</label>
                  <p className="text-white mt-1">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide">Reviewed Date</label>
                    <p className="text-white mt-1">{new Date(selectedRequest.reviewed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedRequest.admin_notes && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Admin Notes</label>
                  <p className="text-white mt-1 whitespace-pre-wrap">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'approved')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'hold')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    Hold
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'rejected')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
