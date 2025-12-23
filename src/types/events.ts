export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface Event {
  id: string;
  created_at: string;
  created_by: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string | null;
  venue: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  pincode: string | null;
  is_online: boolean;
  online_link: string | null;
  organizer: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  poster_url: string | null;
  registration_url: string | null;
  ticketing_url: string | null;
  youtube_url: string | null;
  status: EventStatus;
  is_featured: boolean;
  featured_rank: number | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_mode: 'location_only' | 'online_only' | 'location_and_online';
  fax: string | null;
  eknazar_city: string | null;
  has_seat_selection: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  start_at: string;
  end_at?: string;
  venue?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  pincode?: string;
  is_online: boolean;
  online_link?: string;
  organizer?: string;
  phone?: string;
  email?: string;
  website_url?: string;
  registration_url?: string;
  ticketing_url?: string;
  poster_file?: File;
}

export type DateFilter = 'all' | 'today' | 'week' | 'month';
