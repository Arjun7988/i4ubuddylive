import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Home,
  Megaphone,
  Calendar,
  Ticket,
  Mail,
  Split,
  Wallet,
  Plane,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  ChevronDown,
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Settings,
  Lock,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

const mainMenuItems = [
  { to: '/', icon: Home, label: 'Home', requiresAuth: false },
  { to: '/classifieds', icon: Megaphone, label: 'Classifieds', requiresAuth: false },
  { to: '/buddy-services', icon: Sparkles, label: 'Buddy Services', requiresAuth: false },
  { to: '/deals', icon: Tag, label: 'Deals Buddy', requiresAuth: false },
  { to: '/coupons', icon: Ticket, label: 'Coupons', requiresAuth: false },
  { to: '/chatbot', icon: MessageCircle, label: 'Community Feed', requiresAuth: false },
  { to: '/travel', icon: Plane, label: 'Travel Companion', requiresAuth: false },
  { to: '/events', icon: Calendar, label: 'Events', requiresAuth: false },
  { to: '/rsvp', icon: Mail, label: 'RSVP', requiresAuth: true },
];

interface HeaderProps {
  hideNavigation?: boolean;
}

export function Header({ hideNavigation = false }: HeaderProps) {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const profileMenuItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/split', icon: Split, label: 'Split Bills' },
    { to: '/transactions', icon: Receipt, label: 'Transactions' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/change-password', icon: Lock, label: 'Change Password' },
  ];

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .maybeSingle();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, item: typeof mainMenuItems[0]) => {
    if (item.requiresAuth && !user) {
      e.preventDefault();
      navigate('/auth');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className={`flex items-center justify-between py-3 ${!hideNavigation ? 'border-b border-border/30' : ''}`}>
          <NavLink to="/" className="flex items-center flex-1">
            <img
              src="/image copy.png"
              alt="i4uBuddy Logo"
              className="h-8 sm:h-10 w-auto object-contain hover:scale-105 transition-transform duration-300"
            />
          </NavLink>

          <div className="flex items-center space-x-3 flex-shrink-0 ml-auto">
            <div className="hidden md:flex items-center space-x-1">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-sky-400 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-magenta-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            {!user ? (
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-1.5 text-sm font-medium bg-gradient-hero text-white rounded-lg hover:shadow-glow-multi transition-all hover:scale-105"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-3 py-1.5 text-sm font-medium bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-all flex items-center space-x-1"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-surface/50"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">My Profile</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute top-full mt-2 right-0 w-56 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl py-2 z-50">
                      {profileMenuItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setProfileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'text-primary-400 bg-primary-500/10'
                                : 'text-gray-400 hover:text-white hover:bg-surface/50'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                      <div className="border-t border-border/30 mt-2 pt-2">
                        <button
                          onClick={signOut}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-surface/50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {!hideNavigation && (
          <nav className="py-4">
          <div className="hidden lg:flex items-center justify-center space-x-1">
            {mainMenuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleMenuClick(e, item)}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-button text-white shadow-glow-button'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-button/10'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="lg:hidden flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <span className="text-sm text-gray-400">Menu</span>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-1 border-t border-border/30 pt-4">
              {mainMenuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-button text-white shadow-glow-button'
                        : 'text-gray-400 hover:text-white hover:bg-gradient-button/10'
                    }`
                  }
                  onClick={(e) => {
                    handleMenuClick(e, item);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}

              {user && (
                <>
                  <div className="border-t border-border/30 my-2 pt-2">
                    <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide">My Profile</div>
                  </div>
                  {profileMenuItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-button text-white shadow-glow-button'
                            : 'text-gray-400 hover:text-white hover:bg-gradient-button/10'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </>
              )}
            </div>
          )}
          </nav>
        )}
      </div>
    </div>
  );
}
