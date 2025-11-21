import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().min(1, 'Event time is required'),
  location: z.string().min(3, 'Location is required'),
  max_attendees: z.coerce.number().min(1, 'Must be at least 1').optional().nullable(),
  is_active: z.boolean(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function RSVPCreatePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!eventId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      is_active: true,
    },
  });

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

      reset({
        title: data.title,
        description: data.description || '',
        event_date: dateString,
        event_time: timeString,
        location: data.location,
        max_attendees: data.max_attendees,
        is_active: data.is_active,
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

  const onSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      const eventDateTime = new Date(`${data.event_date}T${data.event_time}`).toISOString();

      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        event_date: eventDateTime,
        location: data.location,
        max_attendees: data.max_attendees || null,
        is_active: data.is_active,
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('title')}
            label="Event Title"
            placeholder="e.g., Summer BBQ Party"
            error={errors.title?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              {...register('description')}
              placeholder="Tell guests about your event"
              rows={3}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...register('event_date')}
              label="Event Date"
              type="date"
              error={errors.event_date?.message}
            />

            <Input
              {...register('event_time')}
              label="Event Time"
              type="time"
              error={errors.event_time?.message}
            />
          </div>

          <Input
            {...register('location')}
            label="Location"
            placeholder="e.g., 123 Main St, City, State"
            error={errors.location?.message}
          />

          <Input
            {...register('max_attendees')}
            label="Maximum Attendees (optional)"
            type="number"
            min="1"
            placeholder="Leave empty for unlimited"
            error={errors.max_attendees?.message}
          />

          <div className="flex items-center gap-3 p-4 bg-surface/50 rounded-lg border border-border">
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              className="w-5 h-5 rounded border-gray-600 bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-gray-300">
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
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
