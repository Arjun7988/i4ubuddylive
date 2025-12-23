import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  userId?: string;
}

export function ImageUpload({ images, onChange, maxImages = 5, userId }: ImageUploadProps) {
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
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setError('');

    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please upload only image files (JPG, PNG, GIF, etc.)');
      return;
    }

    // Check if we'll exceed max images
    if (images.length + imageFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Check file sizes (max 5MB per file)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Each image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId || 'user'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `business-images/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('business-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('business-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Update parent component with new URLs
      onChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError(err.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];

    // Extract file path from URL to delete from storage
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/business-images\/(.+)$/);

      if (pathMatch) {
        const filePath = `business-images/${pathMatch[1]}`;
        await supabase.storage.from('business-images').remove([filePath]);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }

    // Remove from list
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          ${dragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10'
          }
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
            {uploading ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-primary-400" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">
            {uploading ? 'Uploading...' : 'Upload Business Images'}
          </h3>

          <p className="text-sm text-gray-400 mb-1">
            Drag and drop images here, or click to browse
          </p>

          <p className="text-xs text-gray-500">
            Supports JPG, PNG, GIF (max 5MB per image, up to {maxImages} images)
          </p>

          {images.length > 0 && (
            <p className="text-xs text-primary-400 mt-2">
              {images.length} / {maxImages} images uploaded
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">Image {index + 1}</p>
              </div>
            </div>
          ))}

          {/* Add More Placeholder */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              <ImageIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs text-gray-400">Add More</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
