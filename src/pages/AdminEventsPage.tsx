import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Clock,
  MapPin,
  Globe,
  Phone,
  Mail,
  User,
  Video,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { GradientButton } from '../components/GradientButton';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AdminHeader } from '../components/AdminHeader';
import { AdminFooter } from '../components/AdminFooter';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  venue: string | null;
  zip: string | null;
  is_online: boolean;
  online_link: string | null;
  organizer: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  youtube_url: string | null;
  registration_url: string | null;
  ticketing_url: string | null;
  has_seat_selection: boolean;
  poster_url: string | null;
  status: string;
  is_featured: boolean;
  featured_rank: number | null;
  attendance_mode: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminEventsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    try {
      setAdminUser(JSON.parse(userStr));
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*, admin_users(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !session) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        navigate('/master-admin/login');
        return;
      }

      loadEvents();
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/master-admin/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!token) {
        setPasswordError('Session expired. Please login again.');
        setTimeout(() => navigate('/master-admin/login'), 2000);
        return;
      }
      const url = `${supabaseUrl}/functions/v1/admin-users`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          if (responseData.error === 'Current password is incorrect') {
            setPasswordError('Current password is incorrect');
          } else {
            setPasswordError('Session expired. Please login again.');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setTimeout(() => navigate('/master-admin/login'), 2000);
          }
          return;
        }
        throw new Error(responseData.error || 'Failed to change password');
      }
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password: ' + (error as Error).message);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-events`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const result = await response.json();
      setEvents(result.data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve event');
      }

      setEvents(events.map((e) => (e.id === eventId ? { ...e, status: 'approved' } : e)));
      setSuccess('Event approved successfully!');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error approving event:', error);
      setError('Failed to approve event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject event');
      }

      setEvents(events.map((e) => (e.id === eventId ? { ...e, status: 'rejected' } : e)));
      setSuccess('Event rejected!');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error rejecting event:', error);
      setError('Failed to reject event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeature = async (eventId: string, featured: boolean) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: featured }),
      });

      if (!response.ok) {
        throw new Error('Failed to update featured status');
      }

      setEvents(events.map((e) => (e.id === eventId ? { ...e, is_featured: featured } : e)));
      setSuccess(featured ? 'Event featured!' : 'Event unfeatured!');
    } catch (error) {
      console.error('Error updating featured status:', error);
      setError('Failed to update featured status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/admin-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Admin-Token': token || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(events.filter((e) => e.id !== eventId));
      setSuccess('Event deleted successfully!');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart ? timePart.substring(0, 5).split(':') : ['00', '00'];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];

    let displayHour = parseInt(hour);
    const ampm = displayHour >= 12 ? 'PM' : 'AM';
    displayHour = displayHour % 12 || 12;

    return `${monthName} ${parseInt(day)}, ${year}, ${displayHour}:${minute} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      <AdminHeader
        adminName={adminUser?.full_name}
        showBackButton={true}
        onChangePassword={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-200">{success}</p>
          </div>
        )}

        <GlowingCard className="mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, city, or organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-gradient-primary text-white shadow-glow'
                        : 'bg-surface border border-border text-gray-300 hover:border-primary-500/50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlowingCard>

        {loading ? (
          <GlowingCard>
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading events...</p>
            </div>
          </GlowingCard>
        ) : filteredEvents.length === 0 ? (
          <GlowingCard>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No events found</p>
            </div>
          </GlowingCard>
        ) : (
          <div className="glass glass-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {event.poster_url && (
                            <img src={event.poster_url} alt={event.title} className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">{event.title}</div>
                            {event.is_featured && (
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-400 mt-1">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-400">{formatDateTime(event.start_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-400">
                          {event.is_online ? 'Online' : event.city && event.state ? `${event.city}, ${event.state}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-400">{event.organizer || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={actionLoading}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass glass-border rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedEvent.title}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {selectedEvent.poster_url && (
                <div>
                  <img
                    src={selectedEvent.poster_url}
                    alt={selectedEvent.title}
                    className="w-full max-h-80 object-cover rounded-xl border border-white/10"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide">Description</label>
                <p className="text-white mt-1 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Date & Time</label>
                    <div className="flex items-start gap-2 text-white">
                      <Calendar className="w-4 h-4 text-purple-400 mt-1" />
                      <div>
                        <p>{formatDateTime(selectedEvent.start_at)}</p>
                        {selectedEvent.end_at && <p className="text-sm text-gray-400">Until {formatDateTime(selectedEvent.end_at)}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Location</label>
                    <div className="flex items-start gap-2 text-white">
                      <MapPin className="w-4 h-4 text-purple-400 mt-1" />
                      <div className="flex-1">
                        {selectedEvent.is_online ? (
                          <p>Online Event</p>
                        ) : (
                          <div>
                            {selectedEvent.venue && <p>{selectedEvent.venue}</p>}
                            {selectedEvent.street && <p className="text-sm text-gray-400">{selectedEvent.street}</p>}
                            {(selectedEvent.city || selectedEvent.state || selectedEvent.zip) && (
                              <p className="text-sm text-gray-400">
                                {[selectedEvent.city, selectedEvent.state, selectedEvent.zip].filter(Boolean).join(', ')}
                              </p>
                            )}
                            {(selectedEvent.city || selectedEvent.street) && (
                              <div className="mt-3">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    [selectedEvent.venue, selectedEvent.street, selectedEvent.city, selectedEvent.state, selectedEvent.zip]
                                      .filter(Boolean)
                                      .join(', ')
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                                >
                                  <Globe className="w-4 h-4" />
                                  Open in Google Maps
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedEvent.online_link && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Online Link</label>
                      <a href={selectedEvent.online_link} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {selectedEvent.online_link}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedEvent.organizer && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Organizer</label>
                      <div className="flex items-center gap-2 text-white">
                        <User className="w-4 h-4 text-purple-400" />
                        <span>{selectedEvent.organizer}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.phone && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Phone</label>
                      <a href={`tel:${selectedEvent.phone}`} className="flex items-center gap-2 text-primary-400 hover:underline">
                        <Phone className="w-4 h-4" />
                        {selectedEvent.phone}
                      </a>
                    </div>
                  )}

                  {selectedEvent.email && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Email</label>
                      <a href={`mailto:${selectedEvent.email}`} className="flex items-center gap-2 text-primary-400 hover:underline break-all">
                        <Mail className="w-4 h-4" />
                        {selectedEvent.email}
                      </a>
                    </div>
                  )}

                  {selectedEvent.website_url && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Website</label>
                      <a href={selectedEvent.website_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center gap-2 break-all">
                        <ExternalLink className="w-4 h-4" />
                        {selectedEvent.website_url}
                      </a>
                    </div>
                  )}

                  {selectedEvent.youtube_url && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">YouTube</label>
                      <a href={selectedEvent.youtube_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center gap-2 break-all">
                        <Video className="w-4 h-4" />
                        {selectedEvent.youtube_url}
                      </a>
                    </div>
                  )}

                  {selectedEvent.registration_url && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Registration</label>
                      <a href={selectedEvent.registration_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center gap-2 break-all">
                        <ExternalLink className="w-4 h-4" />
                        {selectedEvent.registration_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Attendance Mode</label>
                  <p className="text-white mt-1">{selectedEvent.attendance_mode?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Submitted</label>
                  <p className="text-white mt-1">{formatDateTime(selectedEvent.created_at)}</p>
                </div>
              </div>

              {selectedEvent.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleApprove(selectedEvent.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedEvent.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {selectedEvent.status !== 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {selectedEvent.status === 'approved' && !selectedEvent.is_featured && (
                    <button
                      onClick={() => handleFeature(selectedEvent.id, true)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                    >
                      <Star className="w-4 h-4" />
                      Feature
                    </button>
                  )}
                  {selectedEvent.is_featured && (
                    <button
                      onClick={() => handleFeature(selectedEvent.id, false)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-500/20 border border-gray-500/30 text-gray-400 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                    >
                      <StarOff className="w-4 h-4" />
                      Unfeature
                    </button>
                  )}
                  {selectedEvent.status === 'rejected' && (
                    <button
                      onClick={() => handleApprove(selectedEvent.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                  {selectedEvent.status === 'approved' && (
                    <button
                      onClick={() => handleReject(selectedEvent.id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminFooter />

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordError('');
        }}
        title="Change Admin Password"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {passwordError}
            </div>
          )}
          <Input
            type="password"
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            placeholder="Enter current password"
            required
          />
          <Input
            type="password"
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            placeholder="Enter new password (min 8 characters)"
            required
          />
          <Input
            type="password"
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
          />
          <div className="flex gap-3 pt-4">
            <GradientButton onClick={handleChangePassword} className="flex-1">
              Change Password
            </GradientButton>
            <GradientButton
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
