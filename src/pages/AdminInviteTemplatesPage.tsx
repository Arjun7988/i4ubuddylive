import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Search,
  Upload,
  X,
  Shield,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { GradientButton } from '../components/GradientButton';
import { GlowingCard } from '../components/GlowingCard';
import { Footer } from '../components/Footer';
import {
  fetchTemplateCategories,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  uploadTemplateImage
} from '../lib/templates';
import type {
  TemplateCategory,
  TemplateWithCategory,
  EditableField
} from '../types/templates';

interface TemplateFormData {
  category_id: string;
  name: string;
  is_active: boolean;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  last_login: string;
}

export function AdminInviteTemplatesPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [templates, setTemplates] = useState<TemplateWithCategory[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithCategory | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    category_id: '',
    name: '',
    is_active: true
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editableFields, setEditableFields] = useState<string>(''); // JSON textarea

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Auth & initial load ---
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!token || !userStr) {
      navigate('/master-admin/login');
      return;
    }

    setAdminUser(JSON.parse(userStr));
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/master-admin/login');
  };

  // --- Data loading ---
  async function loadData() {
    try {
      setLoading(true);
      const [categoriesData, templatesData] = await Promise.all([
        fetchTemplateCategories(true),
        fetchTemplates({ activeOnly: false })
      ]);
      setCategories(categoriesData);
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // --- Filters ---
  useEffect(() => {
    applyFilters();
  }, [templates, filterCategory, searchQuery]);

  function applyFilters() {
    let filtered = [...templates];

    if (filterCategory) {
      filtered = filtered.filter((t) => t.category_id === filterCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }

  // --- Modal helpers ---
  function openCreateModal() {
    setEditingTemplate(null);
    setFormData({
      category_id: categories[0]?.id || '',
      name: '',
      is_active: true
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditableFields('');
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(template: TemplateWithCategory) {
    setEditingTemplate(template);
    setFormData({
      category_id: template.category_id,
      name: template.name,
      is_active: template.is_active
    });
    setImageFiles([]);
    setImagePreviews([template.image_url]);

    // Load existing editable_fields JSON (if any)
    const raw = (template as any).editable_fields;
    if (raw) {
      if (typeof raw === 'string') {
        setEditableFields(raw);
      } else {
        setEditableFields(JSON.stringify(raw, null, 2));
      }
    } else {
      setEditableFields('');
    }

    setError('');
    setIsModalOpen(true);
  }

  // --- Drag & drop ---
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }

  function handleFiles(files: File[]) {
    const imgFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imgFiles.length === 0) {
      setError('Please select image files');
      return;
    }

    const oversized = imgFiles.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`${oversized.length} file(s) exceed 5MB limit`);
      return;
    }

    setImageFiles((prev) => [...prev, ...imgFiles]);

    imgFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError('');
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Parse editableFields JSON if provided
    let parsedEditableFields: EditableField[] | null = null;
    if (editableFields.trim()) {
      try {
        const parsed = JSON.parse(editableFields);
        if (!Array.isArray(parsed)) {
          throw new Error('Editable fields JSON must be an array');
        }
        parsedEditableFields = parsed;
      } catch (err: any) {
        console.error('Invalid editable_fields JSON:', err);
        setError('Editable fields must be valid JSON (array of objects).');
        return;
      }
    }

    if (!formData.category_id) {
      setError('Category is required');
      return;
    }

    if (!editingTemplate && imageFiles.length === 0) {
      setError('At least one image is required for new templates');
      return;
    }

    try {
      setUploading(true);

      const category = categories.find((c) => c.id === formData.category_id);
      if (!category) throw new Error('Category not found');

      // Editing existing template without changing the image
      if (editingTemplate && imageFiles.length === 0) {
        await updateTemplate(editingTemplate.id, {
          category_id: formData.category_id,
          name: formData.name,
          is_active: formData.is_active,
          editable_fields: parsedEditableFields
        });
        setSuccessMessage('Template updated successfully');
        setIsModalOpen(false);
        await loadData();
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      // Creating new templates or replacing image on existing
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const imageUrl = await uploadTemplateImage(file, category.slug);

        const templateName =
          formData.name || file.name.replace(/\.[^/.]+$/, '');

        const templateData = {
          category_id: formData.category_id,
          name: i === 0 ? templateName : `${templateName} ${i + 1}`,
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          is_active: formData.is_active,
          sort_order: 0,
          editable_fields: parsedEditableFields
        };

        if (editingTemplate && i === 0) {
          await updateTemplate(editingTemplate.id, templateData);
        } else {
          await createTemplate(templateData);
        }
      }

      setSuccessMessage(
        imageFiles.length > 1
          ? `${imageFiles.length} templates created successfully`
          : editingTemplate
          ? 'Template updated successfully'
          : 'Template created successfully'
      );

      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
    } finally {
      setUploading(false);
    }
  }

  // --- Delete ---
  async function handleDelete(template: TemplateWithCategory) {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await deleteTemplate(template.id);
      setSuccessMessage('Template deleted successfully');
      await loadData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
      setTimeout(() => setError(''), 5000);
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // --- Main render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-white">
                  Master Admin Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Welcome, {adminUser?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/master-admin">
                <GradientButton variant="secondary" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </GradientButton>
              </Link>
              <GradientButton
                onClick={handleLogout}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </GradientButton>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-8 w-full">
        <GlowingCard>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">
                Invite Templates
              </h1>
              <p className="text-gray-400">
                Manage template images for RSVP event invitations
              </p>
            </div>
            <GradientButton onClick={openCreateModal}>
              <Plus className="w-5 h-5 mr-2" />
              Add Templates
            </GradientButton>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
              {successMessage}
            </div>
          )}

          {error && !isModalOpen && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
              ]}
            />
          </div>

          {/* Templates grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 glass glass-border rounded-2xl">
              <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">
                {searchQuery || filterCategory
                  ? 'No templates match your filters'
                  : 'No templates found'}
              </p>
              {!searchQuery && !filterCategory && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Create your first template
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="glass glass-border rounded-xl overflow-hidden hover:shadow-glow transition-all duration-300 group"
                >
                  <div className="aspect-video bg-dark-200 relative overflow-hidden">
                    <img
                      src={template.thumbnail_url || template.image_url}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {template.category?.name}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          template.is_active
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-200 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-200 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowingCard>

        {/* Modal for create/edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTemplate ? 'Edit Template' : 'Create Templates'}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Select
              label="Category"
              value={formData.category_id}
              onChange={(e) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name
              }))}
              required
            />

            <Input
              label="Template Name (Optional)"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Auto-generated from filename if empty"
              helperText="Leave empty to use image filename"
            />

            {/* Image uploader */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Images {!editingTemplate && (
                  <span className="text-red-400">*</span>
                )}
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-border bg-dark-200/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">
                    Drag and drop images here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Maximum file size: 5MB per image. Supports JPG, PNG, GIF
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    Choose Files
                  </label>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-dark-200 rounded-lg overflow-hidden group"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index >= (editingTemplate ? 1 : 0) && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editable fields JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Editable Text Fields (JSON)
              </label>
              <textarea
                className="w-full h-40 bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={editableFields}
                onChange={(e) => setEditableFields(e.target.value)}
                placeholder={`[
  {
    "key": "title",
    "label": "Event Title",
    "bindTo": "title",
    "x": 50,
    "y": 18,
    "fontSize": 34,
    "color": "#FFFFFF"
  },
  {
    "key": "datetime",
    "label": "Date & Time",
    "bindTo": "event_date_time",
    "x": 50,
    "y": 70,
    "fontSize": 22,
    "color": "#FFFFFF"
  },
  {
    "key": "location",
    "label": "Location",
    "bindTo": "location",
    "x": 50,
    "y": 83,
    "fontSize": 22,
    "color": "#FFFFFF"
  }
]`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional. Defines which text areas the user can edit on this
                design. Use an array of objects with keys: key, label, bindTo,
                x, y, fontSize, color.
              </p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-5 h-5 rounded border-border bg-surface text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
              />
              <label htmlFor="is_active" className="text-gray-300 cursor-pointer">
                Active (visible to users)
              </label>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <GradientButton type="submit" disabled={uploading}>
                {uploading
                  ? 'Uploading...'
                  : editingTemplate
                  ? 'Update'
                  : 'Create'}
              </GradientButton>
            </div>
          </form>
        </Modal>
      </div>

      <Footer />
    </div>
  );
}
