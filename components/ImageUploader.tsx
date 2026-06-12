"use client";

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useUploadImage } from '../lib/hooks/useUploadImage';

interface ImageUploaderProps {
  onImageUploaded: (url: string | null) => void;
}

export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadImage, isPending } = useUploadImage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload to server
    uploadImage(file, {
      onSuccess: (data) => {
        onImageUploaded(data.url);
      },
      onError: (err) => {
        console.error('Upload failed', err);
        setPreview(null);
        onImageUploaded(null);
        alert('Failed to upload image. Please try again.');
      }
    });
  };

  const handleClear = () => {
    setPreview(null);
    onImageUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Initial Image (Optional - For Image to Video)
      </label>
      
      {!preview ? (
        <div 
          className="border-2 border-dashed border-surface-600 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-brand-500/50 hover:bg-surface-800/50 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mb-3 text-gray-500 group-hover:text-brand-400 transition-colors" />
          <p className="text-sm text-center">
            <span className="text-brand-400 font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WEBP (Max 5MB)</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-surface-600 group">
          <div className="aspect-video w-full bg-surface-900 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={preview} 
              alt="Init image preview" 
              className={`max-h-full max-w-full object-contain ${isPending ? 'opacity-50 blur-sm' : ''}`}
            />
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ImageIcon className="h-3 w-3" />
            <span>Image Attached</span>
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />
    </div>
  );
}
