import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Upload, X } from 'lucide-react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { imageStorage } from '@/lib/imageStorage';
import { AvatarUpload } from '@/components/AvatarUpload';
import { UserProfileModal } from '@/components/UserProfileModal';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface IssueItem {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  author_id: string;
  author_name?: string;
  image_url?: string;
  attachments?: string[];
  github_url?: string;
  tags: string[];
  created_at: string;
  createdAt?: string; // For backward compatibility
  updated_at?: string;
}

export default function Issues() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: '',
    github_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalUser, setProfileModalUser] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      loadIssues();
    }
  }, [authLoading]);

  const loadIssues = () => {
    try {
      const allIssues = storage.getAllIssues();
      const formattedIssues = (allIssues || []).map((i: any) => {
        const profile = storage.getProfile(i.author_id);
        return {
          ...i,
          author_name: profile?.name || 'Anonymous',
        };
      });
      setIssues(formattedIssues);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !newIssue.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await imageStorage.uploadImage(imageFile);
      }

      const attachmentNames: string[] = [];
      for (const file of uploadedFiles) {
        attachmentNames.push(`${Date.now()}_${file.name}`);
      }

      const issue = storage.addIssue({
        title: newIssue.title.trim(),
        description: newIssue.description.trim(),
        status: 'open',
        priority: newIssue.priority,
        author_id: user.id,
        image_url: imageUrl,
        attachments: attachmentNames.length > 0 ? attachmentNames : undefined,
        github_url: newIssue.github_url.trim() || undefined,
        tags: newIssue.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      });

      const profile = storage.getProfile(user.id);
      const formattedIssue = {
        ...issue,
        author_name: profile?.name || 'Anonymous',
      };

      setIssues((prev) => [formattedIssue, ...prev]);
      setNewIssue({ title: '', description: '', priority: 'medium', tags: '', github_url: '' });
      setImageFile(null);
      setImagePreview(null);
      setUploadedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
      setIsModalOpen(false);
      toast.success('Issue reported successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredIssues = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
    if (selectedTag !== 'all' && !issue.tags.includes(selectedTag)) return false;
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getAllTags = () => {
    const tagMap = new Map<string, number>();
    issues.forEach((issue) => {
      issue.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  const issueStats = {
    open: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-600 border-blue-200',
    medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-200',
    high: 'bg-orange-500/20 text-orange-600 border-orange-200',
    critical: 'bg-red-500/20 text-red-600 border-red-200',
  };

  const statusColors = {
    open: 'bg-blue-500/20 text-blue-600',
    'in-progress': 'bg-yellow-500/20 text-yellow-600',
    resolved: 'bg-green-500/20 text-green-600',
    closed: 'bg-gray-500/20 text-gray-600',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Issues</h1>
          <p className="text-muted-foreground mt-1">Track and manage reported issues</p>
        </div>
        <Button variant="hero" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-sm">{issueStats.open} Open</span>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-sm">{issueStats.inProgress} In Progress</span>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm">{issueStats.resolved} Resolved</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      {getAllTags().length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Filter by Tags</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag('all')}
            >
              All Tags
            </Button>
            {getAllTags().map(([tag]) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">No issues found matching your criteria.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <Link
              key={issue.id}
              to={`/issues/${issue.id}`}
              className="block bg-card border border-border rounded-xl p-8 hover:border-primary/50 hover:shadow-lg group cursor-pointer transition-all"
            >
              {/* Header with Status and Priority */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <span className={`text-xs px-3 py-1 rounded capitalize border ${statusColors[issue.status]}`}>
                    {issue.status}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded capitalize border ${priorityColors[issue.priority]}`}>
                    {issue.priority}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(() => {
                    try {
                      const date = new Date(issue.created_at || issue.createdAt);
                      if (isNaN(date.getTime())) return 'Just now';
                      return date.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                    } catch {
                      return 'Just now';
                    }
                  })()}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-3">
                {issue.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground text-base mb-4 line-clamp-3 leading-relaxed">
                {issue.description}
              </p>

              {/* Tags */}
              {issue.tags.length > 0 && (
                <div className="flex gap-2 mb-6 flex-wrap">
                  {issue.tags.map((tag) => (
                    <span key={tag} className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProfileModalUser({ id: issue.author_id, name: issue.author_name });
                    setProfileModalOpen(true);
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <AvatarUpload 
                    currentAvatar={storage.getProfile(issue.author_id)?.avatar_url || null}
                    userName={issue.author_name}
                    size="md"
                    editable={false}
                  />
                </button>
                <div className="flex-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProfileModalUser({ id: issue.author_id, name: issue.author_name });
                      setProfileModalOpen(true);
                    }}
                    className="font-semibold text-primary hover:underline transition-colors text-left block"
                  >
                    {issue.author_name}
                  </button>
                  <p className="text-sm text-muted-foreground">Issue Reporter</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Create Issue Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Report New Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about the issue..."
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="bg-background border-border min-h-[120px]"
              />
            </div>

            {/* Error Screenshot */}
            <div className="space-y-2">
              <Label>Error Screenshot / Photo</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => imageInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-40 mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="py-2">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Click to upload screenshot</p>
                  </div>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* GitHub Repo */}
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Repo Link (Optional)</Label>
              <Input
                id="github"
                placeholder="https://github.com/username/repo"
                value={newIssue.github_url}
                onChange={(e) => setNewIssue({ ...newIssue, github_url: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label>Attachments (ZIP files, logs, etc.)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleAddFile}
                className="hidden"
              />
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
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

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newIssue.priority}
                onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
              >
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="bug, feature, ui"
                value={newIssue.tags}
                onChange={(e) => setNewIssue({ ...newIssue, tags: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleCreateIssue}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
