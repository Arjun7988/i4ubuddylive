import { useState, useRef } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SingleImageUploadProps {
  imageUrl: string;
  onChange: (url: string) => void;
  bucket: string;
  folder: string;
  label?: string;
}

export function SingleImageUpload({
  imageUrl,
  onChange,
  bucket,
  folder,
  label = 'Upload Image'
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please upload only image files (JPG, PNG, GIF, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const adminToken = localStorage.getItem('admin_token');

      if (adminToken) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('folder', folder);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-upload`,
          {
            method: 'POST',
            headers: {
              'x-admin-token': adminToken,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Upload failed with status ${response.status}`;
          }
          console.error('Upload error response:', errorMessage);
          throw new Error(errorMessage);
        }

        const { publicUrl } = await response.json();
        onChange(publicUrl);
      } else {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Authentication required. Please log in.');
          setUploading(false);
          return;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        onChange(publicUrl);
      }
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!imageUrl) return;

    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(new RegExp(`/${bucket}/(.+)$`));

      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage.from(bucket).remove([filePath]);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }

    onChange('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      {imageUrl ? (
        <div className="relative group">
          <div className="aspect-video rounded-lg overflow-hidden bg-surface border border-border">
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-full h-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer
            ${dragActive
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-border hover:border-primary-500/50 bg-surface hover:bg-surface/80'
            }
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-3">
              {uploading ? (
                <div className="w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-primary-400" />
              )}
            </div>

            <p className="text-sm font-medium text-white mb-1">
              {uploading ? 'Uploading...' : 'Drag and drop image here'}
            </p>

            <p className="text-xs text-gray-400 mb-2">
              or click to browse
            </p>

            <p className="text-xs text-gray-500">
              JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
