// Supabase File Storage Service
// Handles file uploads, downloads, and management using Supabase Storage

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FileUploadOptions {
  file: File;
  bucket: 'message-attachments' | 'user-avatars' | 'blog-images' | 'hackathon-media' | 'issue-attachments';
  folder?: string;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  publicUrl: string;
  thumbnailUrl?: string;
  uploadContext: 'message' | 'blog' | 'issue' | 'profile' | 'hackathon';
  contextId?: string;
  metadata?: Record<string, any>;
}

class FileStorageService {
  // Compress image if needed
  private async compressImage(
    file: File, 
    maxWidth: number = 1200, 
    maxHeight: number = 1200, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // Generate unique file path
  private generateFilePath(bucket: string, folder: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${folder}/${timestamp}_${randomId}_${baseName}.${extension}`;
  }

  // Upload file to Supabase Storage
  async uploadFile(options: FileUploadOptions): Promise<FileMetadata | null> {
    try {
      const { file, bucket, folder = 'uploads', compress = false, maxWidth, maxHeight, quality } = options;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let fileToUpload = file;
      
      // Compress image if requested and file is an image
      if (compress && file.type.startsWith('image/')) {
        console.log('Compressing image:', file.name);
        fileToUpload = await this.compressImage(file, maxWidth, maxHeight, quality);
        console.log('Compression complete. Original:', file.size, 'Compressed:', fileToUpload.size);
      }

      // Generate file path
      const filePath = this.generateFilePath(bucket, folder, file.name);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Create file metadata record using type assertion for new table
      const { data: fileRecord, error: dbError } = await (supabase as any)
        .from('file_attachments')
        .insert({
          uploader_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: fileToUpload.size,
          storage_path: filePath,
          public_url: urlData.publicUrl,
          upload_context: this.getContextFromBucket(bucket),
          metadata: {
            original_size: file.size,
            compressed: compress && file.type.startsWith('image/'),
            dimensions: file.type.startsWith('image/') ? { maxWidth, maxHeight } : null
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(bucket).remove([filePath]);
        throw dbError;
      }

      console.log('File uploaded successfully:', fileRecord);
      
      return {
        id: fileRecord.id,
        fileName: fileRecord.file_name,
        fileType: fileRecord.file_type,
        fileSize: fileRecord.file_size,
        storagePath: fileRecord.storage_path,
        publicUrl: fileRecord.public_url,
        uploadContext: fileRecord.upload_context,
        metadata: fileRecord.metadata
      };

    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadFiles(files: FileUploadOptions[]): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    const errors: string[] = [];

    for (const fileOptions of files) {
      try {
        const result = await this.uploadFile(fileOptions);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${fileOptions.file.name}: ${errorMessage}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some files failed to upload:', errors);
      toast.warning(`${errors.length} file(s) failed to upload`);
    }

    return results;
  }

  // Delete file
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Get file record using type assertion
      const { data: fileRecord, error: fetchError } = await (supabase as any)
        .from('file_attachments')
        .select('storage_path, upload_context')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileRecord) {
        throw new Error('File not found');
      }

      // Delete from storage
      const bucket = this.getBucketFromContext(fileRecord.upload_context);
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([fileRecord.storage_path]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
      }

      // Delete from database using type assertion
      const { error: dbError } = await (supabase as any)
        .from('file_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        throw dbError;
      }

      return true;
    } catch (error) {
      console.error('File deletion failed:', error);
      return false;
    }
  }

  // Get user's storage usage
  async getUserStorageUsage(): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeByContext: Record<string, { count: number; size: number }>;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { totalFiles: 0, totalSize: 0, sizeByContext: {} };
      }

      const { data, error } = await (supabase as any)
        .rpc('get_user_storage_usage', { user_id: user.id });

      if (error) {
        throw error;
      }

      return {
        totalFiles: data[0]?.total_files || 0,
        totalSize: data[0]?.total_size || 0,
        sizeByContext: data[0]?.size_by_context || {}
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { totalFiles: 0, totalSize: 0, sizeByContext: {} };
    }
  }

  // Clean up old files
  async cleanupOldFiles(): Promise<number> {
    try {
      const { data, error } = await (supabase as any).rpc('cleanup_orphaned_files');
      
      if (error) {
        throw error;
      }

      return typeof data === 'number' ? data : 0;
    } catch (error) {
      console.error('Cleanup failed:', error);
      return 0;
    }
  }

  // Helper methods
  private getContextFromBucket(bucket: string): 'message' | 'blog' | 'issue' | 'profile' | 'hackathon' {
    switch (bucket) {
      case 'message-attachments': return 'message';
      case 'user-avatars': return 'profile';
      case 'blog-images': return 'blog';
      case 'hackathon-media': return 'hackathon';
      case 'issue-attachments': return 'issue';
      default: return 'message';
    }
  }

  private getBucketFromContext(context: string): string {
    switch (context) {
      case 'message': return 'message-attachments';
      case 'profile': return 'user-avatars';
      case 'blog': return 'blog-images';
      case 'hackathon': return 'hackathon-media';
      case 'issue': return 'issue-attachments';
      default: return 'message-attachments';
    }
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file
  validateFile(file: File, maxSize: number = 50 * 1024 * 1024): { valid: boolean; error?: string } {
    // Check file size (default 50MB)
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.formatFileSize(maxSize)} limit`
      };
    }

    // Check file type (basic validation)
    const allowedTypes = [
      'image/', 'video/', 'audio/', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats-officedocument',
      'text/', 'application/zip', 'application/x-rar'
    ];

    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowed) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return { valid: true };
  }
}

export const fileStorage = new FileStorageService();