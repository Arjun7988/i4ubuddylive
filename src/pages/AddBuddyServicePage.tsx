import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, Phone, Mail, Globe, MessageCircle, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';
import { TimeSelect } from '../components/TimeSelect';
import { ImageUpload } from '../components/ImageUpload';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const PAGE_KEY = "BUDDY_SERVICE_FORM";

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

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  category_id: string;
}

interface BusinessHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AddBuddyServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);

  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  const [formData, setFormData] = useState({
    category_id: '',
    subcategory_id: '',
    display_city: 'Dallas',
    business_name: '',
    tagline: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    whatsapp: '',
    social_link: '',
    about_business: '',
    listing_type: 'Free Listing',
    terms_accepted: false,
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    Monday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    Tuesday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    Wednesday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    Thursday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    Friday: { open: '09:00 AM', close: '05:00 PM', closed: false },
    Saturday: { open: '09:00 AM', close: '05:00 PM', closed: true },
    Sunday: { open: '09:00 AM', close: '05:00 PM', closed: true },
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
    fetchCategories();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      const filtered = subCategories.filter(sub => sub.category_id === formData.category_id);
      setFilteredSubCategories(filtered);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [formData.category_id, subCategories]);

  async function fetchCategories() {
    try {
      const [categoriesRes, subCategoriesRes] = await Promise.all([
        supabase.from('buddy_service_categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('buddy_service_subcategories').select('id, name, category_id').eq('is_active', true).order('name')
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (subCategoriesRes.error) throw subCategoriesRes.error;

      setCategories(categoriesRes.data || []);
      setSubCategories(subCategoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }

  function handlePlaceSelect(place: { address: string; lat: number; lng: number; placeId: string }) {
    const addressComponents = place.address.split(',').map(s => s.trim());

    let street = '';
    let city = '';
    let state = '';
    let zip = '';

    if (addressComponents.length >= 3) {
      street = addressComponents[0];
      city = addressComponents[addressComponents.length - 3] || '';
      const stateZip = addressComponents[addressComponents.length - 2] || '';
      const stateZipParts = stateZip.split(' ');
      state = stateZipParts[0] || '';
      zip = stateZipParts[1] || '';
    } else {
      street = place.address;
    }

    setFormData(prev => ({
      ...prev,
      street_address: street,
      city: city,
      state: state,
      zip_code: zip,
    }));
  }

  function handleBusinessHoursChange(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  }

  const handleAdClick = (ad: PageAd) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to submit a listing');
      return;
    }

    if (!formData.terms_accepted) {
      setError('Please accept the Terms of Service');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('buddy_service_requests')
        .insert({
          user_id: user.id,
          category_id: formData.category_id,
          subcategory_id: formData.subcategory_id || null,
          business_name: formData.business_name,
          tagline: formData.tagline || null,
          about_business: formData.about_business,
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          display_city: formData.display_city,
          phone: formData.phone,
          email: formData.email,
          website: formData.website || null,
          whatsapp: formData.whatsapp || null,
          social_link: formData.social_link || null,
          business_hours: businessHours,
          listing_type: formData.listing_type,
          images: imageUrls,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(true);

      setTimeout(() => {
        navigate('/buddy-services');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit listing request');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

        <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 pb-6 sm:pb-8 w-full">
          <div className="glass glass-border rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-gray-400 mb-6">You must be logged in to submit a business listing</p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold px-8 py-3 shadow-sm hover:shadow-glow transition-all duration-300"
            >
              Login / Sign Up
            </Link>
          </div>
        </main>

        <div className="mt-[50px]">
          <Footer />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

        <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 pb-6 sm:pb-8 w-full">
          <div className="glass glass-border rounded-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Listing Submitted Successfully!</h2>
            <p className="text-gray-400 mb-6">Your listing is under review. We'll notify you once it's approved.</p>
          </div>
        </main>

        <div className="mt-[50px]">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 pb-6 sm:pb-8 w-full">
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <Link to="/buddy-services" className="text-gray-400 hover:text-primary-400 transition-colors">
            Buddy Services
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
          <span className="text-white font-medium">List Your Business</span>
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

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <section className="glass glass-border rounded-2xl p-6 sm:p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Basic Information</h2>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                >
                  <option value="" className="bg-gray-900">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-gray-900">{cat.name}</option>
                  ))}
                </select>
              </div>

              {formData.category_id && filteredSubCategories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Sub Category *</label>
                  <select
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={handleInputChange}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  >
                    <option value="" className="bg-gray-900">Select a sub category (optional)</option>
                    {filteredSubCategories.map(sub => (
                      <option key={sub.id} value={sub.id} className="bg-gray-900">{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Display in City *</label>
                <input
                  type="text"
                  name="display_city"
                  value={formData.display_city}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Business / Service Name *</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter business name"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Short Tagline (optional)</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="e.g., Authentic Hyderabadi Biryani in Irving"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Location</h2>

              <GooglePlacesAutocomplete
                value={formData.street_address}
                onChange={handlePlaceSelect}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="City"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="State"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Zip Code *</label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    required
                    placeholder="Zip"
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Contact Information</h2>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+1 (XXX) XXX-XXXX"
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Website (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">WhatsApp (optional)</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+1 XXX XXX XXXX"
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Social Link (optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    name="social_link"
                    value={formData.social_link}
                    onChange={handleInputChange}
                    placeholder="Instagram / Facebook URL"
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-10 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </h2>

              <div className="space-y-3">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-28">
                      <label className="text-sm font-medium text-gray-300">{day}</label>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <TimeSelect
                        value={businessHours[day].open}
                        onChange={(value) => handleBusinessHoursChange(day, 'open', value)}
                        disabled={businessHours[day].closed}
                      />
                      <TimeSelect
                        value={businessHours[day].close}
                        onChange={(value) => handleBusinessHoursChange(day, 'close', value)}
                        disabled={businessHours[day].closed}
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessHours[day].closed}
                        onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-400">Closed</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* About Business */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">About Business</h2>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Description *</label>
                <textarea
                  name="about_business"
                  value={formData.about_business}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Describe your business or service in detail..."
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none"
                />
              </div>
            </div>

            {/* Business Images */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Business Image (Optional)</h2>

              <ImageUpload
                images={imageUrls}
                onChange={setImageUrls}
                maxImages={1}
                userId={user?.id}
              />
            </div>

            {/* Listing Type */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-3">Listing Type</h2>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Listing Type *</label>
                <select
                  name="listing_type"
                  value={formData.listing_type}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                >
                  <option value="Free Listing" className="bg-gray-900">Free Listing</option>
                  <option value="Paid Listing" className="bg-gray-900">Paid Listing</option>
                </select>
              </div>
            </div>

            {/* Terms & Submit */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="terms_accepted"
                  checked={formData.terms_accepted}
                  onChange={handleInputChange}
                  required
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    i4uBuddy Terms of Service
                  </a>
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-semibold px-8 py-3 shadow-sm hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Listing'}
                </button>

                <Link
                  to="/buddy-services"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 text-sm font-semibold px-8 py-3 text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </section>
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
              <>
                <div className="mb-6">
                  <h3 className="text-xl font-heading font-bold text-white mb-1">
                    Sponsored Ads
                  </h3>
                  <div className="h-0.5 w-28 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className="relative rounded-xl overflow-hidden cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10"></div>
                        <div className="relative z-10 text-center p-4">
                          <div className="text-4xl mb-2">📢</div>
                          <div className="text-white text-sm font-bold">Ad Space {num}</div>
                          <div className="text-gray-400 text-xs mt-1">Your ad here</div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                          Ad
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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

      <div className="mt-[50px]">
        <Footer />
      </div>
    </div>
  );
}
