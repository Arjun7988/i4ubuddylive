import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use database function to verify login
      const { data: result, error: rpcError } = await supabase
        .rpc('verify_admin_login', {
          p_username: username,
          p_password: password,
        });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      if (!result.success) {
        setError(result.error || 'Invalid username or password');
        setLoading(false);
        return;
      }

      // Store in localStorage
      localStorage.setItem('admin_token', result.token);
      localStorage.setItem('admin_user', JSON.stringify(result.admin_user));

      navigate('/master-admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl shadow-glow mb-6 animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-2">Master Admin</h1>
            <p className="text-gray-400 text-lg">Sign in to access the admin dashboard</p>
          </div>

          <GlowingCard className="backdrop-blur-xl bg-surface/50">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <span className="text-red-400">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  required
                  autoComplete="username"
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoComplete="current-password"
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <GradientButton
                type="submit"
                disabled={loading}
                className="w-full justify-center text-lg py-4 transition-all duration-200 hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </GradientButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-400 hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                >
                  ← Back to Home
                </button>
              </div>
            </form>

           
          </GlowingCard>
        </div>
      </div>

      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
