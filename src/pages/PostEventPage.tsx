import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Globe, Upload, X, ArrowLeft, User, Phone, Video, Ticket, FileText, Home, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { TimeSelect } from '../components/TimeSelect';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const PAGE_KEY = "POST_EVENT";

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

type AttendanceMode = 'location_only' | 'online_only' | 'location_and_online';

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  timezone: string;
  attendance_mode: AttendanceMode;
  online_link: string;
  venue: string;
  location_address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  organizer: string;
  phone: string;
  email: string;
  website_url: string;
  youtube_url: string;
  registration_url: string;
  has_seat_selection: boolean;
  is_featured: boolean;
  terms_accepted: boolean;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const MAJOR_US_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
  'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
  'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Nashville',
  'Detroit', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee',
  'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Atlanta', 'Kansas City', 'Miami',
  'Raleigh', 'Omaha', 'Minneapolis', 'Cleveland', 'Wichita', 'Arlington', 'Tampa', 'Orlando',
  'Irving', 'Plano', 'Frisco', 'Richardson', 'Carrollton', 'McKinney', 'Allen', 'Denton'
];

export function PostEventPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [rightAds, setRightAds] = useState<PageAd[]>([]);

  const userState: string | null = null;
  const userCity: string | null = null;
  const userPincode: string | null = null;

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    timezone: 'America/Chicago',
    attendance_mode: 'location_only',
    online_link: '',
    venue: '',
    location_address: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    latitude: null,
    longitude: null,
    organizer: '',
    phone: '',
    email: '',
    website_url: '',
    youtube_url: '',
    registration_url: '',
    has_seat_selection: false,
    is_featured: false,
    terms_accepted: false,
  });

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

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
  };

  const uploadPoster = async (): Promise<string | null> => {
    if (!posterFile) return null;

    const fileExt = posterFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('events-posters')
      .upload(filePath, posterFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload poster');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('events-posters')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validateForm = (): boolean => {
    const warnings: string[] = [];

    if (formData.description.length < 30) {
      warnings.push('Description should be at least 30 characters for better event details.');
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays > 30) {
        warnings.push('Event duration exceeds 1 month. Please verify the dates.');
      }
    }

    if ((formData.attendance_mode === 'online_only' || formData.attendance_mode === 'location_and_online') && !formData.online_link) {
      warnings.push('Online streaming link is recommended for online events.');
    }

    setValidationWarnings(warnings);
    return true;
  };

  const combineDateTime = (date: string, time: string): string | null => {
    if (!date) return null;
    const timeStr = time || '00:00';
    return `${date}T${timeStr}:00`;
  };

  const handleAdClick = (ad: PageAd) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === "redirect" && ad.redirect_url) {
      window.open(ad.redirect_url, "_blank", "noopener,noreferrer");
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.terms_accepted) {
      alert('You must accept the terms of use to continue.');
      return;
    }

    if (!formData.email && !formData.phone) {
      alert('Please provide at least an email or phone number for contact.');
      return;
    }

    if ((formData.attendance_mode === 'location_only' || formData.attendance_mode === 'location_and_online') && !formData.city) {
      alert('City is required for location-based events.');
      return;
    }

    if ((formData.attendance_mode === 'location_only' || formData.attendance_mode === 'location_and_online') && !formData.state) {
      alert('State is required for location-based events.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      let posterUrl: string | null = null;
      if (posterFile) {
        posterUrl = await uploadPoster();
      }

      const start_at = combineDateTime(formData.start_date, formData.start_time);
      const end_at = combineDateTime(formData.end_date, formData.end_time);

      if (!start_at) {
        alert('Start date and time are required.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('events_events').insert({
        created_by: user.id,
        title: formData.title,
        description: formData.description,
        start_at,
        end_at,
        timezone: null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        location_address: formData.location_address || null,
        attendance_mode: formData.attendance_mode,
        venue: formData.venue || null,
        street: formData.street || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        eknazar_city: null,
        is_online: formData.attendance_mode === 'online_only' || formData.attendance_mode === 'location_and_online',
        online_link: formData.online_link || null,
        organizer: formData.organizer || null,
        phone: formData.phone || null,
        fax: null,
        email: formData.email || null,
        website_url: formData.website_url || null,
        youtube_url: formData.youtube_url || null,
        registration_url: formData.registration_url || null,
        ticketing_url: null,
        has_seat_selection: formData.has_seat_selection,
        poster_url: posterUrl,
        is_featured: formData.is_featured,
        status: 'pending',
      });

      if (error) throw error;

      alert('Event submitted successfully! It will be reviewed by our team.');
      navigate('/events/mine');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showLocationFields = formData.attendance_mode === 'location_only' || formData.attendance_mode === 'location_and_online';
  const showOnlineFields = formData.attendance_mode === 'online_only' || formData.attendance_mode === 'location_and_online';

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="relative pt-[calc(128px+50px)] pb-12 px-4 lg:px-8">
        <div className="container mx-auto">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Link to="/events" className="text-gray-400 hover:text-primary-400 transition-colors">
              Events
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">Post Event</span>
          </nav>

         

          {(topLeftAds.length > 0 || topRightAds.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="space-y-4">
                {topLeftAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {topRightAds.filter(ad => ad.image_url).map((ad) => (
                  <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                    <div className="w-full h-16 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-contain" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9">
              {validationWarnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
              <h3 className="text-yellow-400 font-semibold mb-1 text-sm">Suggestions:</h3>
              <ul className="space-y-1">
                {validationWarnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-yellow-300">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Basic Info
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="e.g., Summer Music Festival 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  placeholder="Tell people about your event (Minimum 30 characters recommended)"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length} characters</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <TimeSelect
                    value={formData.start_time}
                    onChange={(value) => setFormData({ ...formData, start_time: value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    End Time
                  </label>
                  <TimeSelect
                    value={formData.end_time}
                    onChange={(value) => setFormData({ ...formData, end_time: value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-400" />
                Attendance
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Attendance Mode <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <input
                      type="radio"
                      name="attendance_mode"
                      value="location_only"
                      checked={formData.attendance_mode === 'location_only'}
                      onChange={(e) => setFormData({ ...formData, attendance_mode: e.target.value as AttendanceMode })}
                      className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                    />
                    <span className="text-white text-sm font-medium">Location only</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <input
                      type="radio"
                      name="attendance_mode"
                      value="online_only"
                      checked={formData.attendance_mode === 'online_only'}
                      onChange={(e) => setFormData({ ...formData, attendance_mode: e.target.value as AttendanceMode })}
                      className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                    />
                    <span className="text-white text-sm font-medium">Online only</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                    <input
                      type="radio"
                      name="attendance_mode"
                      value="location_and_online"
                      checked={formData.attendance_mode === 'location_and_online'}
                      onChange={(e) => setFormData({ ...formData, attendance_mode: e.target.value as AttendanceMode })}
                      className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 focus:ring-purple-500"
                    />
                    <span className="text-white text-sm font-medium">Both</span>
                  </label>
                </div>
              </div>

              {showOnlineFields && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Event Online Streaming Link {formData.attendance_mode === 'online_only' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="url"
                    required={formData.attendance_mode === 'online_only'}
                    value={formData.online_link}
                    onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="https://zoom.us/j/... or YouTube Live link"
                  />
                </div>
              )}
            </div>

            {showLocationFields && (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  Venue & Address
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Venue / Hall
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="e.g., Central Park Amphitheater"
                  />
                </div>

                <div>
                  <GooglePlacesAutocomplete
                    label="Location"
                    required={true}
                    value={formData.location_address}
                    onChange={(place) => {
                      setFormData({
                        ...formData,
                        location_address: place.address,
                        latitude: place.lat,
                        longitude: place.lng,
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Search and select a location to enable map display
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <CityAutocomplete
                    value={formData.city}
                    onChange={(value) => setFormData({ ...formData, city: value })}
                    required
                  />

                  <StateAutocomplete
                    value={formData.state}
                    onChange={(value) => setFormData({ ...formData, state: value })}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">ZIP</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="ZIP"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Contact
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Organizer
                  </label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Your name or organization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Website</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Media
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Event Flyer / Poster
                </label>
                {posterPreview ? (
                  <div className="relative">
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="w-full max-h-72 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size must be less than 10MB');
                          return;
                        }
                        setPosterFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPosterPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="relative block w-full border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2 pointer-events-none" />
                    <p className="text-gray-400 mb-1 text-sm pointer-events-none">Drag & drop or click to upload event poster</p>
                    <p className="text-xs text-gray-500 pointer-events-none">JPG, PNG, WEBP up to 10MB</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePosterSelect}
                      className="hidden"
                      id="poster-upload"
                    />
                    <label htmlFor="poster-upload" className="absolute inset-0 cursor-pointer rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Youtube Link
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-purple-400" />
                Registration
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Event Registration Link
                </label>
                <input
                  type="url"
                  value={formData.registration_url}
                  onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="https://register.example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Has Seat Selection?
                  </label>
                  <select
                    value={formData.has_seat_selection ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, has_seat_selection: e.target.value === 'yes' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer w-full">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Featured (Premium)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="terms_accepted"
                  required
                  checked={formData.terms_accepted}
                  onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-slate-900 border-slate-700 rounded focus:ring-purple-500 mt-0.5"
                />
                <span className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Terms of Use:\n\n1. You must provide accurate information\n2. You must have rights to post this event\n3. Content must not violate any laws\n4. We reserve the right to remove any event\n5. Events are subject to approval');
                    }}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    terms of use
                  </a>{' '}
                  <span className="text-red-500">*</span>
                  <p className="text-xs text-gray-500 mt-1">
                    By checking this box, you confirm that all information provided is accurate and you have the rights to post this event.
                  </p>
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.terms_accepted}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-lg font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Event'}
              </button>
            </div>
          </form>
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

function LocationAutocomplete({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'address_components'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.formatted_address) {
          onChange(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places:', error);
    }
  }, [isLoaded, onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        Street Address
      </label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        placeholder="123 Main Street"
      />
    </div>
  );
}

function CityAutocomplete({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (val.length > 0) {
      const filtered = MAJOR_US_CITIES.filter(city =>
        city.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        City {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value && handleInputChange(value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        placeholder="City"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                onChange(city);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 transition-colors text-sm"
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StateAutocomplete({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (val.length > 0) {
      const filtered = US_STATES.filter(state =>
        state.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">
        State {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => value && handleInputChange(value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        placeholder="State"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => {
                onChange(state);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 transition-colors text-sm"
            >
              {state}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
