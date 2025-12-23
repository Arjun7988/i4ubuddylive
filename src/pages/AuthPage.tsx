import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { GlowingCard } from '../components/GlowingCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { HouseAds } from '../components/ads/HouseAds';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
  pincode: z.string().regex(/^\d{5,6}$/, 'Pincode must be 5 or 6 digits'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);
    setError('');
    try {
      await signIn(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    setError('');
    try {
      const result = await signUp(data.email, data.password, data.fullName, data.pincode);

      if (result.user) {
        try {
          await supabase.from('profiles').upsert({
            id: result.user.id,
            pincode: data.pincode,
          });

          await supabase
            .from('zipcodes')
            .upsert({ pincode: data.pincode }, { onConflict: 'pincode' });

          localStorage.setItem('user_pincode', data.pincode);
        } catch (profileError) {
          console.error('Error saving pincode:', profileError);
        }

        if (!result.user.confirmed_at) {
          setSignupEmailSent(true);
          setSuccess('Please check your email to confirm your account.');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetEmailSent(true);
      setSuccess('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl" />

      <div className="container mx-auto px-4 pt-[calc(128px+50px)] pb-8 max-w-7xl">
        {/* Top Banner Ads - Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <HouseAds page={mode === 'signup' ? 'SIGNUP' : 'LOGIN'} placement="top-left" limit={10} />
          <HouseAds page={mode === 'signup' ? 'SIGNUP' : 'LOGIN'} placement="top-right" limit={10} />
        </div>

        <div className="flex gap-6 items-start justify-center">
          <GlowingCard className="w-full max-w-md relative flex-shrink-0">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {mode === 'forgot' ? 'Reset Password' : mode === 'signin' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-gray-400">
            {mode === 'forgot'
              ? 'Enter your email to reset your password'
              : mode === 'signin'
              ? 'Sign in to your account'
              : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {signupEmailSent ? (
          <div className="text-center py-8">
            <Mail className="w-16 h-16 text-accent-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
            <p className="text-gray-400 mb-4">
              We've sent you a confirmation email. Please click the link in the email to activate your account.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-blue-300 text-sm mb-2 font-semibold">Email not arriving?</p>
              <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                <li>Check your spam/junk folder</li>
                <li>Wait 2-3 minutes for delivery</li>
                <li>Make sure you entered the correct email</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setSignupEmailSent(false);
                setSuccess('');
                setMode('signin');
              }}
              className="text-primary-500 hover:text-primary-400 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : resetEmailSent ? (
          <div className="text-center py-8">
            <Mail className="w-16 h-16 text-accent-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
            <p className="text-gray-400 mb-4">
              We've sent you a password reset link. Click the link in the email to reset your password.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
              <p className="text-blue-300 text-sm mb-2 font-semibold">Email not arriving?</p>
              <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
                <li>Check your spam/junk folder</li>
                <li>Wait 2-3 minutes for delivery</li>
                <li>Make sure you entered the correct email</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setResetEmailSent(false);
                setSuccess('');
                setMode('signin');
              }}
              className="text-primary-500 hover:text-primary-400 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as any).email.value;
              handleForgotPassword(email);
            }}
            className="space-y-4"
          >
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              required
            />
            <GradientButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </GradientButton>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="w-full text-center text-sm text-gray-400 hover:text-primary-400 transition-colors"
            >
              Back to sign in
            </button>
          </form>
        ) : mode === 'signin' ? (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
            <Input
              {...signInForm.register('email')}
              type="email"
              label="Email"
              placeholder="you@example.com"
              error={signInForm.formState.errors.email?.message}
            />
            <Input
              {...signInForm.register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={signInForm.formState.errors.password?.message}
            />
            <GradientButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </GradientButton>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Create account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
            <Input
              {...signUpForm.register('fullName')}
              type="text"
              label="Full Name"
              placeholder="John Doe"
              error={signUpForm.formState.errors.fullName?.message}
            />
            <Input
              {...signUpForm.register('email')}
              type="email"
              label="Email"
              placeholder="you@example.com"
              error={signUpForm.formState.errors.email?.message}
            />
            <div>
              <Input
                {...signUpForm.register('pincode')}
                type="text"
                label="Pincode"
                placeholder="e.g., 75063"
                error={signUpForm.formState.errors.pincode?.message}
              />
              <p className="mt-1 text-xs text-gray-400">
                We use your pincode to show nearby content first. You can change it later.
              </p>
            </div>
            <Input
              {...signUpForm.register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={signUpForm.formState.errors.password?.message}
            />
            <Input
              {...signUpForm.register('confirmPassword')}
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={signUpForm.formState.errors.confirmPassword?.message}
            />
            <GradientButton type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </GradientButton>
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              Already have an account? Sign in
            </button>
          </form>
        )}
          </GlowingCard>

          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <HouseAds page={mode === 'signup' ? 'SIGNUP' : 'LOGIN'} placement="right" limit={10} />
            </div>
          </div>
        </div>

        {/* Footer Banner Ads - Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <HouseAds page={mode === 'signup' ? 'SIGNUP' : 'LOGIN'} placement="bottom-left" limit={10} />
          <HouseAds page={mode === 'signup' ? 'SIGNUP' : 'LOGIN'} placement="bottom-right" limit={10} />
        </div>
      </div>

      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
