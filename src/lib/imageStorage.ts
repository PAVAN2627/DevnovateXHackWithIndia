// Image storage service - uploads images to Supabase Storage

import { supabase } from '@/integrations/supabase/client';

// Compress image by resizing to max 800x600
const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.7): string => {
  return canvas.toDataURL('image/jpeg', quality);
};

// Resize image to fit within max dimensions while maintaining aspect ratio
const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Could not create blob from canvas'));
            return;
          }
          
          // Create a new File from the blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, 'image/jpeg', 0.7);
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
};

export const imageStorage = {
  // Upload image with compression to Supabase Storage
  uploadImage: async (file: File): Promise<string> => {
    try {
      // Resize and compress image
      const compressedFile = await resizeImage(file, 800, 600);
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `blog-images/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Convert file to base64 (for preview purposes)
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Delete image from Supabase Storage
  deleteImage: async (url: string) => {
    try {
      // Extract path from URL
      const urlParts = url.split('/');
      const path = urlParts.slice(-2).join('/'); // Get 'blog-images/filename'
      
      const { error } = await supabase.storage
        .from('blog-images')
        .remove([path]);

      if (error) {
        console.error('Error deleting image:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  // Get storage stats (placeholder for compatibility)
  getStorageStats: () => {
    return {
      images: 0,
      appData: 0,
      total: 0,
      formatted: 'Using Supabase Storage'
    };
  }
};
