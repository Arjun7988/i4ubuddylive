import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { GooglePlacesAutocomplete } from '../components/GooglePlacesAutocomplete';
import { TimezoneSelect } from '../components/TimezoneSelect';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LocationData {
  address: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
}

export function RSVPCreatePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!eventId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    max_attendees: '',
    is_active: true,
  });

  const [location, setLocation] = useState<LocationData>({
    address: '',
    lat: null,
    lng: null,
    placeId: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isEdit) {
      loadEvent();
    }
  }, [eventId, user]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rsvp_events')
        .select('*')
        .eq('id', eventId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Event not found or you do not have permission to edit it');
        navigate('/rsvp');
        return;
      }

      const eventDate = new Date(data.event_date);
      const dateString = eventDate.toISOString().split('T')[0];
      const timeString = eventDate.toTimeString().slice(0, 5);

      setFormData({
        title: data.title,
        description: data.description || '',
        event_date: dateString,
        event_time: timeString,
        timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        max_attendees: data.max_attendees ? String(data.max_attendees) : '',
        is_active: data.is_active,
      });

      setLocation({
        address: data.location_address || data.location || '',
        lat: data.location_lat,
        lng: data.location_lng,
        placeId: data.location_place_id,
      });
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      navigate('/rsvp');
    } finally {
      setLoading(false);
    }
  };

  const generateShareToken = () => {
    return btoa(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
      .replace(/[+/=]/g, '')
      .substring(0, 16);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }
    if (!formData.event_time) {
      newErrors.event_time = 'Event time is required';
    }
    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required';
    }
    if (!location.address || location.address.length < 3) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const eventDateTime = new Date(`${formData.event_date}T${formData.event_time}`).toISOString();

      const eventData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        event_date: eventDateTime,
        timezone: formData.timezone,
        location: location.address,
        location_address: location.address,
        location_lat: location.lat,
        location_lng: location.lng,
        location_place_id: location.placeId,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_active: formData.is_active,
        share_token: isEdit ? undefined : generateShareToken(),
      };

      if (isEdit) {
        const { error } = await supabase
          .from('rsvp_events')
          .update(eventData)
          .eq('id', eventId);

        if (error) throw error;

        alert('Event updated successfully!');
        navigate('/rsvp');
      } else {
        const { data: newEvent, error } = await supabase
          .from('rsvp_events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        navigate(`/rsvp?created=${newEvent.id}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <GlowingCard>
              <h1 className="text-3xl font-heading font-bold text-white mb-6">
                {isEdit ? 'Edit Event' : 'Create RSVP'}
              </h1>

              <form onSubmit={onSubmit} className="space-y-6">
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  label="Event Title"
                  placeholder="e.g., Summer BBQ Party"
                  error={errors.title}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell guests about your event"
                    rows={3}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3 uppercase tracking-wide">
                    Event Start
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      label=""
                      type="date"
                      error={errors.event_date}
                      required
                    />

                    <Input
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      label=""
                      type="time"
                      error={errors.event_time}
                      required
                    />
                  </div>
                </div>

                <TimezoneSelect
                  value={formData.timezone}
                  onChange={(timezone) => setFormData({ ...formData, timezone })}
                  error={errors.timezone}
                />

                <GooglePlacesAutocomplete
                  value={location.address}
                  onChange={(place) => setLocation({
                    address: place.address,
                    lat: place.lat,
                    lng: place.lng,
                    placeId: place.placeId,
                  })}
                  error={errors.location}
                />

                <Input
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  label="Maximum Attendees"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  error={errors.max_attendees}
                />

                <div className="flex items-center gap-3 p-4 bg-dark-200/50 rounded-xl border border-white/10">
                  <input
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    type="checkbox"
                    id="is_active"
                    className="w-5 h-5 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <label htmlFor="is_active" className="text-gray-300 font-medium">
                    Event is active (accepting RSVPs)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <GradientButton
                    type="button"
                    variant="secondary"
                    onClick={() => navigate('/rsvp')}
                    className="flex-1"
                  >
                    Cancel
                  </GradientButton>
                  <GradientButton type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                  </GradientButton>
                </div>
              </form>
            </GlowingCard>
          )}
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
