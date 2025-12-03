import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  Settings,
  Menu,
  X,
  Sparkles,
  LogOut,
  Tag,
  ChevronDown,
  ChevronUp,
  Users2,
  Calendar,
  Home,
  Megaphone,
  Ticket,
  Mail,
  Split,
  Plane,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Footer } from './Footer';

interface AppShellProps {
  children: ReactNode;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const mainMenuItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/classifieds', icon: Megaphone, label: 'Classifieds' },
  { to: '/rsvp', icon: Calendar, label: 'RSVP' },
  { to: '/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/split', icon: Split, label: 'Split Wise' },
  { to: '/travel', icon: Plane, label: 'Travel Companion' },
  { to: '/chatbot', icon: MessageCircle, label: 'ChatBot' },
];

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/split', icon: Users2, label: 'Split Bills' },
  { to: '/rsvp', icon: Calendar, label: 'RSVP Events' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 border-b border-border/30">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-button rounded-lg flex items-center justify-center shadow-glow-button">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-white hidden sm:inline">FinanceAI</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-1">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-sky-400 transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-pink-500 transition-colors">
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
                  className="px-4 py-1.5 text-sm font-medium bg-gradient-button text-white rounded-lg hover:shadow-glow-button hover:bg-gradient-button-hover transition-all"
                >
                  Login
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
                  <button
                    onClick={signOut}
                    className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="py-4">
            <div className="hidden lg:flex items-center justify-center space-x-1">
              {mainMenuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
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
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>

      <div className="flex pt-[calc(128px+50px)] min-h-screen">
        <aside
        className={`fixed lg:static top-32 bottom-0 left-0 z-40 w-64 glass-border border-r transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center space-x-2 mb-8 px-2">
            <Tag className="w-6 h-6 text-primary-400" />
            <span className="text-lg font-heading font-bold text-white">Quick Access</span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-button text-white shadow-glow-button'
                      : 'text-gray-400 hover:text-white hover:bg-gradient-button/10'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}

            <div className="pt-4 border-t border-border mt-4">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-surface transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Tag className="w-5 h-5" />
                  <span className="font-medium">Categories</span>
                </div>
                {categoriesOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {categoriesOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  {categories.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-500">No categories yet</p>
                  ) : (
                    <>
                      {categories.filter(c => c.type === 'income').length > 0 && (
                        <div className="mb-2">
                          <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider">Income</p>
                          {categories.filter(c => c.type === 'income').map(category => (
                            <div
                              key={category.id}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface/50 transition-all"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm">{category.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {categories.filter(c => c.type === 'expense').length > 0 && (
                        <div>
                          <p className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider">Expense</p>
                          {categories.filter(c => c.type === 'expense').map(category => (
                            <div
                              key={category.id}
                              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface/50 transition-all"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm">{category.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="border-t border-border pt-4">
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass-border border-b p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-400">Quick Menu</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
        <div className="mt-[50px]">
          <Footer />
        </div>
      </div>
      </div>
    </div>
  );
}
