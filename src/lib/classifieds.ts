import { supabase } from './supabase';
import type {
  Classified,
  ClassifiedFilters,
  ClassifiedFormData,
  PaginatedClassifieds,
  ClassifiedCategory
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
    query = query.eq('is_featured', true);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.eq('status', 'active');
  }

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

  return {
    data: data || [],
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
  return data;
}

export async function createClassified(formData: ClassifiedFormData, userId: string): Promise<Classified> {
  const cleanedData = {
    title: formData.title,
    description: formData.description,
    category_id: formData.category_id || null,
    price: formData.price,
    currency: formData.currency || 'USD',
    condition: formData.condition || null,
    city: formData.city || null,
    state: formData.state || null,
    country: formData.country || 'USA',
    contact_email: formData.contact_email,
    contact_phone: formData.contact_phone || null,
    images: formData.images,
    created_by_id: userId,
    status: 'pending',
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
  if (formData.city !== undefined) cleanedData.city = formData.city || null;
  if (formData.state !== undefined) cleanedData.state = formData.state || null;
  if (formData.country !== undefined) cleanedData.country = formData.country || 'USA';
  if (formData.contact_email !== undefined) cleanedData.contact_email = formData.contact_email;
  if (formData.contact_phone !== undefined) cleanedData.contact_phone = formData.contact_phone || null;
  if (formData.images !== undefined) cleanedData.images = formData.images;

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
  const { data, error } = await supabase.rpc('check_user_30day_posting_limit', { user_uuid: userId });

  if (error) throw error;
  return data;
}
