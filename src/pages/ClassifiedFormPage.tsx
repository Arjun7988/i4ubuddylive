import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getClassifiedById, createClassified, updateClassified, checkUserPostingLimit } from '../lib/classifieds';
import type { ClassifiedFormData } from '../types/classifieds';
import type { PostingLimitInfo } from '../lib/classifieds';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { ClassifiedsBanner } from '../components/classifieds/ClassifiedsBanner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function ClassifiedFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [postingLimit, setPostingLimit] = useState<PostingLimitInfo | null>(null);
  const [formData, setFormData] = useState<ClassifiedFormData>({
    title: '',
    description: '',
    category_id: '',
    price: null,
    currency: 'USD',
    condition: '',
    city: '',
    state: '',
    country: 'USA',
    contact_email: user?.email || '',
    contact_phone: '',
    images: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadClassified();
    } else if (user) {
      checkPostingLimit();
    }
  }, [id, user]);

  const checkPostingLimit = async () => {
    if (!user) return;

    try {
      const limit = await checkUserPostingLimit(user.id);
      setPostingLimit(limit);
    } catch (error) {
      console.error('Failed to check posting limit:', error);
    }
  };

  const loadClassified = async () => {
    if (!id) return;

    try {
      const data = await getClassifiedById(id);
      if (!data) {
        alert('Classified not found');
        navigate('/classifieds');
        return;
      }

      if (data.created_by_id !== user?.id) {
        alert('You can only edit your own listings');
        navigate('/classifieds');
        return;
      }

      setPriceText(data.price ? data.price.toString() : '');

      setFormData({
        title: data.title,
        description: data.description,
        category_id: data.category_id,
        price: data.price,
        currency: 'USD',
        condition: data.condition,
        city: data.city || '',
        state: data.state || '',
        country: 'USA',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        images: data.images,
      });
    } catch (error) {
      console.error('Failed to load classified:', error);
      alert('Failed to load listing');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Please upload at least one image';
    }

    if (formData.images.length > 2) {
      newErrors.images = 'Maximum 2 images allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to post a listing');
      return;
    }

    if (!id && postingLimit && !postingLimit.can_post) {
      alert(`You've used both posting slots. Your first slot will be available in ${postingLimit.days_until_slot1_unlock} day${postingLimit.days_until_slot1_unlock !== 1 ? 's' : ''}.`);
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await updateClassified(id, formData);
        alert('Listing updated successfully!');
        navigate(`/classifieds/${id}`);
      } else {
        const newClassified = await createClassified(formData, user.id);
        alert('Listing submitted and is pending review!');
        navigate(`/classifieds/${newClassified.id}`);
      }
    } catch (error) {
      console.error('Failed to save classified:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    if (formData.images.length >= 2) {
      alert('Maximum 2 images allowed');
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload only image files');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, base64String],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handlePriceTextChange = (value: string) => {
    setPriceText(value);
    const numValue = value ? parseFloat(value) : null;
    setFormData(prev => ({ ...prev, price: numValue }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Please log in to post a listing</p>
          <Link to="/auth">
            <GradientButton>Log In</GradientButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />
      <main className="relative flex-1 pt-[calc(128px+50px)] max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <Link
            to={id ? `/classifieds/${id}` : '/classifieds'}
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← Back
          </Link>
        </div>

        <div className="mb-8">
          <ClassifiedsBanner />
        </div>

        <GlowingCard>
          <h1 className="text-3xl font-bold text-white mb-6">
            {id ? 'Edit Listing' : 'Post a New Listing'}
          </h1>

          {!id && postingLimit && !postingLimit.can_post && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">Both Posting Slots Used</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    You've used both of your posting slots. Each slot is available for 30 days after posting.
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-400">
                      <span className="font-semibold text-white">Slot 1</span> unlocks in{' '}
                      <span className="font-semibold text-white">{postingLimit.days_until_slot1_unlock} day{postingLimit.days_until_slot1_unlock !== 1 ? 's' : ''}</span>
                    </p>
                    {postingLimit.days_until_slot2_unlock !== null && (
                      <p className="text-gray-400">
                        <span className="font-semibold text-white">Slot 2</span> unlocks in{' '}
                        <span className="font-semibold text-white">{postingLimit.days_until_slot2_unlock} day{postingLimit.days_until_slot2_unlock !== 1 ? 's' : ''}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!id && postingLimit && postingLimit.can_post && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-300 text-sm mb-2">
                    You have <span className="font-semibold text-white">{postingLimit.posts_available} posting slot{postingLimit.posts_available !== 1 ? 's' : ''}</span> available.
                  </p>
                  {postingLimit.posts_used > 0 && (
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>Each ad stays active for 30 days from the date you post it.</p>
                      {postingLimit.days_until_slot1_unlock > 0 && (
                        <p>
                          Your next slot unlocks in{' '}
                          <span className="font-semibold text-white">{postingLimit.days_until_slot1_unlock} day{postingLimit.days_until_slot1_unlock !== 1 ? 's' : ''}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., 2020 Honda Civic for Sale"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about your listing..."
                rows={8}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price (Optional)
              </label>
              <Input
                type="text"
                value={priceText}
                onChange={(e) => handlePriceTextChange(e.target.value)}
                placeholder="Enter price (e.g., 500, 1200.50) or leave blank for negotiable"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for "Negotiable" or "Contact for Price"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Images * (Maximum 2)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-border hover:border-primary-400'
                } ${formData.images.length >= 2 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => formData.images.length < 2 && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={formData.images.length >= 2}
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  {formData.images.length >= 2
                    ? 'Maximum images uploaded'
                    : 'Drag and drop images here, or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG up to 5MB ({formData.images.length}/2)
                </p>
              </div>
              {errors.images && <p className="text-red-400 text-sm mt-1">{errors.images}</p>}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Image {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Email *
                </label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your@email.com"
                />
                {errors.contact_email && <p className="text-red-400 text-sm mt-1">{errors.contact_email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Link to={id ? `/classifieds/${id}` : '/classifieds'} className="flex-1">
                <button
                  type="button"
                  className="w-full px-6 py-3 border border-border rounded-lg text-gray-300 hover:bg-surface/50 transition-colors"
                >
                  Cancel
                </button>
              </Link>
              <GradientButton
                type="submit"
                disabled={loading || (!id && postingLimit && !postingLimit.can_post)}
                className="flex-1"
              >
                {loading ? 'Saving...' : (id ? 'Update Listing' : 'Post Listing')}
              </GradientButton>
            </div>
          </form>
        </GlowingCard>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
