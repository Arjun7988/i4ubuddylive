import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Users, LogOut, Key, Trash2 } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { supabase } from '../lib/supabase';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
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

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_admin, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token) {
        alert('Admin session expired. Please login again.');
        navigate('/master-admin/login');
        return;
      }

      console.log('Sending PATCH request to:', `${supabaseUrl}/functions/v1/admin-users`);
      console.log('Request body:', { userId, action: 'toggle_active' });

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({
          userId,
          action: 'toggle_active',
        }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          alert('Admin session expired. Please login again.');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          navigate('/master-admin/login');
          return;
        }
        throw new Error(responseData.error || 'Failed to update user status');
      }

      await loadUsers();
      alert('User status updated successfully!');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently DELETE user "${userName}"? This action cannot be undone and will remove all their data including transactions, budgets, and messages.`)) {
      return;
    }

    const confirmText = prompt(`Type "DELETE" to confirm deletion of ${userName}:`);
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. You must type DELETE exactly.');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token) {
        alert('Admin session expired. Please login again.');
        navigate('/master-admin/login');
        return;
      }

      console.log('Sending DELETE request to:', `${supabaseUrl}/functions/v1/admin-users/${userId}`);

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': token,
        },
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          alert('Admin session expired. Please login again.');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          navigate('/master-admin/login');
          return;
        }
        throw new Error(responseData.error || 'Failed to delete user');
      }

      await loadUsers();
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error as Error).message);
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
          <h2 className="text-xl font-heading font-semibold text-white mb-4">User Management ({users.length} users)</h2>
          <div className="space-y-2">
            {users.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">{profile.full_name || 'No name'}</p>
                    {profile.is_admin && (
                      <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                    {!profile.is_active && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                    {profile.is_active && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleUserStatus(profile.id, profile.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      profile.is_active
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {profile.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(profile.id, profile.full_name || profile.email)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Delete user permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlowingCard>
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
