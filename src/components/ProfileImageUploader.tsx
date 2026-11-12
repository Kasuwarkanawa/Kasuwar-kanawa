import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { uploadProfileImage, validateImageFile } from '../utils/imageUpload';
import { UserAvatar } from './UserAvatar';

interface ProfileImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
  className?: string;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  value,
  onChange,
  label = 'Profile Picture (Hoton Bayani)',
  helperText = 'Select from camera or gallery. Auto-optimized (max 512x512 WebP, <200KB).',
  name = 'User',
  role = 'buyer',
  disabled = false,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Initial check
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      const result = await uploadProfileImage(file);

      if (!result.success || !result.url) {
        setUploadError(result.error || 'Failed to optimize or upload image.');
      } else {
        onChange(result.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred during upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Avatar Preview */}
        <div className="relative group shrink-0">
          <UserAvatar
            src={value}
            name={name}
            role={role}
            size="xl"
            className="ring-2 ring-slate-200"
          />

          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin text-[#E6007E]" />
              <span className="text-[9px] mt-0.5">Optimizing...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              capture="user"
              disabled={disabled || uploading}
              onChange={handleFileChange}
              className="hidden"
              id="profile-image-input-field"
            />

            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-[#E6007E] text-slate-800 rounded-lg text-xs font-bold shadow-xs transition-colors hover:text-[#E6007E] cursor-pointer disabled:opacity-50"
            >
              {value ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#E6007E]" />
                  <span>Change Photo</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-[#E6007E]" />
                  <span>Take / Upload Photo</span>
                </>
              )}
            </button>

            {value && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={handleRemove}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Helper info / Status */}
          {uploadError ? (
            <div className="flex items-center gap-1 text-[11px] text-red-600 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          ) : uploadSuccess ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Photo optimized & uploaded successfully!</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              {helperText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
