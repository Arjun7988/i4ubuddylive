import { supabase } from './supabase';
import type {
  Classified,
  ClassifiedFilters,
  ClassifiedFormData,
  PaginatedClassifieds,
  ClassifiedCategory,
  LocationCity
} from '../types/classifieds';

export async function getCategories(): Promise<ClassifiedCategory[]> {
  const { data, error } = await supabase
    .from('classified_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getClassifieds(filters: ClassifiedFilters = {}): Promise<PaginatedClassifieds> {
  const {
    search,
    categoryId,
    city,
    state,
    minPrice,
    maxPrice,
    condition,
    featuredOnly,
    topOnly,
    status,
    sort = 'newest',
    page = 1,
    pageSize = 12,
  } = filters;

  let query = supabase
    .from('classifieds')
    .select(`
      *,
      category:classified_categories(id, name, slug)
    `, { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (state) {
    query = query.ilike('state', `%${state}%`);
  }

  if (minPrice !== undefined) {
    query = query.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    query = query.lte('price', maxPrice);
  }

  if (condition && condition.length > 0) {
    query = query.in('condition', condition);
  }

  if (featuredOnly) {
    query = query.or('is_featured.eq.true,is_featured_classified.eq.true');
  }

  if (topOnly) {
    query = query.eq('is_top_classified', true);
  }

  // Filter to exclude top and featured posts (for latest classifieds)
  if (filters.excludeTopAndFeatured) {
    query = query.eq('is_top_classified', false);
    query = query.eq('is_featured_classified', false);
    query = query.eq('is_featured', false);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.eq('status', 'active');
  }

  query = query.order('is_top_classified', { ascending: false });
  query = query.order('is_featured', { ascending: false });
  query = query.order('is_featured_classified', { ascending: false });

  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true, nullsFirst: false });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false, nullsFirst: false });
      break;
    case 'most_viewed':
      query = query.order('views_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const classifiedsWithProfiles = await Promise.all(
    (data || []).map(async (classified) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', classified.created_by_id)
        .maybeSingle();

      return {
        ...classified,
        created_by: profile,
      };
    })
  );

  return {
    data: classifiedsWithProfiles,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getClassifiedById(id: string): Promise<Classified | null> {
  const { data, error } = await supabase
    .from('classifieds')
    .select(`
      *,
      category:classified_categories(id, name, slug)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', data.created_by_id)
    .maybeSingle();

  return {
    ...data,
    created_by: profile,
  };
}

export async function createClassified(formData: ClassifiedFormData, userId: string): Promise<Classified> {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + formData.duration_days);

  const cleanedData = {
    title: formData.title,
    description: formData.description,
    category_id: formData.category_id || null,
    price: formData.price,
    currency: formData.currency || 'USD',
    condition: formData.condition || null,
    city: formData.is_all_cities ? 'ALL' : (formData.city || null),
    state: formData.is_all_cities ? null : (formData.state || null),
    country: formData.country || 'USA',
    zipcode: formData.zipcode,
    contact_email: formData.contact_email,
    contact_phone: formData.contact_phone || null,
    images: formData.images,
    created_by_id: userId,
    status: 'pending',
    duration_days: formData.duration_days,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    is_all_cities: formData.is_all_cities,
    all_cities_fee: formData.all_cities_fee,
    is_top_classified: formData.is_top_classified,
    is_featured_classified: formData.is_featured_classified,
    top_amount: formData.top_amount,
    featured_amount: formData.featured_amount,
    total_amount: formData.total_amount,
    terms_accepted: formData.terms_accepted,
  };

  const { data, error } = await supabase
    .from('classifieds')
    .insert(cleanedData)
    .select(`
      *,
      category:classified_categories(id, name, slug)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateClassified(id: string, formData: Partial<ClassifiedFormData>): Promise<Classified> {
  const cleanedData: any = {};

  if (formData.title !== undefined) cleanedData.title = formData.title;
  if (formData.description !== undefined) cleanedData.description = formData.description;
  if (formData.category_id !== undefined) cleanedData.category_id = formData.category_id || null;
  if (formData.price !== undefined) cleanedData.price = formData.price;
  if (formData.currency !== undefined) cleanedData.currency = formData.currency || 'USD';
  if (formData.condition !== undefined) cleanedData.condition = formData.condition || null;
  if (formData.zipcode !== undefined) cleanedData.zipcode = formData.zipcode;
  if (formData.contact_email !== undefined) cleanedData.contact_email = formData.contact_email;
  if (formData.contact_phone !== undefined) cleanedData.contact_phone = formData.contact_phone || null;
  if (formData.images !== undefined) cleanedData.images = formData.images;

  if (formData.is_all_cities !== undefined) {
    cleanedData.is_all_cities = formData.is_all_cities;
    if (formData.is_all_cities) {
      cleanedData.city = 'ALL';
      cleanedData.state = null;
    } else {
      if (formData.city !== undefined) cleanedData.city = formData.city || null;
      if (formData.state !== undefined) cleanedData.state = formData.state || null;
    }
  } else {
    if (formData.city !== undefined) cleanedData.city = formData.city || null;
    if (formData.state !== undefined) cleanedData.state = formData.state || null;
  }

  if (formData.country !== undefined) cleanedData.country = formData.country || 'USA';
  if (formData.duration_days !== undefined) {
    cleanedData.duration_days = formData.duration_days;
    const { data: existing } = await supabase
      .from('classifieds')
      .select('start_date')
      .eq('id', id)
      .single();
    if (existing) {
      const endDate = new Date(existing.start_date);
      endDate.setDate(endDate.getDate() + formData.duration_days);
      cleanedData.end_date = endDate.toISOString();
    }
  }
  if (formData.all_cities_fee !== undefined) cleanedData.all_cities_fee = formData.all_cities_fee;
  if (formData.is_top_classified !== undefined) cleanedData.is_top_classified = formData.is_top_classified;
  if (formData.is_featured_classified !== undefined) cleanedData.is_featured_classified = formData.is_featured_classified;
  if (formData.top_amount !== undefined) cleanedData.top_amount = formData.top_amount;
  if (formData.featured_amount !== undefined) cleanedData.featured_amount = formData.featured_amount;
  if (formData.total_amount !== undefined) cleanedData.total_amount = formData.total_amount;
  if (formData.terms_accepted !== undefined) cleanedData.terms_accepted = formData.terms_accepted;

  const { data, error } = await supabase
    .from('classifieds')
    .update(cleanedData)
    .eq('id', id)
    .select(`
      *,
      category:classified_categories(id, name, slug)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateClassifiedStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('classifieds')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function toggleFeatured(id: string, isFeatured: boolean): Promise<void> {
  const { error } = await supabase
    .from('classifieds')
    .update({ is_featured: isFeatured })
    .eq('id', id);

  if (error) throw error;
}

export async function incrementViews(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_classified_views', { classified_id: id });

  if (error) {
    const { data } = await supabase
      .from('classifieds')
      .select('views_count')
      .eq('id', id)
      .single();

    if (data) {
      await supabase
        .from('classifieds')
        .update({ views_count: data.views_count + 1 })
        .eq('id', id);
    }
  }
}

export async function deleteClassified(id: string): Promise<void> {
  const { error } = await supabase
    .from('classifieds')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export interface PostingLimitInfo {
  can_post: boolean;
  posts_available: number;
  posts_used: number;
  days_until_slot1_unlock: number;
  days_until_slot2_unlock: number | null;
  oldest_post_date: string | null;
}

export async function checkUserPostingLimit(userId: string): Promise<PostingLimitInfo> {
  const { data, error } = await supabase.rpc('check_user_15day_posting_limit', { user_uuid: userId });

  if (error) throw error;
  return data;
}

export async function searchCities(query: string): Promise<LocationCity[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('locations_cities')
    .select('*')
    .ilike('city', `${query}%`)
    .eq('is_active', true)
    .order('city')
    .limit(10);

  if (error) throw error;
  return data || [];
}
