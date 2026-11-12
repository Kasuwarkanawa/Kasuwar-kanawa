/**
 * Profile Image Upload & Optimization Utility for KASUWAR KANAWA
 * Resizes images to max 512x512, compresses to WebP/JPEG target <= 200KB,
 * validates file types against executables, and uploads to the server storage.
 * Only the resulting static URL (e.g. /uploads/profiles/...) is stored in user records.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImageResult {
  blob: Blob;
  mimeType: string;
  dataUrl: string;
  fileName: string;
  fileSizeBytes: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Dangerous extensions that must be rejected immediately
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'php', 'js', 'mjs', 'ts', 'html', 'htm',
  'svg', 'vbs', 'ps1', 'jar', 'apk', 'bin', 'py', 'pl', 'cgi', 'asp',
  'aspx', 'jsp', 'scr', 'pif', 'com'
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/**
 * Validate that a file is a safe, supported image format
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file was selected.' };
  }

  // Check filename extension
  const fileNameParts = file.name.split('.');
  const extension = fileNameParts.length > 1 ? fileNameParts.pop()!.toLowerCase() : '';

  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Security Alert: Files with .${extension} extension are not allowed. Please upload a JPEG, PNG, or WebP photo.`
    };
  }

  // Check mime type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a standard photo (JPEG, PNG, or WebP).'
    };
  }

  // Raw file size check (15MB maximum before optimization)
  const MAX_RAW_SIZE_MB = 15;
  if (file.size > MAX_RAW_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `The selected image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image under 15MB.`
    };
  }

  return { valid: true };
}

/**
 * Resize image to max 512x512 pixels and compress to WebP (or JPEG fallback)
 * targeting <= 200KB
 */
export async function optimizeProfileImage(file: File): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode the image file. Ensure it is a valid image.'));

      img.onload = async () => {
        try {
          const maxDimension = 512;
          let width = img.width;
          let height = img.height;

          // Scale proportionally to fit within 512x512
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Browser canvas rendering is not supported on this device.'));
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Test WebP support with progressive compression
          const testWebp = canvas.toDataURL('image/webp');
          const isWebpSupported = testWebp.indexOf('data:image/webp') === 0;
          const outputFormat = isWebpSupported ? 'image/webp' : 'image/jpeg';
          const fileExtension = isWebpSupported ? 'webp' : 'jpg';

          // Compress to target <= 200KB
          let quality = 0.85;
          let blob: Blob | null = null;

          for (let attempt = 0; attempt < 3; attempt++) {
            blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outputFormat, quality));
            if (blob && blob.size <= 200 * 1024) {
              break;
            }
            quality -= 0.15; // Reduce quality if file > 200KB
          }

          if (!blob) {
            reject(new Error('Failed to generate optimized image blob.'));
            return;
          }

          // Convert optimized blob to base64 for transmission to the server API
          const optimizedReader = new FileReader();
          optimizedReader.onloadend = () => {
            const dataUrl = optimizedReader.result as string;
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const generatedFileName = `profile_${Date.now()}_${randomSuffix}.${fileExtension}`;

            resolve({
              blob,
              mimeType: outputFormat,
              dataUrl,
              fileName: generatedFileName,
              fileSizeBytes: blob.size,
            });
          };
          optimizedReader.readAsDataURL(blob);
        } catch (err: any) {
          reject(new Error(err?.message || 'Error processing and resizing image.'));
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Upload optimized profile image to server storage endpoint
 * Never stores Base64 in database or localStorage — returns the static file URL.
 */
export async function uploadProfileImage(file: File): Promise<UploadResult> {
  // Step 1: Client-side validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Step 2: Client-side optimization (max 512x512, <= 200KB WebP/JPEG)
    const optimized = await optimizeProfileImage(file);

    // Step 3: Send optimized payload to server endpoint
    const response = await fetch('/api/upload-profile-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: optimized.fileName,
        fileData: optimized.dataUrl,
        mimeType: optimized.mimeType,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Server upload failed with status code ${response.status}.`,
      };
    }

    const data = await response.json();
    if (data.success && data.url) {
      return { success: true, url: data.url };
    }

    return { success: false, error: data.error || 'Server did not return a valid image URL.' };
  } catch (err: any) {
    console.error('Image upload failed:', err);
    return {
      success: false,
      error: err?.message || 'Network error while uploading profile image. Please check your connection.',
    };
  }
}
