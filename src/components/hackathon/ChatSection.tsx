import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/hooks/useChat';
import { LinkRenderer } from '@/lib/linkDetector';
import { AvatarUpload } from '@/components/AvatarUpload';

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage?: (content: string) => void;
  onProfileClick?: (userId: string, userName: string) => void;
  loading?: boolean;
}

export function ChatSection({ messages, onSendMessage, onProfileClick, loading }: ChatSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (newMessage.trim() && onSendMessage) {
      setIsSending(true);
      try {
        await onSendMessage(newMessage);
        setNewMessage('');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl flex flex-col h-[500px] animate-pulse">
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-3 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.author_id === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 animate-fade-in',
                  isOwn && 'flex-row-reverse'
                )}
              >
                <AvatarUpload 
                  currentAvatar={message.author_avatar || null}
                  userName={message.author_name}
                  size="sm"
                  editable={false}
                />
                <div className={cn(
                  'max-w-[70%]',
                  isOwn && 'text-right'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => onProfileClick?.(message.author_id, message.author_name || 'Unknown')}
                      className={cn(
                        'text-xs font-medium hover:underline transition-colors',
                        isOwn ? 'text-primary' : 'text-foreground hover:text-primary'
                      )}
                    >
                      {message.author_name}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const date = new Date(message.created_at);
                          if (isNaN(date.getTime())) return 'now';
                          return date.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        } catch {
                          return 'now';
                        }
                      })()}
                    </span>
                  </div>
                  <div className={cn(
                    'rounded-2xl px-4 py-2 inline-block',
                    isOwn 
                      ? 'bg-primary text-primary-foreground rounded-tr-md' 
                      : 'bg-muted rounded-tl-md'
                  )}>
                    <div className="text-sm">
                      <LinkRenderer 
                        text={message.content} 
                        isOwnMessage={isOwn}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        {user ? (
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Please sign in to participate in the chat
          </p>
        )}
      </div>
    </div>
  );
}
