import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  title: string;
  start_at: string;
  location_address: string | null;
  city: string | null;
  state: string | null;
  venue: string | null;
}

const eventColors = [
  'from-orange-500 to-red-500',
  'from-blue-500 to-indigo-500',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-pink-500',
];

export function EventsSidebar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events_events')
        .select('id, title, start_at, location_address, city, state, venue')
        .eq('status', 'approved')
        .gte('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(4);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate().toString()
    };
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Upcoming Events</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass glass-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Upcoming Events</h2>
        </div>
        <div className="glass glass-border rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-3">No upcoming events</p>
          <button
            onClick={() => navigate('/events')}
            className="px-3 py-1.5 bg-gradient-primary rounded-lg text-white text-xs font-medium hover:shadow-glow transition-all"
          >
            View Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-white">Upcoming Events</h2>
        <button
          onClick={() => navigate('/events')}
          className="text-primary-400 hover:text-primary-300 text-xs font-medium flex items-center gap-1 group"
        >
          View All
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => {
          const dateInfo = formatDate(event.start_at);
          const location = event.location_address || event.venue ||
                          (event.city && event.state ? `${event.city}, ${event.state}` : 'TBA');

          return (
            <div
              key={event.id}
              onClick={() => navigate('/events')}
              className="glass glass-border rounded-xl p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group"
            >
              <div className="flex gap-3">
                <div className={`w-14 h-14 bg-gradient-to-br ${eventColors[index % eventColors.length]} rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white`}>
                  <span className="text-xs font-medium">{dateInfo.month}</span>
                  <span className="text-lg font-bold">{dateInfo.day}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {event.title}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.start_at)}
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
