export type ClassifiedCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';
export type ClassifiedStatus = 'active' | 'pending' | 'sold' | 'archived';
export type ClassifiedSortOption = 'newest' | 'price_asc' | 'price_desc' | 'most_viewed';

export interface ClassifiedCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Classified {
  id: string;
  title: string;
  description: string;
  category_id: string;
  price: number | null;
  currency: string;
  condition: ClassifiedCondition;
  city: string | null;
  state: string | null;
  country: string | null;
  zipcode: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  images: string[];
  is_featured: boolean;
  status: ClassifiedStatus;
  views_count: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  duration_days: number;
  start_date: string;
  end_date: string | null;
  is_all_cities: boolean;
  all_cities_fee: number;
  is_top_classified: boolean;
  is_featured_classified: boolean;
  top_amount: number;
  featured_amount: number;
  total_amount: number;
  terms_accepted: boolean;
  category?: ClassifiedCategory;
  created_by?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface ClassifiedFilters {
  search?: string;
  categoryId?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ClassifiedCondition[];
  featuredOnly?: boolean;
  topOnly?: boolean;
  excludeTopAndFeatured?: boolean;
  status?: ClassifiedStatus;
  sort?: ClassifiedSortOption;
  page?: number;
  pageSize?: number;
}

export interface ClassifiedFormData {
  title: string;
  description: string;
  category_id: string;
  price: number | null;
  currency: string;
  condition: ClassifiedCondition;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  contact_email: string;
  contact_phone: string;
  images: string[];
  duration_days: number;
  is_all_cities: boolean;
  all_cities_fee: number;
  is_top_classified: boolean;
  is_featured_classified: boolean;
  top_amount: number;
  featured_amount: number;
  total_amount: number;
  terms_accepted: boolean;
}

export interface LocationCity {
  id: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
}

export interface PaginatedClassifieds {
  data: Classified[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
