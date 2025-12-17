// Image storage service - stores images in localStorage as compressed base64

const IMAGE_STORAGE_KEY = 'devnovate_images';

interface ImageData {
  [key: string]: string; // filename -> base64
}

// Compress image by resizing to max 800x600
const compressImage = (canvas: HTMLCanvasElement, quality: number = 0.7): string => {
  return canvas.toDataURL('image/jpeg', quality);
};

// Resize image to fit within max dimensions while maintaining aspect ratio
const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<string> => {
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
        const compressedBase64 = compressImage(canvas, 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
};

export const imageStorage = {
  // Get image by filename
  getImage: (filename: string): string | null => {
    try {
      const images = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}') as ImageData;
      return images[filename] || null;
    } catch {
      return null;
    }
  },

  // Save image
  saveImage: (filename: string, base64Data: string): string => {
    try {
      const images = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}') as ImageData;
      images[filename] = base64Data;
      localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
      return filename;
    } catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  },

  // Convert file to base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Upload image with compression
  uploadImage: async (file: File): Promise<string> => {
    try {
      // Resize and compress image
      const compressedBase64 = await resizeImage(file, 800, 600);
      const filename = `img_${Date.now()}_${file.name}`;
      imageStorage.saveImage(filename, compressedBase64);
      return compressedBase64; // Return the base64 data URL directly
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Get image URL (for display)
  getImageUrl: (filename: string): string => {
    const base64 = imageStorage.getImage(filename);
    if (base64) {
      return base64; // base64 is already a data URL from fileToBase64
    }
    return '/assets/placeholder.png';
  },

  // Delete image
  deleteImage: (filename: string) => {
    try {
      const images = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}') as ImageData;
      delete images[filename];
      localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  // Clear all images
  clearAll: () => {
    localStorage.removeItem(IMAGE_STORAGE_KEY);
  },

  // Get storage stats
  getStorageStats: () => {
    try {
      const images = JSON.parse(localStorage.getItem(IMAGE_STORAGE_KEY) || '{}') as ImageData;
      const appData = localStorage.getItem('devnovate_app_data') || '{}';
      const imageSize = new Blob([JSON.stringify(images)]).size;
      const appDataSize = new Blob([appData]).size;
      const totalSize = imageSize + appDataSize;
      
      return {
        images: imageSize,
        appData: appDataSize,
        total: totalSize,
        formatted: `${(totalSize / 1024 / 1024).toFixed(2)}MB / ~5MB limit`
      };
    } catch {
      return {
        images: 0,
        appData: 0,
        total: 0,
        formatted: 'Unknown'
      };
    }
  }
};
