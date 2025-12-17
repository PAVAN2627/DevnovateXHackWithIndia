import { useState, useEffect } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { storage } from '@/lib/storage';
import { LinkRenderer } from '@/lib/linkDetector';
import { BlogContentRenderer } from '@/components/BlogContentRenderer';
import { UserProfileCard } from '@/components/UserProfileCard';
import { UserProfileModal } from '@/components/UserProfileModal';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime, RelativeTimeTooltip } from '@/components/RelativeTime';
import { notificationService } from '@/lib/notifications';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_id: string;
  author_name?: string;
  image_url?: string;
  tags: string[];
  likes: number;
  created_at: string;
  updated_at?: string;
}

interface Comment {
  id: string;
  blog_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  created_at?: string;
  createdAt?: string;
}

export default function BlogDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ id: string; name: string } | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      loadBlog();
    }
  }, [id, authLoading]);

  const loadBlog = () => {
    try {
      if (!id) {
        setLoading(false);
        return;
      }

      const allBlogs = storage.getAllBlogs();
      const foundBlog = (allBlogs || []).find((b: any) => b.id === id);

      if (foundBlog) {
        const profile = storage.getProfile(foundBlog.author_id);
        const formattedBlog = {
          ...foundBlog,
          author_name: profile?.name || 'Anonymous',
        };
        setBlog(formattedBlog);

        // Load comments for this blog
        const blogComments = storage.getBlogComments(id)
          .map((c: any) => {
            const commenterProfile = storage.getProfile(c.user_id);
            return {
              ...c,
              user_name: commenterProfile?.name || 'Anonymous',
            };
          });
        setComments(blogComments);

        // Check if user has liked this blog
        const userLikes = storage.getData().blogLikes || {};
        setIsLiked(userLikes[`${user?.id}-${id}`] || false);
      }
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = storage.addBlogComment({
        blog_id: id!,
        user_id: user.id,
        content: newComment.trim(),
      });

      const profile = storage.getProfile(user.id);
      const formattedComment = {
        ...comment,
        user_name: profile?.name || 'Anonymous',
      };

      setComments((prev) => [formattedComment, ...prev]);
      setNewComment('');
      toast.success('Comment added!');

      // Send notification to blog author
      if (blog && blog.author_id !== user.id) {
        notificationService.addBlogCommentNotification(
          id!,
          blog.title,
          profile?.name || 'Anonymous',
          newComment.trim()
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      storage.updateBlogComment(commentId, {
        content: editingCommentText.trim(),
      });

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: editingCommentText.trim() }
            : c
        )
      );
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update comment');
    }
  };

  const handleDeleteCommentClick = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      storage.deleteBlogComment(commentToDelete.id);
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
      toast.success('Comment deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const handleLike = () => {
    if (!user || !blog) return;

    try {
      const likeKey = `${user.id}-${blog.id}`;
      const userLikes = storage.getData().blogLikes || {};
      const newLikes = userLikes[likeKey] ? blog.likes - 1 : blog.likes + 1;

      // Update blog likes
      storage.updateBlogLikes(blog.id, newLikes);

      // Update like status
      userLikes[likeKey] = !userLikes[likeKey];
      const data = storage.getData();
      data.blogLikes = userLikes;
      localStorage.setItem('devnovate_app_data', JSON.stringify(data));

      setBlog({ ...blog, likes: newLikes });
      setIsLiked(!isLiked);
      toast.success(isLiked ? 'Like removed!' : 'Blog liked!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to like blog');
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
        <div className="animate-pulse text-primary">Loading blog...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="space-y-6">
        <Link to="/blog" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>
        <div className="text-center py-12 glass rounded-xl">
          <p className="text-muted-foreground text-lg">Blog post not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/blog" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Blogs
      </Link>

      {/* Blog Content */}
      <article className="glass rounded-xl overflow-hidden">
        {/* Hero Image */}
        {blog.image_url && (
          <div className="h-96 overflow-auto bg-muted/50 flex items-center justify-center">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-auto h-auto max-w-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setImageModalOpen(true)}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Title */}
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

          {/* Meta */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setProfileModalUser({ id: blog.author_id, name: blog.author_name });
                  setProfileModalOpen(true);
                }}
                className="hover:opacity-80 transition-opacity"
              >
                <AvatarUpload 
                  currentAvatar={storage.getProfile(blog.author_id)?.avatar_url || null}
                  userName={blog.author_name}
                  size="md"
                  editable={false}
                />
              </button>
              <div>
                <button
                  onClick={() => {
                    setProfileModalUser({ id: blog.author_id, name: blog.author_name });
                    setProfileModalOpen(true);
                  }}
                  className="font-medium text-primary hover:underline transition-colors text-left"
                >
                  {blog.author_name}
                </button>
                <div title={RelativeTimeTooltip(blog.created_at)} className="text-sm text-muted-foreground">
                  <RelativeTime timestamp={blog.created_at} format="full" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {blog.likes || 0}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {comments.length}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: blog.title,
                      text: blog.excerpt || blog.title,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Link copied to clipboard!');
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="mb-8">
            <BlogContentRenderer content={blog.content} className="text-base leading-relaxed" />
          </div>

          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8 pb-8 border-b border-border">
              {blog.tags.map((tag) => (
                <span key={tag} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Comments Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

        {/* Add Comment */}
        <div className="glass rounded-xl p-6">
          <Label htmlFor="comment" className="text-base font-medium mb-2 block">
            Add your comment
          </Label>
          <Textarea
            id="comment"
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-background border-border min-h-[120px] mb-4"
          />
          <Button
            variant="hero"
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 glass rounded-xl">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="glass rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      setProfileModalUser({ id: comment.user_id, name: comment.user_name });
                      setProfileModalOpen(true);
                    }}
                    className="hover:opacity-80 transition-opacity flex-shrink-0"
                  >
                    <AvatarUpload 
                      currentAvatar={storage.getProfile(comment.user_id)?.avatar_url || null}
                      userName={comment.user_name}
                      size="sm"
                      editable={false}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          setProfileModalUser({ id: comment.user_id, name: comment.user_name });
                          setProfileModalOpen(true);
                        }}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {comment.user_name}
                      </button>
                      <div className="flex items-center gap-2">
                        <div title={RelativeTimeTooltip(comment.created_at || comment.createdAt)}>
                          <RelativeTime timestamp={comment.created_at || comment.createdAt} format="full" />
                        </div>
                        {comment.user_id === user?.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(comment)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCommentClick(comment)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {comment.user_id !== user?.id && isOrganizer && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommentClick(comment)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2 mb-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="bg-background border-border min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEditComment(comment.id)}
                            disabled={!editingCommentText.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <LinkRenderer text={comment.content} className="text-base leading-relaxed whitespace-pre-wrap" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
          navigate(`/messages?with=${userId}`);
        }}
      />

      {/* Full Screen Image Modal */}
      {imageModalOpen && blog?.image_url && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={blog.image_url} 
              alt={`${blog.title} - Full size`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Profile Card Modal */}
      {selectedProfileUser && (
        <UserProfileCard
          userId={selectedProfileUser}
          userName={comments.find((c) => c.user_id === selectedProfileUser)?.user_name || ''}
          onClose={() => setSelectedProfileUser(null)}
          onSendMessage={(userId) => {
            navigate(`/messages?with=${userId}`);
          }}
        />
      )}
    </div>
  );
}
