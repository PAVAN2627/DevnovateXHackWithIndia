// @ts-nocheck
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useBlog } from '@/hooks/useBlogs';
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
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  content: string;
  created_at: string;
}

export default function BlogDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const { blog, comments, loading, addComment, updateComment, deleteComment, updateBlog, deleteBlog, toggleLike, checkIfLiked } = useBlog(id || '');
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteBlogConfirmOpen, setDeleteBlogConfirmOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });

  // Blog data is loaded by the useBlog hook
  
  useEffect(() => {
    const checkLiked = async () => {
      if (user && id) {
        const liked = await checkIfLiked();
        setIsLiked(liked);
      }
    };
    checkLiked();
  }, [user, id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(newComment.trim());
      
      // Send notification to blog author (only after successful comment addition)
      if (blog && blog.author_id !== user.id) {
        try {
          notificationService.addBlogCommentNotification(
            blog.author_id,
            id!,
            blog.title,
            user.email || 'Anonymous',
            newComment.trim()
          );
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't show error to user for notification failure
        }
      }
      
      setNewComment('');
      toast.success('Comment added!');
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
      await updateComment(commentId, editingCommentText.trim());
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
      await deleteComment(commentToDelete.id);
      setDeleteConfirmOpen(false);
      setCommentToDelete(null);
      toast.success('Comment deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const handleLike = async () => {
    if (!user || !blog) return;

    try {
      const wasLiked = isLiked;
      setIsLiked(!wasLiked); // Optimistic update
      await toggleLike();
      toast.success(wasLiked ? 'Like removed!' : 'Blog liked!');
    } catch (error: any) {
      setIsLiked(wasLiked); // Revert to original state on error
      toast.error(error.message || 'Failed to like blog');
    }
  };

  const handleEditBlog = () => {
    if (blog) {
      setEditFormData({
        title: blog.title,
        content: blog.content,
        tags: blog.tags.join(', '),
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEditBlog = async () => {
    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      await updateBlog({
        title: editFormData.title.trim(),
        content: editFormData.content.trim(),
        tags: editFormData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      });

      setIsEditModalOpen(false);
      toast.success('Blog updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update blog');
    }
  };

  const handleDeleteBlog = async () => {
    try {
      await deleteBlog();
      toast.success('Blog deleted successfully!');
      navigate('/blog');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete blog');
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
                  currentAvatar={blog.author_avatar || null}
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
              
              {/* Edit/Delete buttons for author */}
              {blog.author_id === user?.id && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditBlog}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteBlogConfirmOpen(true)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              
              {/* Delete button for organizers */}
              {blog.author_id !== user?.id && isOrganizer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteBlogConfirmOpen(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
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
                      setProfileModalUser({ id: comment.author_id, name: comment.author_name });
                      setProfileModalOpen(true);
                    }}
                    className="hover:opacity-80 transition-opacity flex-shrink-0"
                  >
                    <AvatarUpload 
                      currentAvatar={comment.author_avatar || null}
                      userName={comment.author_name}
                      size="sm"
                      editable={false}
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => {
                          setProfileModalUser({ id: comment.author_id, name: comment.author_name });
                          setProfileModalOpen(true);
                        }}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {comment.author_name}
                      </button>
                      <div className="flex items-center gap-2">
                        <div title={RelativeTimeTooltip(comment.created_at)}>
                          <RelativeTime timestamp={comment.created_at} format="full" />
                        </div>
                        {comment.author_id === user?.id && (
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
                        {comment.author_id !== user?.id && isOrganizer && (
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

      {/* Edit Blog Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-base font-medium">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Blog title"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label htmlFor="edit-content" className="text-base font-medium">Content</Label>
              <Textarea
                id="edit-content"
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                placeholder="Blog content"
                className="bg-background border-border min-h-[200px]"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags" className="text-base font-medium">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editFormData.tags}
                onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
                className="bg-background border-border"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleSaveEditBlog}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Blog Confirmation */}
      <AlertDialog open={deleteBlogConfirmOpen} onOpenChange={setDeleteBlogConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blog?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBlog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Card Modal */}
      {selectedProfileUser && (
        <UserProfileCard
          userId={selectedProfileUser}
          userName={comments.find((c) => c.author_id === selectedProfileUser)?.author_name || ''}
          onClose={() => setSelectedProfileUser(null)}
          onSendMessage={(userId) => {
            navigate(`/messages?with=${userId}`);
          }}
        />
      )}
    </div>
  );
}
