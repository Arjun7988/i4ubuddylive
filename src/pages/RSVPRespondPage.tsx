import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { GoogleMap } from '../components/GoogleMap';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const rsvpSchema = z.object({
  guest_name: z.string().min(2, 'Name is required'),
  guest_email: z.string().email('Valid email is required'),
  response: z.enum(['yes', 'no', 'maybe']),
  guests_count: z.coerce.number().min(1, 'Must be at least 1').optional(),
  dietary_restrictions: z.string().optional(),
  notes: z.string().optional(),
});

type RSVPFormData = z.infer<typeof rsvpSchema>;

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  timezone: string | null;
  location: string;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  max_attendees: number | null;
}

export function RSVPRespondPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
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
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('rsvp_events')
        .select('*')
        .eq('id', eventId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Event not found or no longer active');
        navigate('/rsvp');
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      navigate('/rsvp');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RSVPFormData) => {
    if (!event) return;

    try {
      const { error } = await supabase.from('rsvp_responses').insert({
        event_id: event.id,
        user_id: user?.id || null,
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        response: data.response,
        guests_count: data.response === 'yes' ? data.guests_count || 1 : 1,
        dietary_restrictions: data.dietary_restrictions || null,
        notes: data.notes || null,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <GlowingCard>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              RSVP Submitted!
            </h2>
            <p className="text-gray-400 mb-6">
              Thank you for responding to {event.title}
            </p>
            <GradientButton onClick={() => navigate('/rsvp')}>
              Back to Events
            </GradientButton>
          </div>
        </GlowingCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <GlowingCard>
        <div className="space-y-4 mb-6">
          <h1 className="text-3xl font-heading font-bold text-white">{event.title}</h1>
          {event.description && <p className="text-gray-400">{event.description}</p>}

          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-5 h-5 text-primary-400" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            {event.timezone && (
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-5 h-5 text-primary-400" />
                <span>{event.timezone.replace(/_/g, ' ')}</span>
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
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-1">Location</h3>
              <p className="text-gray-300">{event.location}</p>
            </div>
          </div>
        </GlowingCard>
      )}

      <GlowingCard>
        <h2 className="text-xl font-heading font-semibold text-white mb-6">Your RSVP</h2>

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

          <Select
            {...register('response')}
            label="Will you attend?"
            options={[
              { value: 'yes', label: 'Yes, I will attend' },
              { value: 'no', label: 'No, I cannot attend' },
              { value: 'maybe', label: 'Maybe' },
            ]}
            error={errors.response?.message}
          />

          {response === 'yes' && (
            <>
              <Input
                {...register('guests_count')}
                label="Number of Guests (including yourself)"
                type="number"
                min="1"
                placeholder="1"
                error={errors.guests_count?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dietary Restrictions (optional)
                </label>
                <textarea
                  {...register('dietary_restrictions')}
                  placeholder="e.g., Vegetarian, Gluten-free, Nut allergy"
                  rows={2}
                  className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              placeholder="Any additional information you'd like to share"
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
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
              {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
            </GradientButton>
          </div>
        </form>
      </GlowingCard>
    </div>
  );
}
