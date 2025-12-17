// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Send, MessageCircle, X, Search, Plus, Paperclip, Image, FileText, Download, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fileStorage } from '@/lib/fileStorage';
import { LinkRenderer } from '@/lib/linkDetector';
import { UserProfileModal } from '@/components/UserProfileModal';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime } from '@/components/RelativeTime';
import { notificationService } from '@/lib/notifications';
import { toast } from 'sonner';

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  sender_avatar?: string | null;
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

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

// Storage Usage Display Component
function StorageUsageDisplay() {
  const [storageInfo, setStorageInfo] = useState<{
    totalFiles: number;
    totalSize: number;
  } | null>(null);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await fileStorage.getUserStorageUsage();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      }
    };

    loadStorageInfo();
  }, []);

  if (!storageInfo || storageInfo.totalSize < 10 * 1024 * 1024) { // Show only if > 10MB
    return null;
  }

  const sizeInMB = storageInfo.totalSize / (1024 * 1024);
  const isWarning = sizeInMB > 100; // Warning at 100MB

  return (
    <div className={`border rounded-lg p-3 mb-4 ${
      isWarning 
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
          <p className={`text-sm ${
            isWarning 
              ? 'text-yellow-800 dark:text-yellow-200' 
              : 'text-blue-800 dark:text-blue-200'
          }`}>
            Storage: {fileStorage.formatFileSize(storageInfo.totalSize)} used ({storageInfo.totalFiles} files)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const cleaned = await fileStorage.cleanupOldFiles();
                toast.success(`Cleaned up ${cleaned} old files`);
                // Refresh storage info
                const info = await fileStorage.getUserStorageUsage();
                setStorageInfo(info);
              } catch (error) {
                toast.error('Failed to cleanup files');
              }
            }}
            className="text-xs"
          >
            Cleanup
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ id: string; name: string } | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<DirectMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading]);

  // Refresh messages periodically to update read status
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMessages();
    }, 5000); // Refresh every 5 seconds

    // Also refresh when window gains focus
    const handleFocus = () => {
      refreshMessages();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  // Handle URL parameter for selecting user
  useEffect(() => {
    const withUserId = searchParams.get('with');
    if (withUserId && allUsers.length > 0) {
      const targetUser = allUsers.find((u) => u.id === withUserId);
      if (targetUser) {
        setSelectedUser(targetUser);
      }
    }
  }, [searchParams, allUsers]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (selectedUser && user?.id) {
      const unreadMessages = directMessages.filter(
        (msg) => msg.sender_id === selectedUser.id && 
                 msg.receiver_id === user.id && 
                 !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        // Mark messages as read in Supabase
        const messageIds = unreadMessages.map(msg => msg.id);
        (supabase as any)
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', messageIds)
          .then(({ error }: any) => {
            if (error) {
              console.error('Failed to mark messages as read:', error);
            } else {
              // Update local state to reflect read status
              setDirectMessages(prev => 
                prev.map(msg => 
                  messageIds.includes(msg.id)
                    ? { ...msg, is_read: true }
                    : msg
                )
              );
            }
          });
      }
    }
  }, [selectedUser, user?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages, selectedUser]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking on the attachment menu or file inputs
      if (showAttachmentMenu && !target.closest('.attachment-menu') && !target.closest('input[type="file"]')) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  const loadData = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Load all users from Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url')
        .neq('user_id', user.id);

      if (profilesError) {
        console.error('Error loading users:', profilesError);
      } else {
        // Map user_id to id for compatibility
        const users = (profilesData || []).map(p => ({
          id: p.user_id,
          name: p.name,
          email: p.email,
          avatar_url: p.avatar_url
        }));
        setAllUsers(users);
      }
      
      // Load direct messages from Supabase
      const { data: messagesData, error: messagesError} = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        setError(messagesError.message);
      } else {
        // Fetch sender names and avatars separately
        const messagesWithNames = await Promise.all(
          (messagesData || []).map(async (msg: any) => {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', msg.sender_id)
              .single();
            
            return {
              ...msg,
              sender_name: senderProfile?.name || 'Unknown User',
              sender_avatar: senderProfile?.avatar_url || null
            };
          })
        );
        setDirectMessages(messagesWithNames);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading Messages data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  // Refresh messages data to get updated read status
  const refreshMessages = async () => {
    if (!user?.id) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && messagesData) {
        // Fetch sender names and avatars separately
        const messagesWithNames = await Promise.all(
          messagesData.map(async (msg: any) => {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', msg.sender_id)
              .single();
            
            return {
              ...msg,
              sender_name: senderProfile?.name || 'Unknown User',
              sender_avatar: senderProfile?.avatar_url || null
            };
          })
        );
        setDirectMessages(messagesWithNames);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed', e.target.files);
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log('Files selected:', fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })));
      
      // Check for file size limits (50MB for Supabase)
      const validFiles = fileArray.filter(file => {
        const validation = fileStorage.validateFile(file, 50 * 1024 * 1024);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles]);
        setShowAttachmentMenu(false);
        toast.success(`${validFiles.length} file(s) selected`);
      }
    }
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return FileText;
    if (fileType.startsWith('audio/')) return FileText;
    return FileText;
  };

  const getMessageType = (fileType: string): 'text' | 'image' | 'document' | 'video' | 'audio' => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditMessage = (message: DirectMessage) => {
    setEditingMessageId(message.id);
    setEditingMessageText(message.content);
  };

  const handleSaveEditMessage = async (messageId: string) => {
    if (!editingMessageText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      // Update message in Supabase
      const { error } = await (supabase as any)
        .from('direct_messages')
        .update({ content: editingMessageText.trim() })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setDirectMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: editingMessageText.trim() }
            : msg
        )
      );
      
      setEditingMessageId(null);
      setEditingMessageText('');
      toast.success('Message updated!');
    } catch (error) {
      console.error('Failed to update message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleDeleteMessageClick = (message: DirectMessage) => {
    setMessageToDelete(message);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      // Delete from Supabase
      const { error } = await (supabase as any)
        .from('direct_messages')
        .delete()
        .eq('id', messageToDelete.id);

      if (error) throw error;

      // Update local state
      setDirectMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete.id));
      
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
      toast.success('Message deleted!');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleSendDirectMessage = async () => {
    if (!directMessageText.trim() && uploadedFiles.length === 0) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    if (!selectedUser || !user) {
      toast.error('Please select a user');
      return;
    }

    // Clear inputs immediately to provide better UX
    const messageText = directMessageText.trim();
    const filesToSend = [...uploadedFiles];
    setDirectMessageText('');
    setUploadedFiles([]);

    setIsSubmitting(true);
    try {
      // Send text message if there's content
      if (messageText) {
        console.log('Sending message from:', user.id, 'to:', selectedUser.id);
        
        const { data: messageData, error: messageError } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: messageText,
            message_type: 'text'
          })
          .select()
          .single();

        if (messageError) {
          console.error('Message insert error:', messageError);
          throw new Error(messageError.message || 'Failed to send message');
        }

        console.log('Text message sent successfully:', messageData);

        // Refresh messages to show the new message
        await refreshMessages();

        // Send notification for text message
        try {
          console.log('Sending message notification to:', selectedUser.id);
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();
          
          console.log('Sender profile:', senderProfile);
          
          await notificationService.addMessageNotification(
            selectedUser.id,
            user.id,
            senderProfile?.name || user.email || 'Anonymous',
            messageText
          );
          
          console.log('Message notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send message notification:', notificationError);
          // Don't fail the message sending if notification fails
        }
      }

      // Send file messages using Supabase Storage
      for (const file of filesToSend) {
        try {
          console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
          
          // Validate file
          const validation = fileStorage.validateFile(file, 50 * 1024 * 1024);
          if (!validation.valid) {
            toast.error(`${file.name}: ${validation.error}`);
            continue;
          }

          // Upload file to Supabase Storage
          const fileMetadata = await fileStorage.uploadFile({
            file,
            bucket: 'message-attachments',
            folder: user.id,
            compress: file.type.startsWith('image/'),
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8
          });

          if (!fileMetadata) {
            throw new Error('Failed to upload file');
          }

          console.log('File uploaded successfully:', fileMetadata);

          // Create message with file attachment
          const { data: messageData, error: messageError } = await (supabase as any)
            .rpc('create_message_with_attachment', {
              p_sender_id: user.id,
              p_receiver_id: selectedUser.id,
              p_content: `Sent a file: ${file.name}`,
              p_message_type: getMessageType(file.type),
              p_file_name: fileMetadata.fileName,
              p_file_type: fileMetadata.fileType,
              p_file_size: fileMetadata.fileSize,
              p_storage_path: fileMetadata.storagePath,
              p_public_url: fileMetadata.publicUrl
            });

          if (messageError) {
            // Clean up uploaded file if message creation fails
            await fileStorage.deleteFile(fileMetadata.id);
            throw messageError;
          }

          console.log('Message created successfully:', messageData);
          
          // Refresh messages to show the new message
          await refreshMessages();

          // Send notification for file
          try {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('name')
              .eq('user_id', user.id)
              .single();
            
            await notificationService.addMessageNotification(
              selectedUser.id,
              user.id,
              senderProfile?.name || user.email || 'Anonymous',
              `Sent a file: ${file.name}`
            );
          } catch (notificationError) {
            console.error('Failed to send file notification:', notificationError);
            // Don't fail the file sending if notification fails
          }
          
          toast.success(`File ${file.name} sent successfully!`);
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';
          toast.error(`Failed to send file: ${file.name} - ${errorMessage}`);
        }
      }

      toast.success('Message sent!');

      // Refresh to get the latest state from storage
      setTimeout(() => {
        refreshMessages();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error(`Failed to send message: ${errorMessage}`);
      
      // Restore inputs if there was an error
      setDirectMessageText(messageText);
      setUploadedFiles(filesToSend);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMessageTime = (dateString: string | undefined) => {
    if (!dateString) return 'now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'now';
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'now';
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Loading Messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">Error: {error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadData}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Filter messages for selected conversation
  const userDirectMessages = selectedUser ? directMessages
    .filter(
      (msg) => (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
               (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    }) : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Private conversations with other users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Chats</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewChatModal(true)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                New
              </Button>
            </div>
            
            <div className="space-y-2">
              {(() => {
                // Get users with message history
                const usersWithMessages = allUsers
                  .map((u) => {
                    const userMessages = directMessages.filter(
                      (msg) => (msg.sender_id === user.id && msg.receiver_id === u.id) ||
                               (msg.sender_id === u.id && msg.receiver_id === user.id)
                    );
                    const lastMessage = userMessages[0];
                    const unreadCount = userMessages.filter(
                      (msg) => msg.sender_id === u.id && !msg.is_read
                    ).length;
                    
                    return { user: u, userMessages, lastMessage, unreadCount };
                  })
                  .filter(({ userMessages }) => userMessages.length > 0) // Only show users with messages
                  .sort(({ lastMessage: a }, { lastMessage: b }) => {
                    // Sort by last message time (newest first)
                    if (!a && !b) return 0;
                    if (!a) return 1;
                    if (!b) return -1;
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return dateB - dateA;
                  });

                if (usersWithMessages.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "New" to start chatting</p>
                    </div>
                  );
                }

                return usersWithMessages.map(({ user: u, lastMessage, unreadCount }) => (
                  <div
                    key={u.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedUser?.id === u.id ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="flex items-center gap-3">
                      <AvatarUpload 
                        currentAvatar={u.avatar_url || null}
                        userName={u.name}
                        size="sm"
                        editable={false}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{u.name}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMessage.sender_id === user.id ? 'You: ' : ''}
                            {lastMessage.content.length > 30 
                              ? lastMessage.content.substring(0, 30) + '...' 
                              : lastMessage.content}
                          </p>
                          {unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-4">
              {/* Chat Header */}
              <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AvatarUpload 
                    currentAvatar={selectedUser.avatar_url || null}
                    userName={selectedUser.name}
                    size="md"
                    editable={false}
                  />
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProfileModalUser({ id: selectedUser.id, name: selectedUser.name });
                    setProfileModalOpen(true);
                  }}
                >
                  View Profile
                </Button>
              </div>

              {/* Messages */}
              <div className="bg-card border border-border rounded-2xl p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                {userDirectMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userDirectMessages.map((message) => {
                      const isOwn = message.sender_id === user.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwn && (
                            <div className="flex-shrink-0 mt-auto">
                              <AvatarUpload 
                                currentAvatar={message.sender_avatar || null}
                                userName={message.sender_name}
                                size="sm"
                                editable={false}
                              />
                            </div>
                          )}
                          
                          <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className="relative group">
                              {isOwn && !message.file_url && (
                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 rounded-full bg-card border border-border"
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditMessage(message)}>
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteMessageClick(message)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 shadow-sm ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted border border-border rounded-bl-md'
                                }`}
                              >
                              {message.message_type === 'image' && message.file_url ? (
                                <div className="space-y-2">
                                  <div className="relative rounded-lg overflow-hidden max-w-xs">
                                    <img 
                                      src={message.file_url} 
                                      alt={message.file_name}
                                      className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => {
                                        // Open image in new tab for full view
                                        window.open(message.file_url, '_blank');
                                      }}
                                    />
                                    <div className="absolute top-2 right-2">
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 rounded-full opacity-80 hover:opacity-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(message.file_url!, message.file_name!);
                                        }}
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs truncate">{message.file_name}</p>
                                    <p className="text-xs opacity-70">{message.file_size ? formatFileSize(message.file_size) : ''}</p>
                                  </div>
                                </div>
                              ) : message.message_type === 'document' && message.file_url ? (
                                <div className="space-y-2">
                                  <div 
                                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={() => handleDownloadFile(message.file_url!, message.file_name!)}
                                  >
                                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                                      <p className="text-xs opacity-70">{message.file_size ? formatFileSize(message.file_size) : ''}</p>
                                    </div>
                                    <Download className="h-4 w-4 text-primary flex-shrink-0" />
                                  </div>
                                </div>
                              ) : message.message_type === 'video' && message.file_url ? (
                                <div className="space-y-2">
                                  <div 
                                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                                    onClick={() => handleDownloadFile(message.file_url!, message.file_name!)}
                                  >
                                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{message.file_name}</p>
                                      <p className="text-xs opacity-70">{message.file_size ? formatFileSize(message.file_size) : ''}</p>
                                    </div>
                                    <Download className="h-4 w-4 text-primary flex-shrink-0" />
                                  </div>
                                </div>
                              ) : editingMessageId === message.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingMessageText}
                                    onChange={(e) => setEditingMessageText(e.target.value)}
                                    className="bg-background border-border min-h-[60px] text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEditMessage(message.id)}
                                      disabled={!editingMessageText.trim()}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingMessageId(null);
                                        setEditingMessageText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm break-words whitespace-pre-wrap">
                                  <LinkRenderer text={message.content} isOwnMessage={isOwn} />
                                </div>
                              )}
                              </div>
                            </div>
                            
                            <div className={`text-xs text-muted-foreground mt-1 px-2 ${
                              isOwn ? 'text-right' : 'text-left'
                            }`}>
                              <RelativeTime timestamp={message.created_at} format="short" />
                            </div>
                          </div>
                          
                          {isOwn && (
                            <div className="flex-shrink-0 mt-auto">
                              <AvatarUpload 
                                currentAvatar={message.sender_avatar || null}
                                userName={message.sender_name}
                                size="sm"
                                editable={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Storage Info */}
              <StorageUsageDisplay />

              {/* Message Input */}
              <div className="bg-card border border-border rounded-2xl p-4">
                {/* File Attachments Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium">Attachments:</p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => {
                        const FileIcon = getFileIcon(file.type);
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 items-end">
                  {/* Attachment Button */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    
                    {/* Attachment Menu */}
                    {showAttachmentMenu && (
                      <div className="attachment-menu absolute bottom-12 left-0 bg-card border border-border rounded-lg shadow-lg p-2 z-10">
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Document button clicked', documentInputRef.current);
                              setTimeout(() => {
                                if (documentInputRef.current) {
                                  documentInputRef.current.click();
                                  console.log('Document input clicked');
                                }
                              }, 100);
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full justify-start gap-2"
                          >
                            <Paperclip className="h-4 w-4" />
                            Document
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Image button clicked', imageInputRef.current);
                              setTimeout(() => {
                                if (imageInputRef.current) {
                                  imageInputRef.current.click();
                                  console.log('Image input clicked');
                                }
                              }, 100);
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full justify-start gap-2"
                          >
                            <Image className="h-4 w-4" />
                            Image
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log('Any File button clicked', fileInputRef.current);
                              setTimeout(() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                  console.log('Any File input clicked');
                                }
                              }, 100);
                              setShowAttachmentMenu(false);
                            }}
                            className="w-full justify-start gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Any File
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Hidden File Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="*/*"
                    />
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.zip,.rar,.7z"
                    />
                  </div>

                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={directMessageText}
                      onChange={(e) => setDirectMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if ((directMessageText.trim() || uploadedFiles.length > 0) && !isSubmitting) {
                            handleSendDirectMessage();
                          }
                        }
                      }}
                      className="bg-background border-border min-h-[40px] max-h-[120px] resize-none rounded-xl"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleSendDirectMessage}
                    disabled={isSubmitting || (!directMessageText.trim() && uploadedFiles.length === 0)}
                    className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                    variant="default"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 px-1">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        userId={profileModalUser?.id || null}
        userName={profileModalUser?.name || ''}
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setProfileModalUser(null);
        }}
        onSendMessage={(userId) => {
          const targetUser = allUsers.find((u) => u.id === userId);
          if (targetUser) {
            setSelectedUser(targetUser);
          }
        }}
      />

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Start New Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchQuery('');
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(() => {
                // Filter users based on search query
                const filteredUsers = allUsers.filter((u) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    u.name.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query)
                  );
                });

                if (filteredUsers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'No users found' : 'No users available'}
                      </p>
                      {searchQuery && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  );
                }

                return filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowNewChatModal(false);
                      setSearchQuery('');
                    }}
                  >
                    <AvatarUpload 
                      currentAvatar={u.avatar_url || null}
                      userName={u.name}
                      size="sm"
                      editable={false}
                    />
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteMessage} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}