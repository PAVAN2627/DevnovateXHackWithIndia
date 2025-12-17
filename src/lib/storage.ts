// Local JSON Storage Service
// Stores all data in localStorage as JSON

interface StorageData {
  users: Record<string, any>;
  profiles: Record<string, any>;
  userRoles: Record<string, any>;
  hackathons: Record<string, any>;
  announcements: Record<string, any>;
  chatMessages: Record<string, any>;
  blogs: Record<string, any>;
  blogComments?: Record<string, any>;
  blogLikes?: Record<string, any>;
  issues: Record<string, any>;
  issueComments?: Record<string, any>;
  participants: Record<string, any>;
  generalMessages?: Record<string, any>;
  directMessages?: Record<string, any>;
}

const STORAGE_KEY = 'devnovate_app_data';

// Initialize storage with default data
const defaultData: StorageData = {
  users: {},
  profiles: {},
  userRoles: {},
  hackathons: {},
  announcements: {},
  chatMessages: {},
  blogs: {},
  blogComments: {},
  blogLikes: {},
  issues: {},
  issueComments: {},
  participants: {},
  generalMessages: {},
  directMessages: {},
};

export const storage = {
  // Get all data
  getData: (): StorageData => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : defaultData;
    } catch {
      return defaultData;
    }
  },

  // Save all data
  saveData: (data: StorageData) => {
    try {
      const dataString = JSON.stringify(data);
      const sizeInMB = (dataString.length * 2) / (1024 * 1024); // Rough estimate (UTF-16)
      
      console.log(`Saving data to localStorage. Size: ${sizeInMB.toFixed(2)}MB`);
      
      // Check if we're approaching localStorage limits (usually 5-10MB)
      if (sizeInMB > 8) {
        console.warn('localStorage is getting large. Consider cleaning up old data.');
      }
      
      localStorage.setItem(STORAGE_KEY, dataString);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Cannot save data.');
        throw new Error('Storage quota exceeded. Please clear some data or contact support.');
      } else {
        console.error('Error saving data to localStorage:', error);
        throw error;
      }
    }
  },

  // Users
  addUser: (userId: string, user: any) => {
    const data = storage.getData();
    data.users[userId] = { ...user, id: userId, createdAt: new Date().toISOString() };
    storage.saveData(data);
    return data.users[userId];
  },

  getUser: (userId: string) => {
    const data = storage.getData();
    return data.users[userId] || null;
  },

  getUserByEmail: (email: string) => {
    const data = storage.getData();
    return Object.values(data.users).find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // Profiles
  addProfile: (userId: string, profile: any) => {
    const data = storage.getData();
    data.profiles[userId] = { ...profile, user_id: userId, id: userId };
    storage.saveData(data);
    return data.profiles[userId];
  },

  getProfile: (userId: string) => {
    const data = storage.getData();
    return data.profiles[userId] || null;
  },

  updateProfile: (userId: string, updates: any) => {
    const data = storage.getData();
    if (data.profiles[userId]) {
      data.profiles[userId] = { ...data.profiles[userId], ...updates };
      storage.saveData(data);
    }
    return data.profiles[userId];
  },

  // User Roles
  addUserRole: (userId: string, role: string) => {
    const data = storage.getData();
    data.userRoles[userId] = { user_id: userId, role, id: userId };
    storage.saveData(data);
    return data.userRoles[userId];
  },

  getUserRole: (userId: string) => {
    const data = storage.getData();
    return data.userRoles[userId]?.role || 'participant';
  },

  // Hackathons
  addHackathon: (hackathon: any) => {
    const data = storage.getData();
    const id = `hackathon_${Date.now()}`;
    data.hackathons[id] = { ...hackathon, id, createdAt: new Date().toISOString() };
    storage.saveData(data);
    return data.hackathons[id];
  },

  getHackathon: (id: string) => {
    const data = storage.getData();
    return data.hackathons[id] || null;
  },

  getAllHackathons: () => {
    const data = storage.getData();
    return Object.values(data.hackathons);
  },

  updateHackathon: (id: string, updates: any) => {
    const data = storage.getData();
    if (data.hackathons[id]) {
      data.hackathons[id] = { ...data.hackathons[id], ...updates, updatedAt: new Date().toISOString() };
      storage.saveData(data);
    }
    return data.hackathons[id];
  },

  deleteHackathon: (id: string) => {
    const data = storage.getData();
    delete data.hackathons[id];
    storage.saveData(data);
  },

  // Announcements
  addAnnouncement: (announcement: any) => {
    const data = storage.getData();
    const id = `announcement_${Date.now()}`;
    data.announcements[id] = { ...announcement, id, created_at: new Date().toISOString() };
    storage.saveData(data);
    return data.announcements[id];
  },

  getAnnouncementsByHackathon: (hackathonId: string) => {
    const data = storage.getData();
    return Object.values(data.announcements).filter((a: any) => a.hackathon_id === hackathonId);
  },

  // Chat Messages
  addChatMessage: (message: any) => {
    const data = storage.getData();
    const id = `message_${Date.now()}`;
    data.chatMessages[id] = { ...message, id, created_at: new Date().toISOString() };
    storage.saveData(data);
    return data.chatMessages[id];
  },

  getChatMessagesByHackathon: (hackathonId: string) => {
    const data = storage.getData();
    return Object.values(data.chatMessages)
      .filter((m: any) => m.hackathon_id === hackathonId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Blogs
  addBlog: (blog: any) => {
    const data = storage.getData();
    const id = `blog_${Date.now()}`;
    data.blogs[id] = { ...blog, id, created_at: new Date().toISOString() };
    storage.saveData(data);
    return data.blogs[id];
  },

  getBlog: (id: string) => {
    const data = storage.getData();
    return data.blogs[id] || null;
  },

  getAllBlogs: () => {
    const data = storage.getData();
    return Object.values(data.blogs).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getBlogsByAuthor: (authorId: string) => {
    const data = storage.getData();
    return Object.values(data.blogs).filter((b: any) => b.author_id === authorId);
  },

  updateBlog: (id: string, updates: any) => {
    const data = storage.getData();
    if (data.blogs[id]) {
      data.blogs[id] = { ...data.blogs[id], ...updates, updatedAt: new Date().toISOString() };
      storage.saveData(data);
    }
    return data.blogs[id];
  },

  updateBlogLikes: (id: string, likes: number) => {
    const data = storage.getData();
    if (data.blogs[id]) {
      data.blogs[id].likes = likes;
      storage.saveData(data);
    }
    return data.blogs[id];
  },

  deleteBlog: (id: string) => {
    const data = storage.getData();
    delete data.blogs[id];
    storage.saveData(data);
  },

  deleteIssue: (id: string) => {
    const data = storage.getData();
    delete data.issues[id];
    storage.saveData(data);
  },

  // Blog Comments
  addBlogComment: (comment: any) => {
    const data = storage.getData();
    if (!data.blogComments) data.blogComments = {};
    const id = `blogcomment_${Date.now()}`;
    const timestamp = new Date().toISOString();
    data.blogComments[id] = {
      ...comment,
      id,
      createdAt: timestamp,
      created_at: timestamp, // Keep both for compatibility
    };
    storage.saveData(data);
    return data.blogComments[id];
  },

  getBlogComments: (blogId: string) => {
    const data = storage.getData();
    if (!data.blogComments) return [];
    return Object.values(data.blogComments)
      .filter((c: any) => c.blog_id === blogId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateBlogComment: (id: string, updates: any) => {
    const data = storage.getData();
    if (data.blogComments && data.blogComments[id]) {
      data.blogComments[id] = { ...data.blogComments[id], ...updates, updatedAt: new Date().toISOString() };
      storage.saveData(data);
    }
    return data.blogComments?.[id] || null;
  },

  deleteBlogComment: (id: string) => {
    const data = storage.getData();
    if (data.blogComments) {
      delete data.blogComments[id];
      storage.saveData(data);
    }
  },

  // Issues
  addIssue: (issue: any) => {
    const data = storage.getData();
    const id = `issue_${Date.now()}`;
    data.issues[id] = { ...issue, id, created_at: new Date().toISOString() };
    storage.saveData(data);
    return data.issues[id];
  },

  getIssue: (id: string) => {
    const data = storage.getData();
    return data.issues[id] || null;
  },

  getAllIssues: () => {
    const data = storage.getData();
    return Object.values(data.issues);
  },

  updateIssue: (id: string, updates: any) => {
    const data = storage.getData();
    if (data.issues[id]) {
      data.issues[id] = { ...data.issues[id], ...updates, updatedAt: new Date().toISOString() };
      storage.saveData(data);
    }
    return data.issues[id];
  },

  // Issue Comments
  addIssueComment: (comment: any) => {
    const data = storage.getData();
    if (!data.issueComments) data.issueComments = {};
    const id = `comment_${Date.now()}`;
    const timestamp = new Date().toISOString();
    data.issueComments[id] = { 
      ...comment, 
      id, 
      createdAt: timestamp,
      created_at: timestamp // Keep both for compatibility
    };
    storage.saveData(data);
    return data.issueComments[id];
  },

  getIssueComments: (issueId: string) => {
    const data = storage.getData();
    if (!data.issueComments) return [];
    return Object.values(data.issueComments).filter((c: any) => c.issue_id === issueId);
  },

  getAllIssueComments: () => {
    const data = storage.getData();
    if (!data.issueComments) return [];
    return Object.values(data.issueComments);
  },

  getAllBlogComments: () => {
    const data = storage.getData();
    if (!data.blogComments) return [];
    return Object.values(data.blogComments);
  },

  updateIssueComment: (id: string, updates: any) => {
    const data = storage.getData();
    if (data.issueComments && data.issueComments[id]) {
      data.issueComments[id] = { ...data.issueComments[id], ...updates, updatedAt: new Date().toISOString() };
      storage.saveData(data);
    }
    return data.issueComments?.[id] || null;
  },

  deleteIssueComment: (id: string) => {
    const data = storage.getData();
    if (data.issueComments) {
      delete data.issueComments[id];
      storage.saveData(data);
    }
  },

  // Participants
  addParticipant: (hackathonId: string, userId: string) => {
    const data = storage.getData();
    const id = `participant_${hackathonId}_${userId}`;
    data.participants[id] = { 
      id, 
      hackathon_id: hackathonId, 
      user_id: userId, 
      registeredAt: new Date().toISOString() 
    };
    storage.saveData(data);
    return data.participants[id];
  },

  getHackathonParticipants: (hackathonId: string) => {
    const data = storage.getData();
    return Object.values(data.participants).filter((p: any) => p.hackathon_id === hackathonId);
  },

  // General Messages
  addGeneralMessage: (message: any) => {
    const data = storage.getData();
    if (!data.generalMessages) data.generalMessages = {};
    const id = `gmsg_${Date.now()}`;
    const timestamp = new Date().toISOString();
    data.generalMessages[id] = {
      id,
      ...message,
      createdAt: timestamp,
      created_at: timestamp, // Keep both for compatibility
    };
    storage.saveData(data);
    return data.generalMessages[id];
  },

  getGeneralMessages: () => {
    const data = storage.getData();
    if (!data.generalMessages) return [];
    return Object.values(data.generalMessages)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Direct Messages
  addDirectMessage: (message: any) => {
    try {
      const data = storage.getData();
      if (!data.directMessages) data.directMessages = {};
      const id = `dmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      // Validate required fields
      if (!message.sender_id || !message.receiver_id) {
        throw new Error('Missing required fields: sender_id or receiver_id');
      }

      // Validate file data if it's a file message
      if (message.file_url && !message.file_url.startsWith('data:')) {
        throw new Error('Invalid file URL format');
      }

      const newMessage = {
        id,
        ...message,
        message_type: message.message_type || 'text',
        file_url: message.file_url || null,
        file_name: message.file_name || null,
        file_size: message.file_size || null,
        file_type: message.file_type || null,
        read: false,
        createdAt: timestamp,
        created_at: timestamp, // Keep both for compatibility
      };

      data.directMessages[id] = newMessage;
      storage.saveData(data);
      
      console.log('Direct message saved successfully:', id, 'Type:', newMessage.message_type);
      return data.directMessages[id];
    } catch (error) {
      console.error('Error adding direct message:', error);
      throw error;
    }
  },

  getDirectMessages: (userId: string) => {
    const data = storage.getData();
    if (!data.directMessages) return [];
    return Object.values(data.directMessages)
      .filter((m: any) => m.sender_id === userId || m.receiver_id === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markMessageAsRead: (messageId: string) => {
    const data = storage.getData();
    if (data.directMessages && data.directMessages[messageId]) {
      data.directMessages[messageId].read = true;
      storage.saveData(data);
    }
  },

  markMessagesAsRead: (senderId: string, receiverId: string) => {
    const data = storage.getData();
    if (!data.directMessages) return;
    
    Object.keys(data.directMessages).forEach(messageId => {
      const message = data.directMessages[messageId];
      if (message.sender_id === senderId && message.receiver_id === receiverId && !message.read) {
        message.read = true;
      }
    });
    
    storage.saveData(data);
  },

  // Get all users
  getAllUsers: () => {
    const data = storage.getData();
    return Object.values(data.users).map((u: any) => {
      const profile = data.profiles[u.id];
      return {
        id: u.id,
        email: u.email,
        name: profile?.name || 'Anonymous',
      };
    });
  },

  // Clear all data (for reset)
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Get storage usage info
  getStorageInfo: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return { size: 0, sizeInMB: 0 };
      
      const sizeInBytes = data.length * 2; // UTF-16 encoding
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      return {
        size: sizeInBytes,
        sizeInMB: parseFloat(sizeInMB.toFixed(2)),
        totalItems: Object.keys(JSON.parse(data)).length
      };
    } catch {
      return { size: 0, sizeInMB: 0, totalItems: 0 };
    }
  },

  // Clean up old messages (keep only last 50 per conversation, prioritize text over files)
  cleanupOldMessages: () => {
    try {
      const data = storage.getData();
      if (!data.directMessages) return 0;

      const messages = Object.values(data.directMessages) as any[];
      const messagesByConversation: Record<string, any[]> = {};

      // Group messages by conversation
      messages.forEach(msg => {
        const conversationKey = [msg.sender_id, msg.receiver_id].sort().join('_');
        if (!messagesByConversation[conversationKey]) {
          messagesByConversation[conversationKey] = [];
        }
        messagesByConversation[conversationKey].push(msg);
      });

      // Keep only the latest messages per conversation, prioritizing text messages
      const messagesToKeep: Record<string, any> = {};
      Object.values(messagesByConversation).forEach(conversationMessages => {
        const sorted = conversationMessages.sort((a, b) => 
          new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
        );
        
        // Separate text and file messages
        const textMessages = sorted.filter(msg => msg.message_type === 'text' || !msg.file_url);
        const fileMessages = sorted.filter(msg => msg.message_type !== 'text' && msg.file_url);
        
        // Keep last 30 text messages and last 10 file messages
        const textToKeep = textMessages.slice(0, 30);
        const filesToKeep = fileMessages.slice(0, 10);
        
        [...textToKeep, ...filesToKeep].forEach(msg => {
          messagesToKeep[msg.id] = msg;
        });
      });

      data.directMessages = messagesToKeep;
      storage.saveData(data);
      
      const removedCount = messages.length - Object.keys(messagesToKeep).length;
      console.log(`Cleaned up ${removedCount} old messages`);
      return removedCount;
    } catch (error) {
      console.error('Error cleaning up messages:', error);
      return 0;
    }
  },

  // Aggressive cleanup - remove all file messages older than 7 days
  aggressiveCleanup: () => {
    try {
      const data = storage.getData();
      if (!data.directMessages) return 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const messages = Object.values(data.directMessages) as any[];
      const messagesToKeep: Record<string, any> = {};
      let removedCount = 0;

      messages.forEach(msg => {
        const messageDate = new Date(msg.created_at || msg.createdAt);
        const isOldFileMessage = msg.file_url && messageDate < sevenDaysAgo;
        
        if (!isOldFileMessage) {
          messagesToKeep[msg.id] = msg;
        } else {
          removedCount++;
        }
      });

      data.directMessages = messagesToKeep;
      storage.saveData(data);
      
      console.log(`Aggressively cleaned up ${removedCount} old file messages`);
      return removedCount;
    } catch (error) {
      console.error('Error in aggressive cleanup:', error);
      return 0;
    }
  },

  // Clear all file attachments to free up space
  clearAllFileAttachments: () => {
    try {
      const data = storage.getData();
      if (!data.directMessages) return 0;

      let removedCount = 0;
      Object.values(data.directMessages).forEach((msg: any) => {
        if (msg.file_url) {
          msg.file_url = null;
          msg.file_name = null;
          msg.file_size = null;
          msg.file_type = null;
          msg.message_type = 'text';
          msg.content = `[File removed to save space] ${msg.content}`;
          removedCount++;
        }
      });

      storage.saveData(data);
      console.log(`Removed ${removedCount} file attachments`);
      return removedCount;
    } catch (error) {
      console.error('Error clearing file attachments:', error);
      return 0;
    }
  },

  // Migrate old createdAt fields to created_at
  migrateDateFields: () => {
    const data = storage.getData();
    let hasChanges = false;

    // Migrate announcements
    Object.values(data.announcements || {}).forEach((announcement: any) => {
      if (announcement.createdAt && !announcement.created_at) {
        announcement.created_at = announcement.createdAt;
        hasChanges = true;
      }
    });

    // Migrate chat messages
    Object.values(data.chatMessages || {}).forEach((message: any) => {
      if (message.createdAt && !message.created_at) {
        message.created_at = message.createdAt;
        hasChanges = true;
      }
    });

    // Migrate issues
    Object.values(data.issues || {}).forEach((issue: any) => {
      if (issue.createdAt && !issue.created_at) {
        issue.created_at = issue.createdAt;
        hasChanges = true;
      }
    });

    // Migrate blogs
    Object.values(data.blogs || {}).forEach((blog: any) => {
      if (blog.createdAt && !blog.created_at) {
        blog.created_at = blog.createdAt;
        hasChanges = true;
      }
    });

    // Migrate blog comments
    Object.values(data.blogComments || {}).forEach((comment: any) => {
      if (comment.createdAt && !comment.created_at) {
        comment.created_at = comment.createdAt;
        hasChanges = true;
      }
    });

    // Migrate issue comments
    Object.values(data.issueComments || {}).forEach((comment: any) => {
      if (comment.createdAt && !comment.created_at) {
        comment.created_at = comment.createdAt;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      storage.saveData(data);
    }
  },
};
