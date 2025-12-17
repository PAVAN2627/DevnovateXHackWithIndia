// Hybrid Storage System
// Automatically detects environment and uses appropriate storage (localStorage or Supabase)

import { supabase } from '@/integrations/supabase/client';
import { storage } from './storage';
import { fileStorage } from './fileStorage';
import { toast } from 'sonner';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  content: string;
  message_type?: 'text' | 'image' | 'document' | 'video' | 'audio';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  attachment_id?: string;
  is_read: boolean;
  created_at: string;
}

class HybridStorageService {
  private isSupabaseAvailable: boolean | null = null;

  // Check if Supabase tables are available
  private async checkSupabaseAvailability(): Promise<boolean> {
    if (this.isSupabaseAvailable !== null) {
      return this.isSupabaseAvailable;
    }

    try {
      // Try to query the direct_messages table
      const { error } = await (supabase as any)
        .from('direct_messages')
        .select('id')
        .limit(1);

      this.isSupabaseAvailable = !error;
      console.log('Supabase availability:', this.isSupabaseAvailable ? 'Available' : 'Not available');
      return this.isSupabaseAvailable;
    } catch (error) {
      console.log('Supabase not available, using localStorage');
      this.isSupabaseAvailable = false;
      return false;
    }
  }

  // Get all users
  async getAllUsers(currentUserId?: string): Promise<any[]> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .neq('id', currentUserId || '');

        if (!error && profilesData) {
          return profilesData;
        }
      } catch (error) {
        console.warn('Supabase query failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const usersData = storage.getAllUsers?.() || [];
    return usersData.filter((u: any) => u.id !== currentUserId);
  }

  // Get direct messages
  async getDirectMessages(userId: string): Promise<DirectMessage[]> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        const { data: messagesData, error } = await (supabase as any)
          .from('direct_messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            message_type,
            file_url,
            file_name,
            file_size,
            file_type,
            attachment_id,
            is_read,
            created_at,
            sender:profiles!sender_id(name)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (!error && messagesData) {
          return messagesData.map((msg: any) => ({
            ...msg,
            sender_name: msg.sender?.name || 'Unknown User'
          }));
        }
      } catch (error) {
        console.warn('Supabase query failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const directMsgs = storage.getDirectMessages?.(userId) || [];
    return directMsgs.map((msg: any) => ({
      ...msg,
      is_read: msg.read || msg.is_read || false,
      created_at: msg.created_at || msg.createdAt || new Date().toISOString()
    }));
  }

  // Send text message
  async sendTextMessage(senderId: string, receiverId: string, content: string): Promise<boolean> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        const { error } = await (supabase as any)
          .from('direct_messages')
          .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            message_type: 'text'
          });

        if (!error) {
          return true;
        }
      } catch (error) {
        console.warn('Supabase insert failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    try {
      const profile = storage.getProfile(senderId);
      storage.addDirectMessage?.({
        sender_id: senderId,
        receiver_id: receiverId,
        sender_name: profile?.name || 'Anonymous',
        content,
        message_type: 'text',
      });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  // Send file message
  async sendFileMessage(
    senderId: string, 
    receiverId: string, 
    file: File, 
    content: string
  ): Promise<boolean> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        // Upload file to Supabase Storage
        const fileMetadata = await fileStorage.uploadFile({
          file,
          bucket: 'message-attachments',
          folder: senderId,
          compress: file.type.startsWith('image/'),
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8
        });

        if (!fileMetadata) {
          throw new Error('Failed to upload file');
        }

        // Create message with file attachment
        const { error } = await (supabase as any)
          .rpc('create_message_with_attachment', {
            p_sender_id: senderId,
            p_receiver_id: receiverId,
            p_content: content,
            p_message_type: this.getMessageType(file.type),
            p_file_name: fileMetadata.fileName,
            p_file_type: fileMetadata.fileType,
            p_file_size: fileMetadata.fileSize,
            p_storage_path: fileMetadata.storagePath,
            p_public_url: fileMetadata.publicUrl
          });

        if (!error) {
          return true;
        } else {
          // Clean up uploaded file if message creation fails
          await fileStorage.deleteFile(fileMetadata.id);
          throw error;
        }
      } catch (error) {
        console.warn('Supabase file upload failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage with base64 encoding
    try {
      // Validate file size for localStorage (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File too large for localStorage. Maximum size is 5MB.');
      }

      // Convert file to base64
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result && result.startsWith('data:')) {
            resolve(result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const profile = storage.getProfile(senderId);
      storage.addDirectMessage?.({
        sender_id: senderId,
        receiver_id: receiverId,
        sender_name: profile?.name || 'Anonymous',
        content,
        message_type: this.getMessageType(file.type),
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });

      return true;
    } catch (error) {
      console.error('Failed to send file message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        await (supabase as any)
          .from('direct_messages')
          .update({ is_read: true })
          .eq('sender_id', senderId)
          .eq('receiver_id', receiverId)
          .eq('is_read', false);
        return;
      } catch (error) {
        console.warn('Supabase update failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    storage.markMessagesAsRead?.(senderId, receiverId);
  }

  // Get storage usage info
  async getStorageUsage(): Promise<{
    totalFiles: number;
    totalSize: number;
    sizeInMB: number;
  }> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        const usage = await fileStorage.getUserStorageUsage();
        return {
          totalFiles: usage.totalFiles,
          totalSize: usage.totalSize,
          sizeInMB: usage.totalSize / (1024 * 1024)
        };
      } catch (error) {
        console.warn('Failed to get Supabase storage usage');
      }
    }

    // Fallback to localStorage info
    const storageInfo = storage.getStorageInfo?.() || { size: 0, sizeInMB: 0, totalItems: 0 };
    return {
      totalFiles: storageInfo.totalItems || 0,
      totalSize: storageInfo.size || 0,
      sizeInMB: storageInfo.sizeInMB || 0
    };
  }

  // Cleanup old data
  async cleanupOldData(): Promise<number> {
    const isSupabaseAvailable = await this.checkSupabaseAvailability();

    if (isSupabaseAvailable) {
      try {
        return await fileStorage.cleanupOldFiles();
      } catch (error) {
        console.warn('Supabase cleanup failed, falling back to localStorage');
      }
    }

    // Fallback to localStorage cleanup
    return storage.cleanupOldMessages?.() || 0;
  }

  // Helper method to determine message type
  private getMessageType(fileType: string): 'text' | 'image' | 'document' | 'video' | 'audio' {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  // Download file
  async downloadFile(fileUrl: string, fileName: string): Promise<void> {
    try {
      // Handle both Supabase URLs and data URLs
      if (fileUrl.startsWith('data:')) {
        // Data URL - create blob and download
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Supabase URL - fetch and download
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toast.success('File downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate file for upload
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size based on storage type
    const maxSize = this.isSupabaseAvailable ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for Supabase, 5MB for localStorage
    
    if (file.size > maxSize) {
      const sizeLimit = this.isSupabaseAvailable ? '50MB' : '5MB';
      return {
        valid: false,
        error: `File size exceeds ${sizeLimit} limit`
      };
    }

    // Check file type
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

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const hybridStorage = new HybridStorageService();