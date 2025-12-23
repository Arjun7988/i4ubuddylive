import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogOut, Trash2, Camera, User } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useEffect, useState, useRef } from 'react';
import { ImageCropper } from '../components/ImageCropper';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.string(),
  pincode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function SettingsPage() {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setAvatarUrl(data.avatar_url);
        reset({
          full_name: data.full_name,
          currency: data.currency,
          pincode: data.pincode || '',
          city: data.city || '',
          state: data.state || '',
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
            pincode: '',
            city: '',
            state: '',
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
          pincode: data.pincode || null,
          city: data.city || null,
          state: data.state || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;

      if (data.pincode) {
        localStorage.setItem('user_pincode', data.pincode);

        try {
          await supabase
            .from('zipcodes')
            .upsert({ pincode: data.pincode }, { onConflict: 'pincode' });
        } catch (zipcodeError) {
          console.error('Error upserting zipcode:', zipcodeError);
        }
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageToCrop(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    setImageToCrop(null);

    try {
      const timestamp = Date.now();
      const fileName = `${user.id}/avatar-${timestamp}.jpg`;

      if (profile?.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').slice(-2).join('/');
        if (oldFileName && oldFileName.includes(user.id)) {
          await supabase.storage
            .from('avatars')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${timestamp}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBust);
      setProfile({ ...profile, avatar_url: urlWithCacheBust });
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    <>
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Profile</h2>

        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-magenta-500 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-dark-100 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-500" />
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-3 bg-gradient-primary rounded-full shadow-glow hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload profile picture"
            >
              {isUploadingAvatar ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <p className="text-sm text-gray-400 mt-3 text-center">
            Click the camera icon to upload a profile picture
          </p>
        </div>

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

          <Input
            {...register('pincode')}
            label="Pincode"
            placeholder="e.g., 75063"
            error={errors.pincode?.message}
          />

          <Input
            {...register('city')}
            label="City"
            placeholder="e.g., Houston"
            error={errors.city?.message}
          />

          <Input
            {...register('state')}
            label="State"
            placeholder="e.g., TX"
            error={errors.state?.message}
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
    </>
  );
}
