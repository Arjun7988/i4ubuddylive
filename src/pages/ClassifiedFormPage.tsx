import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { X, Upload, Image as ImageIcon, AlertCircle, Home, ChevronRight, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getClassifiedById, createClassified, updateClassified, checkUserPostingLimit, searchCities } from '../lib/classifieds';
import type { ClassifiedFormData, LocationCity } from '../types/classifieds';
import type { PostingLimitInfo } from '../lib/classifieds';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';

const PAGE_KEY = "CLASSIFIEDS_FORM";

type AdActionType = "redirect" | "popup";

type PageAd = {
  id: string;
  title: string;
  image_url: string | null;
  redirect_url: string | null;
  action_type: AdActionType;
  popup_image_url: string | null;
  popup_description: string | null;
  pages: string[];
  placement: string;
  position: number | null;
  target_state: string | null;
  target_city: string | null;
  target_pincode: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
};

export function ClassifiedFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [postingLimit, setPostingLimit] = useState<PostingLimitInfo | null>(null);
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<LocationCity[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ClassifiedFormData>({
    title: '',
    description: '',
    category_id: '',
    price: null,
    currency: 'USD',
    condition: '' as any,
    city: '',
    state: '',
    country: 'USA',
    zipcode: '',
    contact_email: user?.email || '',
    contact_phone: '',
    images: [],
    duration_days: 15,
    is_all_cities: false,
    all_cities_fee: 0,
    is_top_classified: false,
    is_featured_classified: false,
    top_amount: 0,
    featured_amount: 0,
    total_amount: 0,
    terms_accepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  useEffect(() => {
    const loadPageAds = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "ACTIVE")
        .contains("pages", [PAGE_KEY]);

      if (error) {
        console.error("Error loading ads for page:", PAGE_KEY, error);
        return;
      }
      if (!data) return;

      const activeByDate = data.filter((ad: any) => {
        const start = ad.start_date ?? today;
        const end = ad.end_date ?? today;
        return start <= today && today <= end;
      });

      const activeByLocation = activeByDate.filter((ad: any) => {
        const matchState =
          !ad.target_state || !userState || ad.target_state === userState;
        const matchCity =
          !ad.target_city || !userCity || ad.target_city === userCity;
        const matchPincode =
          !ad.target_pincode || !userPincode || ad.target_pincode === userPincode;

        return matchState && matchCity && matchPincode;
      });

      const mapped: PageAd[] = activeByLocation.map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        image_url: ad.image_url,
        redirect_url: ad.redirect_url,
        action_type: (ad.action_type ?? "redirect") as AdActionType,
        popup_image_url: ad.popup_image_url,
        popup_description: ad.popup_description,
        pages: ad.pages || [],
        placement: ad.placement,
        position: ad.position,
        target_state: ad.target_state,
        target_city: ad.target_city,
        target_pincode: ad.target_pincode,
        start_date: ad.start_date,
        end_date: ad.end_date,
        status: ad.status ?? "ACTIVE",
      }));

      const sortedMapped = mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

      const topLeft = sortedMapped.filter((ad) => ad.placement === 'TOP_LEFT');
      const topRight = sortedMapped.filter((ad) => ad.placement === 'TOP_RIGHT');
      const footerLeft = sortedMapped.filter((ad) => ad.placement === 'FOOTER_LEFT');
      const footerRight = sortedMapped.filter((ad) => ad.placement === 'FOOTER_RIGHT');
      const right = sortedMapped.filter((ad) => ad.placement === 'RIGHT');

      setTopLeftAds(topLeft);
      setTopRightAds(topRight);
      setFooterLeftAds(footerLeft);
      setFooterRightAds(footerRight);
      setRightAds(right);
    };

    loadPageAds();
  }, [userState, userCity, userPincode]);

  useEffect(() => {
    if (id) {
      loadClassified();
    } else if (user) {
      checkPostingLimitFunc();
    }
  }, [id, user]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (cityQuery && cityQuery.length >= 2 && !formData.is_all_cities) {
        const suggestions = await searchCities(cityQuery);
        setCitySuggestions(suggestions);
        setShowCitySuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [cityQuery, formData.is_all_cities]);

  useEffect(() => {
    calculateTotal();
  }, [formData.is_all_cities, formData.is_top_classified, formData.is_featured_classified, formData.duration_days]);

  const checkPostingLimitFunc = async () => {
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
      setCityQuery(data.city === 'ALL' ? '' : (data.city || ''));

      setFormData({
        title: data.title,
        description: data.description,
        category_id: data.category_id || '',
        price: data.price,
        currency: 'USD',
        condition: data.condition || '' as any,
        city: data.city === 'ALL' ? '' : (data.city || ''),
        state: data.state || '',
        country: 'USA',
        zipcode: data.zipcode || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        images: data.images,
        duration_days: data.duration_days || 15,
        is_all_cities: data.is_all_cities || false,
        all_cities_fee: data.all_cities_fee || 0,
        is_top_classified: data.is_top_classified || false,
        is_featured_classified: data.is_featured_classified || false,
        top_amount: data.top_amount || 0,
        featured_amount: data.featured_amount || 0,
        total_amount: data.total_amount || 0,
        terms_accepted: data.terms_accepted || false,
      });
    } catch (error) {
      console.error('Failed to load classified:', error);
      alert('Failed to load listing');
    }
  };

  const calculateTotal = () => {
    let total = 0;

    if (formData.is_all_cities) {
      total += 15;
    }

    if (formData.is_top_classified) {
      total += formData.duration_days === 15 ? 12 : 15;
    }

    if (formData.is_featured_classified) {
      total += formData.duration_days === 15 ? 8 : 12;
    }

    setFormData(prev => ({
      ...prev,
      all_cities_fee: prev.is_all_cities ? 15 : 0,
      top_amount: prev.is_top_classified ? (prev.duration_days === 15 ? 12 : 15) : 0,
      featured_amount: prev.is_featured_classified ? (prev.duration_days === 15 ? 8 : 12) : 0,
      total_amount: total,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.is_all_cities && !formData.city.trim()) {
      newErrors.city = 'Please select a city from suggestions';
    }

    if (!formData.is_all_cities && !formData.state.trim()) {
      newErrors.state = 'State will be auto-filled when you select a city';
    }

    if (!formData.zipcode.trim()) {
      newErrors.zipcode = 'Zipcode is required';
    }

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

    if (formData.images.length > 4) {
      newErrors.images = 'Maximum 4 images allowed';
    }

    if (!formData.terms_accepted) {
      newErrors.terms = 'You must accept the terms of use';
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

  const handleCitySelect = (city: LocationCity) => {
    setCityQuery(city.city);
    setFormData(prev => ({
      ...prev,
      city: city.city,
      state: city.state,
    }));
    setShowCitySuggestions(false);
  };

  const handleCityInputChange = (value: string) => {
    setCityQuery(value);
    if (!value) {
      setFormData(prev => ({ ...prev, city: '', state: '' }));
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
    if (formData.images.length >= 4) {
      alert('Maximum 4 images allowed');
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

  const handleAdClick = (ad: PageAd) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }
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
      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 py-8 w-full">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <Link to="/classifieds" className="text-gray-400 hover:text-primary-400 transition-colors">
            Classifieds
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          <span className="text-white font-medium">{id ? 'Edit' : 'Post'} Ad</span>
        </nav>

        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-4">
              {topLeftAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {topRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <Link
            to={id ? `/classifieds/${id}` : '/classifieds'}
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← Back
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
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
                    You've used both of your posting slots. Each slot is available for 15 days after posting.
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
                      <p>Each regular ad stays active for 15 days from the date you post it.</p>
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                City *
              </label>
              <div className="relative">
                <Input
                  ref={cityInputRef}
                  value={cityQuery}
                  onChange={(e) => handleCityInputChange(e.target.value)}
                  placeholder="Start typing city name..."
                  disabled={formData.is_all_cities}
                  className={formData.is_all_cities ? 'opacity-50' : ''}
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-primary-400" />
                        <span className="text-white">{city.city}, {city.state}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                State * (Auto-filled)
              </label>
              <Input
                value={formData.state}
                readOnly
                disabled
                placeholder="Auto-filled from city selection"
                className="opacity-50"
              />
              {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Zipcode *
              </label>
              <Input
                value={formData.zipcode}
                onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                placeholder="Enter zipcode"
                maxLength={10}
              />
              <p className="text-sm text-gray-500 mt-1">
                Use Zip to show approximate location
              </p>
              {errors.zipcode && <p className="text-red-400 text-sm mt-1">{errors.zipcode}</p>}
            </div>

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

            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_all_cities}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      is_all_cities: checked,
                      city: checked ? '' : prev.city,
                      state: checked ? '' : prev.state,
                    }));
                    if (checked) {
                      setCityQuery('');
                    }
                  }}
                  className="mt-1 w-5 h-5 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">Post Ad in All Cities (Fee $15.00)</span>
                  <p className="text-sm text-gray-400 mt-1">Your ad will be visible across all cities in the platform</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration *
              </label>
              <select
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="15">15 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Images * (Maximum 4)
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-border hover:border-primary-400'
                } ${formData.images.length >= 4 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => formData.images.length < 4 && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={formData.images.length >= 4}
                />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  {formData.images.length >= 4
                    ? 'Maximum images uploaded'
                    : 'Drag and drop images here, or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, WebP up to 5MB ({formData.images.length}/4)
                </p>
              </div>
              {errors.images && <p className="text-red-400 text-sm mt-1">{errors.images}</p>}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-white mb-3">Premium Ad Options (Optional)</h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_top_classified}
                  onChange={(e) => setFormData({ ...formData, is_top_classified: e.target.checked })}
                  className="mt-1 w-5 h-5 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">
                    Top Classifieds - ${formData.duration_days === 15 ? '12' : '15'}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">Your ad appears in the Top Classifieds section</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured_classified}
                  onChange={(e) => setFormData({ ...formData, is_featured_classified: e.target.checked })}
                  className="mt-1 w-5 h-5 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div>
                  <span className="text-white font-medium">
                    Featured Classifieds - ${formData.duration_days === 15 ? '8' : '12'}
                  </span>
                  <p className="text-sm text-gray-400 mt-1">Your ad appears in the Featured Classifieds section</p>
                </div>
              </label>
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
                  Contact Phone (Optional)
                </label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  className="mt-1 w-5 h-5 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div>
                  <span className="text-white">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 underline">
                      Terms of Use
                    </a>
                    {' '}*
                  </span>
                </div>
              </label>
              {errors.terms && <p className="text-red-400 text-sm mt-2">{errors.terms}</p>}
            </div>

            <div className="sticky bottom-4 p-6 bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-lg shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Total Amount</h3>
              <div className="space-y-2 mb-4">
                {formData.is_all_cities && (
                  <div className="flex justify-between text-gray-300">
                    <span>All Cities Fee</span>
                    <span className="font-semibold">$15.00</span>
                  </div>
                )}
                {formData.is_top_classified && (
                  <div className="flex justify-between text-gray-300">
                    <span>Top Classifieds ({formData.duration_days} days)</span>
                    <span className="font-semibold">${formData.duration_days === 15 ? '12.00' : '15.00'}</span>
                  </div>
                )}
                {formData.is_featured_classified && (
                  <div className="flex justify-between text-gray-300">
                    <span>Featured Classifieds ({formData.duration_days} days)</span>
                    <span className="font-semibold">${formData.duration_days === 15 ? '8.00' : '12.00'}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-600 pt-4 flex justify-between items-center">
                <span className="text-xl font-bold text-white">Grand Total</span>
                <span className="text-3xl font-bold text-primary-400">${formData.total_amount.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Payment not enabled yet. Total will be used later for payments.
              </p>
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
          </div>

          <div className="lg:col-span-3 space-y-4">
            {rightAds.length > 0 ? (
              <>
                {rightAds.filter(ad => ad.image_url).map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => handleAdClick(ad)}
                    className="block w-full"
                  >
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full max-h-[420px] object-cover rounded-2xl border border-slate-800 shadow-md"
                    />
                  </button>
                ))}
              </>
            ) : (
              <div className="sticky top-32 p-6 bg-slate-800/30 border border-slate-700 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Posting Tips</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2">
                    <span className="text-primary-400">•</span>
                    <span>Use clear, descriptive titles</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-400">•</span>
                    <span>Upload high-quality images</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-400">•</span>
                    <span>Provide detailed descriptions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-400">•</span>
                    <span>Set competitive pricing</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {(footerLeftAds.length > 0 || footerRightAds.length > 0) && (
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {footerLeftAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {footerRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
