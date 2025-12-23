import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, CheckCircle, XCircle, HelpCircle, Edit2, Trash2, Copy, Check, Share2, ExternalLink, Home, ChevronRight } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { PageBanner } from '../components/PageBanner';
import { Modal } from '../components/Modal';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  max_attendees: number | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  share_token: string | null;
}

interface Response {
  id: string;
  event_id: string;
  guest_name: string;
  guest_email: string;
  response: 'yes' | 'no' | 'maybe';
  guests_count: number;
  dietary_restrictions: string | null;
  notes: string | null;
}

export function RSVPPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [user]);

  useEffect(() => {
    const createdEventId = searchParams.get('created');
    if (createdEventId && events.length > 0) {
      const event = events.find(e => e.id === createdEventId);
      if (event) {
        setShareEvent(event);
        setShowShareModal(true);
        setSearchParams({});
      }
    }
  }, [events, searchParams]);

  const loadEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rsvp_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error loading responses:', error);
    }
  };

  const handleViewEvent = async (event: Event) => {
    setSelectedEvent(event);
    await loadResponses(event.id);
    setIsViewModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { error } = await supabase.from('rsvp_events').delete().eq('id', eventId);

      if (error) throw error;

      alert('Event deleted successfully!');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const getShareLink = (event: Event) => {
    if (!event.share_token) return '';
    return `${window.location.origin}/rsvp/r/${event.share_token}`;
  };

  const copyShareLink = (event: Event) => {
    const link = getShareLink(event);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = (event: Event) => {
    setShareEvent(event);
    setShowShareModal(true);
  };

  const getResponseCounts = (eventResponses: Response[]) => {
    const yes = eventResponses.filter((r) => r.response === 'yes').length;
    const no = eventResponses.filter((r) => r.response === 'no').length;
    const maybe = eventResponses.filter((r) => r.response === 'maybe').length;
    const totalGuests = eventResponses
      .filter((r) => r.response === 'yes')
      .reduce((sum, r) => sum + r.guests_count, 0);

    return { yes, no, maybe, totalGuests };
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
        <div className="space-y-6">
          <nav className="flex items-center gap-2 text-sm mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-white font-medium">RSVP</span>
          </nav>

          {user ? (
            <PageBanner
              title="Event Management"
              description="Create memorable events and track RSVPs effortlessly. Send invitations, manage guest lists, and get real-time responses."
              icon={Calendar}
              gradient="cyan"
              pattern="waves"
              action={{
                label: 'Create Event',
                onClick: () => navigate('/rsvp/create'),
              }}
              stats={[
                { label: 'My Events', value: events.length, icon: Calendar },
                { label: 'Active Events', value: events.filter(e => e.is_active).length, icon: CheckCircle },
              ]}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">RSVP</h1>
                <p className="text-gray-400">Create and manage event invitations</p>
              </div>
            </div>
          )}

      {!user ? (
        <div className="space-y-8">
          <GlowingCard>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-block p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl">
                  <Calendar className="w-12 h-12 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Effortless Event Planning
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    Create stunning event invitations, track RSVPs in real-time, and manage your guest list with ease.
                    Perfect for weddings, parties, corporate events, and more.
                  </p>
                  <GradientButton onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                    Get Started - It's Free
                  </GradientButton>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Create Beautiful Invitations</h3>
                      <p className="text-gray-400 text-sm">Design custom event pages with all the details your guests need</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Users className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Track Responses Instantly</h3>
                      <p className="text-gray-400 text-sm">See who's coming, who's not, and manage guest counts in real-time</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Share2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Easy Guest Access</h3>
                      <p className="text-gray-400 text-sm">Share a simple link - no account required for guests to RSVP</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlowingCard>

          <div className="grid md:grid-cols-3 gap-6">
            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl">
                  <Calendar className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Smart Scheduling</h3>
                <p className="text-gray-400 text-sm">
                  Set dates, times, and locations. Send reminders and updates to all guests automatically.
                </p>
              </div>
            </GlowingCard>

            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Guest Management</h3>
                <p className="text-gray-400 text-sm">
                  Track dietary preferences, plus-ones, and special notes from each guest response.
                </p>
              </div>
            </GlowingCard>

            <GlowingCard>
              <div className="text-center space-y-3">
                <div className="inline-block p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl">
                  <MapPin className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Location Details</h3>
                <p className="text-gray-400 text-sm">
                  Add venue information and directions so guests know exactly where to go.
                </p>
              </div>
            </GlowingCard>
          </div>

          <GlowingCard>
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Create Your First Event?
              </h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Join thousands of event organizers who trust i4uBuddy for their event management needs.
                Start planning your perfect event today.
              </p>
              <GradientButton onClick={() => navigate('/auth')} size="lg">
                Sign In to Get Started
              </GradientButton>
            </div>
          </GlowingCard>
        </div>
      ) : events.length === 0 ? (
        <GlowingCard>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No events yet</p>
            <GradientButton onClick={() => navigate('/rsvp/create')}>
              Create Your First Event
            </GradientButton>
          </div>
        </GlowingCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => {
            const isPast = new Date(event.event_date) < new Date();

            return (
              <GlowingCard key={event.id}>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                      )}
                    </div>
                    {isPast && (
                      <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                        Past
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4 text-primary-400" />
                      <span className="text-sm">{formatDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4 text-primary-400" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-4 h-4 text-primary-400" />
                        <span className="text-sm">Max {event.max_attendees} attendees</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <GradientButton
                      onClick={() => handleViewEvent(event)}
                      variant="secondary"
                      className="flex-1"
                    >
                      View Responses
                    </GradientButton>
                    <GradientButton
                      onClick={() => handleShareClick(event)}
                      variant="secondary"
                      className="px-4"
                      title="Share Event"
                    >
                      <Share2 className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      onClick={() => navigate(`/rsvp/edit/${event.id}`)}
                      variant="secondary"
                      className="px-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-4 bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </GradientButton>
                  </div>
                </div>
              </GlowingCard>
            );
          })}
        </div>
      )}

      {selectedEvent && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedEvent(null);
            setResponses([]);
          }}
          title={selectedEvent.title}
          size="2xl"
        >
          <div className="grid lg:grid-cols-[1fr,300px] gap-6">
            {/* Main Content - Table View */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{formatDate(selectedEvent.event_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{selectedEvent.location}</span>
                </div>
                {selectedEvent.description && (
                  <p className="text-gray-400 text-sm pt-2">{selectedEvent.description}</p>
                )}
              </div>

              {/* Response Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Yes</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {getResponseCounts(responses).yes}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getResponseCounts(responses).totalGuests} guests
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">No</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {getResponseCounts(responses).no}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Maybe</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {getResponseCounts(responses).maybe}
                  </p>
                </div>
              </div>

              {/* Table View */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Guest Responses ({responses.length})
                </h3>

                {responses.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No responses yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Response</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">Guests</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Dietary</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.map((response) => (
                          <tr key={response.id} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                            <td className="py-3 px-4">
                              <p className="text-white font-medium text-sm">{response.guest_name}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-gray-400 text-sm">{response.guest_email}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                  response.response === 'yes'
                                    ? 'bg-green-500/20 text-green-400'
                                    : response.response === 'no'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {response.response.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <p className="text-gray-300 text-sm">
                                {response.response === 'yes' ? response.guests_count : '-'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-gray-400 text-sm">
                                {response.dietary_restrictions || '-'}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-gray-400 text-sm max-w-[200px] truncate" title={response.notes || ''}>
                                {response.notes || '-'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Ads */}
            <div className="space-y-4">
              <div className="sticky top-4 space-y-4">
                {/* Ad 1 */}
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-glow">
                  <h4 className="font-bold text-lg mb-2">Event Planning Made Easy</h4>
                  <p className="text-sm text-white/90 mb-4">
                    Professional event management tools for your perfect occasion
                  </p>
                  <button className="text-sm font-semibold hover:underline">
                    Learn More →
                  </button>
                </div>

                {/* Ad 2 */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-glow">
                  <h4 className="font-bold text-lg mb-2">Premium Features</h4>
                  <p className="text-sm text-white/90 mb-4">
                    Unlock advanced RSVP tracking and guest management
                  </p>
                  <button className="text-sm font-semibold hover:underline">
                    Upgrade Now →
                  </button>
                </div>

                {/* Ad 3 */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-glow">
                  <h4 className="font-bold text-lg mb-2">Invite Templates</h4>
                  <p className="text-sm text-white/90 mb-4">
                    Beautiful invitation designs for every occasion
                  </p>
                  <button className="text-sm font-semibold hover:underline">
                    Browse Templates →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {shareEvent && (
        <Modal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareEvent(null);
            setCopied(false);
          }}
          title="Share Event Link"
        >
          <div className="space-y-4">
            <p className="text-gray-400">
              Share this link with guests to let them RSVP to your event:
            </p>

            <div className="p-4 bg-surface/50 rounded-lg border border-border">
              <p className="text-sm text-gray-300 break-all">{getShareLink(shareEvent)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(getShareLink(shareEvent), '_blank')}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-gray-300 hover:bg-surface/50 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                View Event
              </button>
              <GradientButton
                onClick={() => copyShareLink(shareEvent)}
                className="flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </GradientButton>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-gray-400 mb-3">
                Guests can use this link to RSVP without creating an account.
              </p>
              <p className="text-xs text-gray-500">
                Tip: You can share this link via email, text message, or social media.
              </p>
            </div>
          </div>
        </Modal>
      )}
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
