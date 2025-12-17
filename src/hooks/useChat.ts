import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  hackathon_id: string;
  content: string;
  author_id: string;
  message_type: 'text' | 'image' | 'link';
  created_at: string;
  author_name?: string;
}

export function useChat(hackathonId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = storage.getChatMessagesByHackathon(hackathonId);
        const formattedData = (data || []).map((m: any) => {
          const profile = storage.getProfile(m.author_id);
          return {
            ...m,
            author_name: profile?.name || 'Unknown',
          };
        });
        setMessages(formattedData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (hackathonId) {
      fetchMessages();
    }
  }, [hackathonId]);

  const addMessage = async (content: string, messageType: 'text' | 'image' | 'link' = 'text') => {
    if (!user) throw new Error('Must be logged in');

    const message = storage.addChatMessage({
      hackathon_id: hackathonId,
      content,
      author_id: user.id,
      message_type: messageType,
    });

    const profile = storage.getProfile(user.id);
    const formattedMessage = {
      ...message,
      author_name: profile?.name || user.name || 'Unknown',
    };

    setMessages((prev) => [...prev, formattedMessage]);
    return formattedMessage;
  };

  const sendMessage = async (content: string) => {
    return addMessage(content, 'text');
  };

  return {
    messages,
    loading,
    addMessage,
    sendMessage,
  };
}
