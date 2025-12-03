export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// Optional: describe one editable field (matches what we use in admin + editor)
export interface EditableField {
  key: string;
  label: string;
  bindTo?: string | null;
  x: number;        // 0–100
  y: number;        // 0–100
  fontSize: number;
  color: string;
}

export interface EventTemplate {
  id: string;
  category_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string | null;

  // 👇 IMPORTANT: this can be JSON array or JSON string or null
  editable_fields?: EditableField[] | string | null;

  is_active: boolean;
  sort_order: number;
  created_at: string;
  category?: TemplateCategory | null;
}

// Single, clean definition
export interface TemplateWithCategory extends EventTemplate {
  category: TemplateCategory | null;
}
