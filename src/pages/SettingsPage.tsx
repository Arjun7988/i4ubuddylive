import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Plus, Package, Eye, Edit2, Trash2 } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Classified } from '../types/classifieds';
import { StatusBadge } from '../components/classifieds/StatusBadge';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const [, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [classifiedsLoading, setClassifiedsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });


  useEffect(() => {
    if (user) {
      loadProfile();
      loadClassifieds();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        reset({
          full_name: data.full_name,
          currency: data.currency,
        });
      } else {
        const newProfile = {
          id: user!.id,
          email: user!.email!,
          full_name: user!.user_metadata?.full_name || '',
          currency: 'USD',
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (!insertError) {
          setProfile(newProfile);
          reset({
            full_name: newProfile.full_name,
            currency: newProfile.currency,
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          currency: data.currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const loadClassifieds = async () => {
    setClassifiedsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classifieds')
        .select(`
          *,
          category:classified_categories(id, name, slug)
        `)
        .eq('created_by_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClassifieds(data || []);
    } catch (error) {
      console.error('Error loading classifieds:', error);
    } finally {
      setClassifiedsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    try {
      await supabase.auth.admin.deleteUser(user!.id);
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Profile</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            value={user?.email}
            disabled
            className="bg-surface/50"
          />

          <Input
            {...register('full_name')}
            label="Full Name"
            placeholder="Your name"
            error={errors.full_name?.message}
          />

          <Select
            {...register('currency')}
            label="Currency"
            options={[
              { value: 'USD', label: 'USD - US Dollar' },
              { value: 'EUR', label: 'EUR - Euro' },
              { value: 'GBP', label: 'GBP - British Pound' },
              { value: 'INR', label: 'INR - Indian Rupee' },
              { value: 'JPY', label: 'JPY - Japanese Yen' },
              { value: 'CAD', label: 'CAD - Canadian Dollar' },
              { value: 'AUD', label: 'AUD - Australian Dollar' },
            ]}
            error={errors.currency?.message}
          />

          <GradientButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </GradientButton>
        </form>
      </GlowingCard>

      <GlowingCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-heading font-semibold text-white">My Listings</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your classified ads</p>
          </div>
          <Link to="/classifieds/new">
            <GradientButton className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </GradientButton>
          </Link>
        </div>

        {classifiedsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : classifieds.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No listings yet. Create your first listing!</p>
          </div>
        ) : (
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
                  <Link to={`/classifieds/${classified.id}/edit`}>
                    <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-primary-400" />
                    </button>
                  </Link>
                  <Link to={`/classifieds/${classified.id}`}>
                    <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlowingCard>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Actions</h2>
        <div className="space-y-3">
          <GradientButton
            onClick={signOut}
            variant="secondary"
            className="w-full justify-center"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </GradientButton>

          <button
            onClick={handleDeleteAccount}
            className="w-full px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Account
          </button>
        </div>
      </GlowingCard>
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
