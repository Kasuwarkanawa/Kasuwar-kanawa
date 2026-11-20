/**
 * Profile image upload for KASUWAR KANAWA.
 * Images are resized to 512x512 and stored in the public Supabase Storage
 * bucket. Only the resulting short public URL is sent to registration.
 */

import { SUPABASE_PUBLIC_KEY } from './apiConfig';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImageResult {
  blob: Blob;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const SUPABASE_URL = 'https://efirbpzfimzmpchsovbz.supabase.co';
const PROFILE_BUCKET = 'profile-images';
const MAX_IMAGE_SIZE = 200 * 1024;
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'mjs', 'ts', 'html', 'htm',
  'svg', 'vbs', 'ps1', 'jar', 'apk', 'bin', 'py', 'pl', 'cgi', 'asp',
  'aspx', 'jsp', 'scr', 'pif', 'com'
];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export function validateImageFile(file: File): ValidationResult {
  if (!file) return { valid: false, error: 'No file was selected.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Security Alert: Files with .${extension} extension are not allowed. Please upload a JPEG, PNG, or WebP photo.` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file format. Please upload a standard photo (JPEG, PNG, or WebP).' };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { valid: false, error: `The selected image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 15MB.` };
  }
  return { valid: true };
}

/** Resize to 512x512 maximum and compress below the Storage bucket's 200KB limit. */
export async function optimizeProfileImage(file: File): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode the image file. Ensure it is a valid image.'));
      img.onload = async () => {
        try {
          const scale = Math.min(1, 512 / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Browser canvas rendering is not supported on this device.');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
          const mimeType = webpSupported ? 'image/webp' : 'image/jpeg';
          const extension = webpSupported ? 'webp' : 'jpg';
          let quality = 0.85;
          let blob: Blob | null = null;

          for (let attempt = 0; attempt < 6; attempt++) {
            blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mimeType, quality));
            if (blob && blob.size <= MAX_IMAGE_SIZE) break;
            quality = Math.max(0.2, quality - 0.12);
          }
          if (!blob) throw new Error('Failed to generate optimized image.');
          if (blob.size > MAX_IMAGE_SIZE) {
            throw new Error('This image could not be compressed below 200KB. Please choose another photo.');
          }

          resolve({
            blob,
            mimeType,
            fileName: `${crypto.randomUUID()}.${extension}`,
            fileSizeBytes: blob.size,
          });
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Error optimizing image.'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Upload directly to Supabase Storage; never send a base64 image in registration JSON. */
export async function uploadProfileImage(file: File): Promise<UploadResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) return { success: false, error: validation.error };

  try {
    const optimized = await optimizeProfileImage(file);
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${PROFILE_BUCKET}/${optimized.fileName}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLIC_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLIC_KEY}`,
        'Content-Type': optimized.mimeType,
        'x-upsert': 'false',
      },
      body: optimized.blob,
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      return {
        success: false,
        error: details.message || details.error || `Supabase image upload failed (${response.status}). Please try again.`,
      };
    }

    return {
      success: true,
      url: `${SUPABASE_URL}/storage/v1/object/public/${PROFILE_BUCKET}/${optimized.fileName}`,
    };
  } catch (error) {
    console.error('Profile image upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error while uploading your photo. Please try again.',
    };
  }
}
