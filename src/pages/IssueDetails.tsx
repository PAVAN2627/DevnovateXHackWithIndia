// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, Upload, X, Download, Github, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LinkRenderer } from '@/lib/linkDetector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useIssue } from '@/hooks/useIssues';
import { UserProfileCard } from '@/components/UserProfileCard';
import { UserProfileModal } from '@/components/UserProfileModal';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime, RelativeTimeTooltip } from '@/components/RelativeTime';
import { notificationService } from '@/lib/notifications';
import { toast } from 'sonner';

interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  content: string;
  attachments?: string[];
  created_at: string;
}

interface IssueItem {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  image_url?: string;
  attachments?: string[];
  github_url?: string;
  comments?: IssueComment[];
  tags: string[];
  created_at: string;
  updated_at?: string;
}

export default function IssueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isOrganizer } = useAuth();
  const { issue, comments, loading, addComment, updateComment, deleteComment, updateIssue, deleteIssue } = useIssue(id || '');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [newStatus, setNewStatus] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deleteCommentConfirmOpen, setDeleteCommentConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<IssueComment | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ id: string; name: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    tags: '',
    github_url: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-600',
    medium: 'bg-yellow-500/20 text-yellow-600',
    high: 'bg-orange-500/20 text-orange-600',
    critical: 'bg-red-500/20 text-red-600',
  };

  const statusColors = {
    open: 'bg-blue-500/20 text-blue-600',
    'in-progress': 'bg-yellow-500/20 text-yellow-600',
    resolved: 'bg-green-500/20 text-green-600',
    closed: 'bg-gray-500/20 text-gray-600',
  };

  // Issue data is loaded by the useIssue hook

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() && uploadedFiles.length === 0) {
      toast.error('Please enter a comment or attach a file');
      return;
    }

    setIsSubmitting(true);
    try {
      // Store file attachments as filenames
      const attachmentNames: string[] = [];
      for (const file of uploadedFiles) {
        const filename = `file_${Date.now()}_${file.name}`;
        attachmentNames.push(filename);
      }

      await addComment(newComment.trim(), attachmentNames);

      // Send notification to issue author (only after successful comment addition)
      if (issue && issue.author_id !== user?.id) {
        try {
          console.log('Sending issue comment notification to:', issue.author_id);
          await notificationService.addIssueCommentNotification(
            issue.author_id,
            id || '',
            issue.title,
            user?.email || 'Anonymous',
            newComment.trim()
          );
          console.log('Issue comment notification sent successfully');
        } catch (notifError) {
          console.error('Failed to send issue comment notification:', notifError);
          // Don't show error to user for notification failure
        }
      }

      setNewComment('');
      setUploadedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Comment error:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatusValue: string) => {
    if (issue?.author_id !== user?.id && !user?.isOrganizer) {
      toast.error('Only the issue creator can change status');
      return;
    }

    try {
      await updateIssue({ status: newStatusValue as any });
      setNewStatus(newStatusValue);
      toast.success('Issue status updated!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteIssue = async () => {
    if (issue?.author_id !== user?.id && !isOrganizer) {
      toast.error('Only the issue creator or organizer can delete the issue');
      return;
    }

    try {
      await deleteIssue();
      toast.success('Issue deleted successfully!');
      navigate('/issues');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete issue');
    }
  };

  const handleEditIssue = () => {
    if (issue) {
      setEditFormData({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        tags: issue.tags.join(', '),
        github_url: issue.github_url || '',
      });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEditIssue = async () => {
    if (!editFormData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!editFormData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      const tagsArray = editFormData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await updateIssue({
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        priority: editFormData.priority as any,
        tags: tagsArray,
        github_url: editFormData.github_url.trim(),
      });

      setIsEditModalOpen(false);
      toast.success('Issue updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update issue');
    }
  };

  const handleEditComment = (comment: IssueComment) => {
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

  const handleDeleteCommentClick = (comment: IssueComment) => {
    setCommentToDelete(comment);
    setDeleteCommentConfirmOpen(true);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await deleteComment(commentToDelete.id);
      setDeleteCommentConfirmOpen(false);
      setCommentToDelete(null);
      toast.success('Comment deleted!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
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
      <div className="space-y-6">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <div className="bg-card border border-border rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Issue not found</h2>
        <Link to="/issues">
          <Button variant="outline">Back to Issues</Button>
        </Link>
      </div>
    );
  }

  const isIssueCreator = issue.author_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/issues">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Issues
        </Button>
      </Link>

      {/* Issue Header */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{issue.title}</h1>
            <div className="flex gap-3 items-center mb-4">
              <span className={`px-3 py-1 rounded text-xs font-medium border ${statusColors[issue.status]}`}>
                {issue.status}
              </span>
              <span className={`px-3 py-1 rounded text-xs font-medium border ${priorityColors[issue.priority]}`}>
                {issue.priority} Priority
              </span>
            </div>
          </div>

          {isIssueCreator && (
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-sm mb-2 block">Change Status</Label>
                <Select value={newStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleEditIssue}
              >
                <Edit className="h-4 w-4" />
                Edit Issue
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Issue
              </Button>
            </div>
          )}

          {!isIssueCreator && isOrganizer && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Issue
            </Button>
          )}
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-6">{issue.description}</p>

        {/* Image */}
        {console.log('Issue details image_url:', issue.image_url)}
        {issue.image_url && (
          <div className="mb-6 rounded-lg overflow-auto bg-muted/50 flex items-center justify-center max-h-96">
            <img 
              src={issue.image_url} 
              alt="Issue screenshot"
              className="w-auto h-auto max-w-full object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setImageModalOpen(true)}
              onLoad={() => console.log('Issue details image loaded:', issue.image_url)}
              onError={(e) => console.error('Issue details image failed:', issue.image_url, e)}
            />
          </div>
        )}

        {/* GitHub Link */}
        {issue.github_url && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Github className="h-4 w-4" />
            <a 
              href={issue.github_url.startsWith('http') ? issue.github_url : `https://${issue.github_url}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline"
            >
              {issue.github_url}
            </a>
          </div>
        )}

        {/* Attachments */}
        {issue.attachments && issue.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {issue.attachments.map((attachment, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span className="text-sm truncate max-w-[200px]">{attachment}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setProfileModalUser({ id: issue.author_id, name: issue.author_name || 'Unknown' });
                setProfileModalOpen(true);
              }}
              className="hover:opacity-80 transition-opacity"
            >
              <AvatarUpload 
                currentAvatar={issue.author_avatar || null}
                userName={issue.author_name}
                size="sm"
                editable={false}
              />
            </button>
            <div>
              <button
                onClick={() => {
                  setProfileModalUser({ id: issue.author_id, name: issue.author_name || 'Unknown' });
                  setProfileModalOpen(true);
                }}
                className="font-medium text-primary hover:underline text-left block"
              >
                {issue.author_name}
              </button>
              <p className="text-xs text-muted-foreground">Issue Reporter</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground" title={RelativeTimeTooltip(issue.created_at)}>
            <RelativeTime timestamp={issue.created_at} format="full" />
          </div>
        </div>

        {/* Tags */}
        {issue.tags.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {issue.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </h2>

        {/* Comments List */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3 mb-2">
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
                        className="font-semibold text-sm text-primary hover:underline text-left"
                      >
                        {comment.author_name}
                      </button>
                  <div className="flex items-center gap-2">
                    <div title={RelativeTimeTooltip(comment.created_at || comment.createdAt)}>
                      <RelativeTime timestamp={comment.created_at || comment.createdAt} format="full" />
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
                  <div className="space-y-2">
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
                  <>
                    <LinkRenderer text={comment.content} className="text-sm mb-3" />
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {comment.attachments.map((attachment, i) => (
                          <a
                            key={i}
                            href="#"
                            className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs hover:bg-muted transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            {attachment}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment */}
        {issue.status !== 'closed' ? (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label>Add Comment</Label>
            <Textarea
              placeholder="Share your solution or discuss the issue..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-background border-border min-h-[100px]"
              disabled={isSubmitting}
            />

          {/* File Upload */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Attach Files (ZIP, Repo)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAddFile}
                className="hidden"
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    <span>{file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmitComment}
            disabled={(!newComment.trim() && uploadedFiles.length === 0) || isSubmitting}
            variant="hero"
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
        ) : (
          <div className="pt-4 border-t border-border">
            <div className="text-center py-6 bg-muted/50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">This issue has been closed. No more comments can be added.</p>
            </div>
          </div>
        )}
      </div>


      {/* Edit Issue Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Issue</DialogTitle>
            <DialogDescription>Update the issue details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title" className="text-base font-medium">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Issue title"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-base font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Issue description"
                className="bg-background border-border min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-priority" className="text-base font-medium">Priority</Label>
                <Select value={editFormData.priority} onValueChange={(value) => setEditFormData({ ...editFormData, priority: value as any })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-github" className="text-base font-medium">GitHub URL</Label>
                <Input
                  id="edit-github"
                  value={editFormData.github_url}
                  onChange={(e) => setEditFormData({ ...editFormData, github_url: e.target.value })}
                  placeholder="GitHub link"
                  className="bg-background border-border"
                />
              </div>
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
              <Button variant="hero" onClick={handleSaveEditIssue}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{issue?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIssue} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={deleteCommentConfirmOpen} onOpenChange={setDeleteCommentConfirmOpen}>
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

      {/* Full Screen Image Modal */}
      {imageModalOpen && issue?.image_url && (
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
              src={issue.image_url} 
              alt="Issue screenshot - Full size"
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
