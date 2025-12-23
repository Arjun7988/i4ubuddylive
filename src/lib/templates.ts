import { supabase } from './supabase';
import type { TemplateCategory, EventTemplate, TemplateWithCategory } from '../types/templates';

export async function fetchTemplateCategories(activeOnly = false): Promise<TemplateCategory[]> {
  let query = supabase
    .from('template_categories')
    .select('*')
    .order('sort_order')
    .order('name');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function fetchTemplates(options?: {
  activeOnly?: boolean;
  categoryId?: string;
  search?: string;
}): Promise<TemplateWithCategory[]> {
  let query = supabase
    .from('event_templates')
    .select(`
      *,
      category:template_categories(*)
    `)
    .order('sort_order')
    .order('name');

  if (options?.activeOnly) {
    query = query.eq('is_active', true);
  }

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  const { data, error } = await query;

  if (error) throw error;

  let templates = (data || []) as TemplateWithCategory[];

  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.category?.name.toLowerCase().includes(searchLower)
    );
  }

  return templates;
}

export async function createTemplateCategory(
  category: Omit<TemplateCategory, 'id' | 'created_at'>
): Promise<TemplateCategory> {
  const { data, error } = await supabase
    .from('template_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplateCategory(
  id: string,
  updates: Partial<Omit<TemplateCategory, 'id' | 'created_at'>>
): Promise<TemplateCategory> {
  const { data, error } = await supabase
    .from('template_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplateCategory(id: string): Promise<void> {
  const { data: templates } = await supabase
    .from('event_templates')
    .select('id')
    .eq('category_id', id)
    .limit(1);

  if (templates && templates.length > 0) {
    throw new Error('Cannot delete category with existing templates');
  }

  const { error } = await supabase
    .from('template_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createTemplate(
  template: Omit<EventTemplate, 'id' | 'created_at' | 'category'>
): Promise<EventTemplate> {
  const { data, error } = await supabase
    .from('event_templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(
  id: string,
  updates: Partial<Omit<EventTemplate, 'id' | 'created_at' | 'category'>>
): Promise<EventTemplate> {
  const { data, error } = await supabase
    .from('event_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { data: events } = await supabase
    .from('rsvp_events')
    .select('id')
    .eq('template_id', id)
    .limit(1);

  if (events && events.length > 0) {
    throw new Error('Cannot delete template used by existing events');
  }

  const { error } = await supabase
    .from('event_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadTemplateImage(
  file: File,
  categorySlug: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `invite_templates/${categorySlug}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('invite_templates')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('invite_templates')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
