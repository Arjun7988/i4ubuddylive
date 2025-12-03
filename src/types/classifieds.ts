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
  contact_email: string | null;
  contact_phone: string | null;
  images: string[];
  is_featured: boolean;
  status: ClassifiedStatus;
  views_count: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
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
  contact_email: string;
  contact_phone: string;
  images: string[];
}

export interface PaginatedClassifieds {
  data: Classified[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
