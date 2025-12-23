import { useEffect, useState } from 'react';
import { Shield, Users, Package, CheckCircle, XCircle, Eye, Edit2, Trash2, Calendar } from 'lucide-react';
import { GlowingCard } from '../components/GlowingCard';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import type { Classified } from '../types/classifieds';
import { StatusBadge } from '../components/classifieds/StatusBadge';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalClassifieds: number;
  pendingClassifieds: number;
  activeClassifieds: number;
  totalEvents: number;
  pendingEvents: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  category: string;
  ticket_price: number;
  total_tickets: number;
  available_tickets: number;
  poster_url: string;
  status: string;
  created_by: string;
  created_at: string;
  organizer?: {
    full_name: string;
    email: string;
  };
}

export function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClassifieds: 0,
    pendingClassifieds: 0,
    activeClassifieds: 0,
    totalEvents: 0,
    pendingEvents: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [classifieds, setClassifieds] = useState<Classified[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'classifieds' | 'events'>('overview');

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (!data?.is_admin) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [usersResult, classifiedsResult, eventsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, is_admin, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('classifieds')
          .select(`
            *,
            category:classified_categories(id, name, slug)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_created_by_fkey(full_name, email)
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (classifiedsResult.error) throw classifiedsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const userData = usersResult.data || [];
      const classifiedData = classifiedsResult.data || [];
      const eventData = eventsResult.data || [];

      setUsers(userData);
      setClassifieds(classifiedData);
      setEvents(eventData);

      setStats({
        totalUsers: userData.length,
        totalClassifieds: classifiedData.length,
        pendingClassifieds: classifiedData.filter(c => c.status === 'pending').length,
        activeClassifieds: classifiedData.filter(c => c.status === 'active').length,
        totalEvents: eventData.length,
        pendingEvents: eventData.filter(e => e.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} admin privileges?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      await loadAdminData();
      alert('Admin status updated successfully!');
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const handleUpdateClassifiedStatus = async (classifiedId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('classifieds')
        .update({ status: newStatus })
        .eq('id', classifiedId);

      if (error) throw error;
      await loadAdminData();
      alert('Classified status updated successfully!');
    } catch (error) {
      console.error('Error updating classified status:', error);
      alert('Failed to update classified status');
    }
  };

  const handleDeleteClassified = async (classifiedId: string) => {
    if (!confirm('Are you sure you want to delete this classified? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('classifieds')
        .delete()
        .eq('id', classifiedId);

      if (error) throw error;
      await loadAdminData();
      alert('Classified deleted successfully!');
    } catch (error) {
      console.error('Error deleting classified:', error);
      alert('Failed to delete classified');
    }
  };

  const handleUpdateEventStatus = async (eventId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId);

      if (error) throw error;
      await loadAdminData();
      alert('Event status updated successfully!');
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadAdminData();
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl" />

      <main className="relative flex-1 pt-[calc(128px+50px)] container mx-auto px-4 w-full">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary-400" />
            <div>
          <h1 className="text-3xl font-heading font-bold text-white">Master Admin</h1>
          <p className="text-gray-400">System-wide management and administration</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/50 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-gradient-primary text-white shadow-glow'
              : 'text-gray-400 hover:text-white hover:bg-surface/50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-gradient-primary text-white shadow-glow'
              : 'text-gray-400 hover:text-white hover:bg-surface/50'
          }`}
        >
          Users ({stats.totalUsers})
        </button>
        <button
          onClick={() => setActiveTab('classifieds')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'classifieds'
              ? 'bg-gradient-primary text-white shadow-glow'
              : 'text-gray-400 hover:text-white hover:bg-surface/50'
          }`}
        >
          Classifieds ({stats.totalClassifieds})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-gradient-primary text-white shadow-glow'
              : 'text-gray-400 hover:text-white hover:bg-surface/50'
          }`}
        >
          Events ({stats.totalEvents})
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GlowingCard>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </GlowingCard>

          <GlowingCard>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Classifieds</p>
                <p className="text-2xl font-bold text-white">{stats.totalClassifieds}</p>
              </div>
            </div>
          </GlowingCard>

          <GlowingCard>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
              </div>
            </div>
          </GlowingCard>

          <GlowingCard>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary-400" />
              <div>
                <p className="text-sm text-gray-400">Active Classifieds</p>
                <p className="text-2xl font-bold text-white">{stats.activeClassifieds}</p>
              </div>
            </div>
          </GlowingCard>

          <GlowingCard>
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Pending Classifieds</p>
                <p className="text-2xl font-bold text-white">{stats.pendingClassifieds}</p>
              </div>
            </div>
          </GlowingCard>

          <GlowingCard>
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Pending Events</p>
                <p className="text-2xl font-bold text-white">{stats.pendingEvents}</p>
              </div>
            </div>
          </GlowingCard>
        </div>
      )}

      {activeTab === 'users' && (
        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-4">User Management</h2>
          <div className="space-y-2">
            {users.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white">{profile.full_name || 'No name'}</p>
                    {profile.is_admin && (
                      <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    profile.is_admin
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
                  }`}
                >
                  {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                </button>
              </div>
            ))}
          </div>
        </GlowingCard>
      )}

      {activeTab === 'classifieds' && (
        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-4">Classified Management</h2>
          <div className="space-y-3">
            {classifieds.map((classified) => (
              <div
                key={classified.id}
                className="flex items-start justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {classified.images[0] && (
                      <img
                        src={classified.images[0]}
                        alt={classified.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/classifieds/${classified.id}`}
                          className="font-medium text-white hover:text-primary-400 transition-colors truncate"
                        >
                          {classified.title}
                        </Link>
                        <StatusBadge status={classified.status} />
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {classified.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {classified.category && (
                          <span>{classified.category.name}</span>
                        )}
                        {classified.price && (
                          <span className="font-semibold text-primary-400">
                            {classified.currency} {classified.price.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {classified.views_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={classified.status}
                    onChange={(e) => handleUpdateClassifiedStatus(classified.id, e.target.value)}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Link to={`/classifieds/${classified.id}/edit`}>
                    <button className="p-2 hover:bg-primary-500/10 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-primary-400" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeleteClassified(classified.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlowingCard>
      )}

      {activeTab === 'events' && (
        <GlowingCard>
          <h2 className="text-xl font-heading font-semibold text-white mb-4">Events Management</h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-4 bg-surface/50 rounded-lg border border-border hover:border-primary-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    {event.poster_url && (
                      <img
                        src={event.poster_url}
                        alt={event.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white truncate">{event.title}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          event.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          event.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{event.category}</span>
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        <span>{event.location}</span>
                        {event.ticket_price > 0 && (
                          <span className="font-semibold text-primary-400">
                            ${event.ticket_price}
                          </span>
                        )}
                        <span>{event.available_tickets}/{event.total_tickets} tickets</span>
                      </div>
                      {event.organizer && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {event.organizer.full_name} ({event.organizer.email})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={event.status}
                    onChange={(e) => handleUpdateEventStatus(event.id, e.target.value)}
                    className="px-3 py-1 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events found</p>
              </div>
            )}
          </div>
        </GlowingCard>
      )}
        </div>
      </main>
      <div className="mt-[50px]"><Footer /></div>
    </div>
  );
}
