import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface TravelPost {
  id: string;
  from_location: string;
  destination: string;
  travel_dates: string;
  description: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function TravelCompanionPreview() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('travel_posts')
        .select(`
          id,
          from_location,
          destination,
          travel_dates,
          description,
          profiles!inner(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading travel posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Color patterns for highlighting boxes
  const colorPatterns = [
    'border-l-4 border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    'border-l-4 border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    'border-l-4 border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]',
    'border-l-4 border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]',
    'border-l-4 border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Travel Companions</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass glass-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold text-white">Travel Companions</h2>
        </div>
        <div className="glass glass-border rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm">No travel posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-white">Travel Companions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/travel')}
            className="text-primary-400 hover:text-primary-300 text-xs font-medium flex items-center gap-1 group"
          >
            Explore
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {trips.map((trip, index) => (
        <div
          key={trip.id}
          onClick={() => navigate('/travel')}
          className={`glass glass-border rounded-xl p-4 transition-all duration-300 cursor-pointer group ${colorPatterns[index % colorPatterns.length]}`}
        >
          <div className="flex items-center gap-3 mb-3">
            {trip.profiles.avatar_url ? (
              <img
                src={trip.profiles.avatar_url}
                alt={trip.profiles.full_name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-primary-400 text-sm font-semibold">
                  {trip.profiles.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm">{trip.profiles.full_name}</h4>
              <p className="text-gray-400 text-xs line-clamp-1">{trip.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary-400 text-xs font-medium">{trip.from_location}</span>
            <Plane className="w-4 h-4 text-gray-500" />
            <span className="text-cyan-400 text-xs font-medium">{trip.destination}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Calendar className="w-3 h-3" />
            {trip.travel_dates}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
