import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Users, Package, Plane, MessageCircle, Ticket,
  Search, LogOut, Key, MapPin, Image, FolderOpen, Megaphone, Briefcase, Layers, Star, Calendar, Tag, BadgePercent
} from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

interface FeatureLink {
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  const features: FeatureLink[] = [
    {
      name: 'Users Management',
      description: 'Manage user accounts and permissions',
      icon: <Users className="w-8 h-8" />,
      path: '/master-admin/users',
      color: 'blue',
    },
    {
      name: 'Classifieds',
      description: 'Manage classified listings and categories',
      icon: <Package className="w-8 h-8" />,
      path: '/master-admin/classifieds',
      color: 'green',
    },
    {
      name: 'Events Management',
      description: 'Review and approve event submissions',
      icon: <Calendar className="w-8 h-8" />,
      path: '/master-admin/events',
      color: 'red',
    },
    {
      name: 'Travel Categories',
      description: 'Manage travel companion categories',
      icon: <MapPin className="w-8 h-8" />,
      path: '/master-admin/travel-categories',
      color: 'cyan',
    },
    {
      name: 'Travel Posts',
      description: 'Manage travel companion posts',
      icon: <Plane className="w-8 h-8" />,
      path: '/master-admin/travel-posts',
      color: 'purple',
    },
    {
      name: 'ChatBot Management',
      description: 'Monitor and moderate chat messages',
      icon: <MessageCircle className="w-8 h-8" />,
      path: '/master-admin/chat',
      color: 'indigo',
    },
    {
      name: 'Coupons Management',
      description: 'Create and manage discount coupons',
      icon: <Ticket className="w-8 h-8" />,
      path: '/master-admin/coupons',
      color: 'pink',
    },
    {
      name: 'Deal Categories',
      description: 'Manage deal categories (Food, Shopping, etc.)',
      icon: <Tag className="w-8 h-8" />,
      path: '/master-admin/deal-categories',
      color: 'lime',
    },
    {
      name: 'Deals Management',
      description: 'Create and manage merchant deals and discounts',
      icon: <BadgePercent className="w-8 h-8" />,
      path: '/master-admin/deals',
      color: 'sky',
    },
    {
      name: 'Ads Management',
      description: 'Manage and schedule advertisements',
      icon: <Megaphone className="w-8 h-8" />,
      path: '/master-admin/ads',
      color: 'emerald',
    },
    {
      name: 'Template Categories',
      description: 'Manage RSVP invite template categories',
      icon: <FolderOpen className="w-8 h-8" />,
      path: '/master-admin/template-categories',
      color: 'orange',
    },
    {
      name: 'Invite Templates',
      description: 'Upload and manage RSVP event invite images',
      icon: <Image className="w-8 h-8" />,
      path: '/master-admin/invite-templates',
      color: 'teal',
    },
    {
      name: 'Buddy Service Categories',
      description: 'Manage service provider categories',
      icon: <Briefcase className="w-8 h-8" />,
      path: '/master-admin/buddy-service-categories',
      color: 'violet',
    },
    {
      name: 'Buddy Service Sub-Categories',
      description: 'Manage service provider sub-categories',
      icon: <Layers className="w-8 h-8" />,
      path: '/master-admin/buddy-service-subcategories',
      color: 'amber',
    },
    {
      name: 'Buddy Service Requests',
      description: 'Review and approve business listing requests',
      icon: <Package className="w-8 h-8" />,
      path: '/master-admin/buddy-service-requests',
      color: 'rose',
    },
    {
      name: 'Buddy Service Reviews',
      description: 'Manage customer reviews for service providers',
      icon: <Star className="w-8 h-8" />,
      path: '/master-admin/buddy-service-reviews',
      color: 'yellow',
    },
  ];

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    try {
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*, admin_users(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !session) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/master-admin/login');
        return;
      }

      setAdminUser(JSON.parse(userStr));
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/master-admin/login');
    } finally {
      setLoading(false);
    }
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

      if (!supabaseUrl) {
        setPasswordError('Configuration error: Supabase URL not found');
        return;
      }

      const url = `${supabaseUrl}/functions/v1/admin-users`;
      console.log('Calling admin-users function:', url);

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

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

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
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setPasswordError('Network error: Unable to reach the server. Please check your connection and try again.');
      } else {
        setPasswordError('Failed to change password: ' + (error as Error).message);
      }
    }
  };

  const filteredFeatures = features.filter(
    (feature) =>
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20',
      green: 'text-green-400 bg-green-500/10 hover:bg-green-500/20',
      cyan: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
      purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20',
      indigo: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20',
      pink: 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20',
      orange: 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20',
      emerald: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
      teal: 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20',
      violet: 'text-violet-400 bg-violet-500/10 hover:bg-violet-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20',
      red: 'text-red-400 bg-red-500/10 hover:bg-red-500/20',
      amber: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
      rose: 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20',
      lime: 'text-lime-400 bg-lime-500/10 hover:bg-lime-500/20',
      sky: 'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20',
    };
    return colors[color] || colors.blue;
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
        showBackButton={false}
        onChangePassword={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <GlowingCard className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </GlowingCard>

        {filteredFeatures.length === 0 ? (
          <GlowingCard>
            <div className="text-center py-12 text-gray-400">
              No features found matching "{searchQuery}"
            </div>
          </GlowingCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map((feature) => (
              <Link key={feature.name} to={feature.path}>
                <GlowingCard
                  className={`h-full transition-all duration-300 hover:scale-105 cursor-pointer ${getColorClasses(
                    feature.color
                  )}`}
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.name}</h3>
                    <p className="text-gray-400 text-sm flex-grow">{feature.description}</p>
                    <div className="mt-4 text-primary-400 text-sm font-medium">
                      Manage →
                    </div>
                  </div>
                </GlowingCard>
              </Link>
            ))}
          </div>
        )}
      </div>

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
      <AdminFooter />
    </div>
  );
}
