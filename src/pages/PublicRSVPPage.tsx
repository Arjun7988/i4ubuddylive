import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { GoogleMap } from '../components/GoogleMap';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';

const rsvpSchema = z.object({
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Valid email is required'),
  response: z.enum(['yes', 'no']),
  guests_count: z.coerce.number().min(1, 'Must be at least 1').optional(),
});

type RSVPFormData = z.infer<typeof rsvpSchema>;

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  event_end_time: string | null;
  timezone: string | null;
  location: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  max_attendees: number | null;
  share_token: string;
  customized_invite_url: string | null;
}

export function PublicRSVPPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      response: 'yes',
      guests_count: 1,
    },
  });

  const response = watch('response');

  useEffect(() => {
    loadEvent();
  }, [shareToken]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('rsvp_events')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Event not found or no longer active');
        navigate('/');
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RSVPFormData) => {
    if (!event) return;

    try {
      const { error } = await supabase.from('rsvp_responses').insert({
        event_id: event.id,
        user_id: null,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        response: data.response,
        guests_count: data.response === 'yes' ? data.guests_count || 1 : 1,
        dietary_restrictions: null,
        notes: null,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      alert('Failed to submit RSVP. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString: string, timeString?: string | null) => {
    const dateObj = new Date(dateString);
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (timeString) {
      return `${dateFormatted} at ${timeString}`;
    }

    return dateFormatted;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl" />
        <div className="flex items-center justify-center p-4 pt-40">
        <div className="max-w-2xl w-full relative">
          <GlowingCard>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                RSVP Submitted!
              </h2>
              <p className="text-gray-400 mb-2">
                Thank you for responding to {event.title}
              </p>
              <p className="text-sm text-gray-500">
                You will receive a confirmation email shortly.
              </p>
            </div>
          </GlowingCard>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl" />

      <div className="flex items-center justify-center p-4 pt-40">
      <div className="max-w-2xl w-full space-y-6 relative">
        {event.customized_invite_url && (
          <GlowingCard>
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
              <img
                src={event.customized_invite_url}
                alt={`${event.title} invitation`}
                className="w-full h-full object-cover"
              />
            </div>
          </GlowingCard>
        )}

        <GlowingCard>
          <div className="space-y-4 mb-6">
            <h1 className="text-3xl font-heading font-bold text-white">{event.title}</h1>
            {event.description && <p className="text-gray-400">{event.description}</p>}

            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-start gap-2 text-gray-300">
                <Calendar className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white mb-1">Event Start</div>
                  <div>{formatDate(event.event_date)}</div>
                </div>
              </div>

              {event.event_end_date && (
                <div className="flex items-start gap-2 text-gray-300">
                  <Calendar className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white mb-1">Event End</div>
                    <div>{formatDateOnly(event.event_end_date, event.event_end_time)}</div>
                  </div>
                </div>
              )}

              {event.timezone && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-primary-400" />
                  <span className="font-medium">{event.timezone.replace(/_/g, ' ')}</span>
                </div>
              )}

              {event.max_attendees && (
                <div className="flex items-center gap-2 text-gray-300 mt-2 pt-2 border-t border-border">
                  <span className="text-sm">Maximum Attendees: <span className="font-semibold text-white">{event.max_attendees}</span></span>
                </div>
              )}
            </div>
          </div>
        </GlowingCard>

        {event.location_lat && event.location_lng && event.location_address && (
          <GoogleMap
            lat={event.location_lat}
            lng={event.location_lng}
            address={event.location_address}
          />
        )}

        {!event.location_lat && !event.location_lng && event.location && (
          <GlowingCard>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Location</h3>
                  <p className="text-gray-300">{event.location}</p>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                Open in Google Maps
              </a>
            </div>
          </GlowingCard>
        )}

        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-6">
            RSVP to this Event
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('guest_name')}
              label="Your Name"
              placeholder="John Doe"
              error={errors.guest_name?.message}
            />

            <Input
              {...register('guest_email')}
              label="Your Email"
              type="email"
              placeholder="john@example.com"
              error={errors.guest_email?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Will you attend?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    response === 'yes'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border bg-surface/50 hover:border-primary-500/50'
                  }`}
                >
                  <input
                    {...register('response')}
                    type="radio"
                    value="yes"
                    className="sr-only"
                  />
                  <CheckCircle
                    className={`w-5 h-5 ${
                      response === 'yes' ? 'text-green-400' : 'text-gray-500'
                    }`}
                  />
                  <span className="font-medium text-white">Yes, I'll attend</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    response === 'no'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border bg-surface/50 hover:border-primary-500/50'
                  }`}
                >
                  <input
                    {...register('response')}
                    type="radio"
                    value="no"
                    className="sr-only"
                  />
                  <span className="font-medium text-white">No, I can't attend</span>
                </label>
              </div>
            </div>

            {response === 'yes' && (
              <Input
                {...register('guests_count')}
                label="How many people will attend? (including yourself)"
                type="number"
                min="1"
                placeholder="1"
                error={errors.guests_count?.message}
              />
            )}

            <GradientButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
            </GradientButton>
          </form>
        </GlowingCard>
      </div>
      </div>
    </div>
  );
}
