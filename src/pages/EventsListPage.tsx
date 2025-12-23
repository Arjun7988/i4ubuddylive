import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Search, Plus, Star, Clock, ExternalLink, Ticket, Home, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GoogleMap } from '../components/GoogleMap';
import { supabase } from '../lib/supabase';
import { Event, DateFilter } from '../types/events';
import { useAuthStore } from '../store/authStore';

const PAGE_KEY = 'EVENTS';

type AdActionType = 'redirect' | 'popup';

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
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
};

export function EventsListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [topLeftAds, setTopLeftAds] = useState<PageAd[]>([]);
  const [topRightAds, setTopRightAds] = useState<PageAd[]>([]);
  const [leftRailAds, setLeftRailAds] = useState<PageAd[]>([]);
  const [rightSidebarAds, setRightSidebarAds] = useState<PageAd[]>([]);
  const [inlineAds, setInlineAds] = useState<PageAd[]>([]);
  const [footerLeftAds, setFooterLeftAds] = useState<PageAd[]>([]);
  const [footerRightAds, setFooterRightAds] = useState<PageAd[]>([]);
  const [popupAd, setPopupAd] = useState<PageAd | null>(null);

  useEffect(() => {
    loadEvents();
    loadPageAds();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events_events')
      .select('*')
      .eq('status', 'approved')
      .order('start_at', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const loadPageAds = async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('status', 'ACTIVE')
      .contains('pages', [PAGE_KEY]);

    if (error || !data) return;

    const activeAds = data.filter((ad: any) => {
      const start = ad.start_date ?? today;
      const end = ad.end_date ?? today;
      return start <= today && today <= end;
    });

    const mapped: PageAd[] = activeAds.map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      image_url: ad.image_url,
      redirect_url: ad.redirect_url,
      action_type: (ad.action_type ?? 'redirect') as AdActionType,
      popup_image_url: ad.popup_image_url,
      popup_description: ad.popup_description,
      pages: ad.pages || [],
      placement: ad.placement,
      position: ad.position,
      status: ad.status ?? 'ACTIVE',
    }));

    const sorted = mapped.sort((a, b) => (a.position || 0) - (b.position || 0));

    setTopLeftAds(sorted.filter((ad) => ad.placement === 'TOP_LEFT'));
    setTopRightAds(sorted.filter((ad) => ad.placement === 'TOP_RIGHT'));
    setLeftRailAds(sorted.filter((ad) => ad.placement === 'LEFT'));
    setRightSidebarAds(sorted.filter((ad) => ad.placement === 'RIGHT'));
    setInlineAds(sorted.filter((ad) => ad.placement === 'INLINE'));
    setFooterLeftAds(sorted.filter((ad) => ad.placement === 'FOOTER_LEFT'));
    setFooterRightAds(sorted.filter((ad) => ad.placement === 'FOOTER_RIGHT'));
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.organizer?.toLowerCase().includes(query)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.start_at);

        if (dateFilter === 'today') {
          return eventDate >= today && eventDate < new Date(today.getTime() + 86400000);
        } else if (dateFilter === 'week') {
          const weekEnd = new Date(today.getTime() + 7 * 86400000);
          return eventDate >= today && eventDate < weekEnd;
        } else if (dateFilter === 'month') {
          const monthEnd = new Date(today.getTime() + 30 * 86400000);
          return eventDate >= today && eventDate < monthEnd;
        }

        return true;
      });
    }

    return filtered;
  }, [events, searchQuery, dateFilter]);

  const featuredEvents = useMemo(
    () => filteredEvents.filter((e) => e.is_featured).sort((a, b) => (a.featured_rank || 0) - (b.featured_rank || 0)),
    [filteredEvents]
  );

  const regularEvents = useMemo(
    () => filteredEvents.filter((e) => !e.is_featured),
    [filteredEvents]
  );

  const handleAdClick = (ad: PageAd | null) => {
    if (!ad || !ad.image_url) return;

    if (ad.action_type === 'redirect' && ad.redirect_url) {
      window.open(ad.redirect_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (ad.action_type === 'popup') {
      setPopupAd(ad);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="relative pt-[calc(128px+50px)] pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="flex items-center gap-1.5 text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4 flex-shrink-0" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-white font-medium">Events</span>
            </nav>

            <div className="flex gap-3">
              {user && (
                <button
                  onClick={() => navigate('/events/mine')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-all text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  My Events
                </button>
              )}
              <button
                onClick={() => user ? navigate('/events/new') : navigate('/auth')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Post Event
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8">
        {/* Top Banner Ads */}
        {(topLeftAds.length > 0 || topRightAds.length > 0) && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {leftRailAds.length > 0 && (
              <div className="hidden lg:block lg:col-span-2">
                <div className="sticky top-32 space-y-4">
                  {leftRailAds.filter((ad) => ad.image_url).map((ad) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={() => handleAdClick(ad)}
                      className="block w-full"
                    >
                      <img
                        src={ad.image_url!}
                        alt={ad.title}
                        className="w-full object-cover rounded-xl border border-slate-800 shadow-md"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`${leftRailAds.length > 0 ? 'lg:col-span-7' : 'lg:col-span-9'}`}>
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search events by title, city, or organizer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111827] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(['all', 'today', 'week', 'month'] as DateFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setDateFilter(filter)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                          dateFilter === filter
                            ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-glow'
                            : 'bg-[#111827] border border-slate-800 text-gray-300 hover:border-purple-500/50'
                        }`}
                      >
                        {filter === 'all' && 'All Events'}
                        {filter === 'today' && 'Today'}
                        {filter === 'week' && 'This Week'}
                        {filter === 'month' && 'This Month'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 mt-4">Loading events...</p>
                </div>
              ) : (
                <>
                  {featuredEvents.length > 0 && (
                    <section className="mb-12">
                      <div className="flex items-center gap-2 mb-6">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-2xl font-heading font-bold text-white">
                          Featured Events
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {featuredEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                            isFeatured
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h2 className="text-2xl font-heading font-bold text-white mb-6">
                      {featuredEvents.length > 0 ? 'All Events' : 'Events'}
                    </h2>
                    {regularEvents.length === 0 ? (
                      <div className="text-center py-12 bg-[#0b1220] border border-slate-800 rounded-2xl">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No events found</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Try adjusting your filters or check back later
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {regularEvents.map((event, index) => (
                          <>
                            <EventCard key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
                            {(index + 1) % 6 === 0 &&
                              index < regularEvents.length - 1 &&
                              inlineAds.length > 0 &&
                              inlineAds[Math.floor((index + 1) / 6) % inlineAds.length].image_url && (
                                <div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdClick(
                                        inlineAds[Math.floor((index + 1) / 6) % inlineAds.length]
                                      )
                                    }
                                    className="block w-full h-full relative"
                                  >
                                    <div className="absolute top-3 left-3 z-10">
                                      <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-sm text-yellow-400 text-xs font-semibold rounded-full border border-yellow-500/30">
                                        SPONSORED
                                      </span>
                                    </div>
                                    <img
                                      src={
                                        inlineAds[Math.floor((index + 1) / 6) % inlineAds.length]
                                          .image_url!
                                      }
                                      alt={
                                        inlineAds[Math.floor((index + 1) / 6) % inlineAds.length]
                                          .title
                                      }
                                      className="w-full aspect-[16/9] object-cover"
                                    />
                                  </button>
                                </div>
                              )}
                          </>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className={`${leftRailAds.length > 0 ? 'lg:col-span-3' : 'lg:col-span-3'} space-y-4`}>
              {rightSidebarAds.filter((ad) => ad.image_url).map((ad) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => handleAdClick(ad)}
                  className="block w-full"
                >
                  <img
                    src={ad.image_url!}
                    alt={ad.title}
                    className="w-full max-h-[420px] object-cover rounded-2xl border border-slate-800 shadow-md"
                  />
                </button>
              ))}
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
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {footerRightAds.filter(ad => ad.image_url).map((ad) => (
                <button key={ad.id} type="button" onClick={() => handleAdClick(ad)} className="block w-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded-xl border border-slate-800 shadow-md" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {popupAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setPopupAd(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 text-lg"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold text-white mb-4">{popupAd.title}</h2>

            <img
              src={popupAd.popup_image_url ?? popupAd.image_url ?? ''}
              alt={popupAd.title}
              className="w-full rounded-xl mb-4"
            />

            {popupAd.popup_description && (
              <p className="mb-4 text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {popupAd.popup_description}
              </p>
            )}

            {popupAd.redirect_url && (
              <a
                href={popupAd.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-md"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}

      <Footer />
    </div>
  );
}

function EventCard({
  event,
  onClick,
  isFeatured = false,
}: {
  event: Event;
  onClick: () => void;
  isFeatured?: boolean;
}) {
  const formatDateBadge = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const formatTime = (dateStr: string, endStr?: string | null) => {
    const startTime = dateStr.substring(11, 16);
    const [hours, minutes] = startTime.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedStart = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    if (endStr) {
      const endTime = endStr.substring(11, 16);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const endAmpm = endHours >= 12 ? 'PM' : 'AM';
      const endDisplayHours = endHours % 12 || 12;
      const formattedEnd = `${endDisplayHours}:${endMinutes.toString().padStart(2, '0')} ${endAmpm}`;
      return `${formattedStart} – ${formattedEnd}`;
    }

    return formattedStart;
  };

  const dateBadge = formatDateBadge(event.start_at);
  const cityText = event.is_online
    ? 'Online'
    : event.city && event.state
    ? `${event.city}, ${event.state}`
    : event.city || event.state || '';

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-slate-700" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center min-w-[60px]">
          <div className="text-2xl font-bold text-white leading-none">{dateBadge.day}</div>
          <div className="text-xs font-semibold text-purple-400 mt-1">{dateBadge.month}</div>
        </div>

        {cityText && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-white">{cityText}</span>
          </div>
        )}

        {isFeatured && (
          <div className="absolute bottom-3 left-3 bg-yellow-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
            <span className="text-xs font-bold text-slate-900">FEATURED</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-slate-50 mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {event.title}
        </h3>

        {(event.location_address || event.venue) && (
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-400 line-clamp-1">
              {event.location_address || event.venue}
            </span>
          </div>
        )}

        <p className="text-sm text-slate-400 mb-3 line-clamp-2 flex-1">{event.description}</p>

        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 pb-4 border-b border-slate-800">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{formatTime(event.start_at, event.end_at)}</span>
        </div>

        <div className="flex gap-2">
          {event.ticketing_url ? (
            <a
              href={event.ticketing_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all"
            >
              <Ticket className="w-4 h-4" />
              Buy Tickets
            </a>
          ) : event.registration_url ? (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Register
            </a>
          ) : (
            <button
              onClick={onClick}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold text-sm hover:shadow-glow transition-all"
            >
              Learn More
            </button>
          )}
          <button
            onClick={onClick}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-700 transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const formatDate = (dateStr: string, timezone?: string | null) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone || undefined,
    });
  };

  const formatTime = (dateStr: string) => {
    const time = dateStr.substring(11, 16);
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getFullAddress = () => {
    if (event.location_address) {
      return event.location_address;
    }
    const parts = [event.venue, event.street, event.city, event.state, event.zip]
      .filter(Boolean);
    return parts.join(', ');
  };

  const hasLocation = !event.is_online && (event.latitude && event.longitude);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Event Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {event.poster_url && (
            <img
              src={event.poster_url}
              alt={event.title}
              className="w-full max-h-80 object-cover rounded-xl"
            />
          )}

          <div>
            <h1 className="text-3xl font-bold text-white mb-6">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Date & Time</p>
                      <p className="text-white font-medium">{formatDate(event.start_at, event.timezone)}</p>
                      <p className="text-white text-sm mt-1">
                        {formatTime(event.start_at)}
                        {event.end_at && ` - ${formatTime(event.end_at)}`}
                      </p>
                      {event.timezone && (
                        <p className="text-xs text-gray-500 mt-1">{event.timezone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(event.location_address || event.venue || event.city || event.is_online) && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Location</p>
                        {event.is_online ? (
                          <p className="text-white font-medium">Online Event</p>
                        ) : event.location_address ? (
                          <p className="text-white">{event.location_address}</p>
                        ) : (
                          <div className="space-y-1">
                            {event.venue && <p className="text-white font-medium">{event.venue}</p>}
                            {event.street && <p className="text-white text-sm">{event.street}</p>}
                            {(event.city || event.state || event.zip) && (
                              <p className="text-white text-sm">
                                {[event.city, event.state, event.zip].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {event.organizer && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Organizer</p>
                    <p className="text-white font-medium">{event.organizer}</p>
                  </div>
                )}

                {event.phone && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Phone</p>
                    <a href={`tel:${event.phone}`} className="text-purple-400 hover:text-purple-300">{event.phone}</a>
                  </div>
                )}

                {event.email && (
                  <div className="bg-slate-900/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <a href={`mailto:${event.email}`} className="text-purple-400 hover:text-purple-300 break-all">{event.email}</a>
                  </div>
                )}
              </div>
            </div>

            {hasLocation && (
              <div className="mb-6">
                <GoogleMap
                  lat={event.latitude!}
                  lng={event.longitude!}
                  address={getFullAddress()}
                />
              </div>
            )}

            <div className="mb-6 bg-slate-900/50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-3">About This Event</h3>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>

            {event.youtube_url && (
              <div className="mb-6 bg-slate-900/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3">Video</h3>
                <a
                  href={event.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 break-all"
                >
                  {event.youtube_url}
                </a>
              </div>
            )}

            {(event.registration_url || event.ticketing_url || event.website_url || event.online_link) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Register Now
                  </a>
                )}
                {event.ticketing_url && (
                  <a
                    href={event.ticketing_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    Get Tickets
                  </a>
                )}
                {event.website_url && (
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}
                {event.online_link && event.is_online && (
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Online
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
