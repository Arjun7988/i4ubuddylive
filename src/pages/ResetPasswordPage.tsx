import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Key, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { GlowingCard } from '../components/GlowingCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    });
  }, []);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (!validSession) {
      setError('Invalid session. Please request a new reset link.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updatePassword(data.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl" />

      <div className="flex items-center justify-center p-4 pt-40">
        <GlowingCard className="w-full max-w-md relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow">
              {success ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <Key className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              {success ? 'Password Updated!' : 'Reset Your Password'}
            </h1>
            <p className="text-gray-400">
              {success ? 'Redirecting to your dashboard...' : 'Enter your new password'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-gray-300 mb-4">
                Your password has been successfully updated.
              </p>
              <p className="text-gray-400 text-sm">
                Taking you to your dashboard...
              </p>
            </div>
          ) : !validSession ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-6">
                This reset link is invalid or has expired.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="text-primary-500 hover:text-primary-400 transition-colors"
              >
                Request new reset link
              </button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(handleResetPassword)} className="space-y-4">
              <Input
                {...form.register('password')}
                type="password"
                label="New Password"
                placeholder="••••••••"
                error={form.formState.errors.password?.message}
              />
              <Input
                {...form.register('confirmPassword')}
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                error={form.formState.errors.confirmPassword?.message}
              />
              <GradientButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating password...' : 'Update Password'}
              </GradientButton>
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to sign in
              </button>
            </form>
          )}
        </GlowingCard>
      </div>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
