import { useState } from 'react';
import { Plus, Search, Heart, Edit, Trash2, MessageCircle } from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogs } from '@/hooks/useBlogs';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RelativeTime } from '@/components/RelativeTime';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichBlogEditor, uploadAllImages, processContentWithImageUrls} from '@/components/RichBlogEditor';
import { fileStorage } from '@/lib/fileStorage';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  image_url?: string;
  tags: string[];
  likes: number;
  comment_count?: number;
  created_at: string;
  updated_at?: string;
}

// Helper function to generate excerpt without image markdown
const generateExcerpt = (content: string): string => {
  // Remove image markdown syntax
  const textOnly = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  // Clean up extra whitespace
  const cleaned = textOnly.replace(/\s+/g, ' ').trim();
  // Return excerpt
  return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
};

export default function Blog() {
  const { user, loading: authLoading, isOrganizer } = useAuth();
  const { blogs, loading, createBlog, updateBlog, deleteBlog } = useBlogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'tags'>('latest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [newBlog, setNewBlog] = useState({
    title: '',
    content: '',
    tags: '',
    image: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBlog = async () => {
    if (!newBlog.title.trim() || !newBlog.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (newBlog.image) {
        const fileMetadata = await fileStorage.uploadFile({
          file: newBlog.image,
          bucket: 'blog-images',
          folder: user!.id,
          compress: true,
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.85
        });
        imageUrl = fileMetadata?.publicUrl || null;
      }

      await createBlog({
        title: newBlog.title.trim(),
        content: newBlog.content.trim(),
        excerpt: generateExcerpt(newBlog.content),
        tags: newBlog.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        image_url: imageUrl,
      });

      setNewBlog({ title: '', content: '', tags: '', image: null });
      setIsModalOpen(false);
      toast.success('Blog post published!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBlog = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setNewBlog({
      title: blog.title,
      content: blog.content,
      tags: blog.tags.join(', '),
      image: null,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBlog || !newBlog.title.trim() || !newBlog.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = selectedBlog.image_url;
      if (newBlog.image) {
        const fileMetadata = await fileStorage.uploadFile({
          file: newBlog.image as File,
          bucket: 'blog-images',
          folder: user!.id,
          compress: true,
          maxWidth: 1200,
          maxHeight: 800,
          quality: 0.85
        });
        imageUrl = fileMetadata?.publicUrl || null;
      }

      await updateBlog(selectedBlog.id, {
        title: newBlog.title.trim(),
        content: newBlog.content.trim(),
        excerpt: generateExcerpt(newBlog.content),
        image_url: imageUrl,
        tags: newBlog.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      });

      setIsEditModalOpen(false);
      setSelectedBlog(null);
      setNewBlog({ title: '', content: '', tags: '', image: null });
      toast.success('Blog updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (blog: BlogPost) => {
    setBlogToDelete(blog);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlog(blogToDelete.id);
      setDeleteConfirmOpen(false);
      setBlogToDelete(null);
      toast.success('Blog deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete blog');
    }
  };

  const getFilteredBlogs = () => {
    let filtered = blogs;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tab filter
    if (activeTab === 'popular') {
      // Sort by popularity score: likes + comments (weighted)
      filtered = filtered.sort((a, b) => {
        const scoreA = (a.likes || 0) + (a.comment_count || 0) * 0.5;
        const scoreB = (b.likes || 0) + (b.comment_count || 0) * 0.5;
        return scoreB - scoreA;
      });
    } else if (activeTab === 'latest') {
      filtered = filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return filtered;
  };

  const getAllTags = () => {
    const tagMap = new Map<string, number>();
    blogs.forEach((blog) => {
      blog.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
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

  const filteredBlogs = getFilteredBlogs();
  const tags = getAllTags();

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-1">Read and share insights with the community</p>
        </div>
        <Button variant="hero" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Write Post
        </Button>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md mx-auto sm:mx-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center sm:justify-start">
          {(['latest', 'popular', 'tags'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12 glass rounded-xl">
              <p className="text-muted-foreground">No blog posts found.</p>
            </div>
          ) : (
            filteredBlogs.map((blog) => (
              <div
                key={blog.id}
                className="glass rounded-xl overflow-hidden card-hover group cursor-pointer transition-all"
              >
                {/* Image */}
                {blog.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors flex-1">
                      {blog.title}
                    </h3>
                    {blog.author_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditBlog(blog);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {(blog.author_id === user?.id || isOrganizer) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteClick(blog);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Link
                    to={`/blog/${blog.id}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {blog.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AvatarUpload 
                          currentAvatar={blog.author_avatar || null}
                          userName={blog.author_name}
                          size="sm"
                          editable={false}
                        />
                        <span>{blog.author_name}</span>
                        <span>•</span>
                        <RelativeTime timestamp={blog.created_at} format="short" />
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span className="text-sm">{blog.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{blog.comment_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {blog.tags.length > 0 && (
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {blog.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar - Tags */}
        {activeTab === 'tags' && (
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Popular Tags</h3>
              <div className="space-y-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags yet.</p>
                ) : (
                  tags.map(([tag, count]) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-2 rounded hover:bg-primary/10 cursor-pointer transition-colors"
                      onClick={() => setSearchQuery(tag)}
                    >
                      <span className="text-sm font-medium">#{tag}</span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Blog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Write New Blog Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter blog title..."
                value={newBlog.title}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image (Optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewBlog((prev) => ({ ...prev, image: e.target.files?.[0] || null }))
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your blog content here..."
                value={newBlog.content}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, content: e.target.value }))}
                className="bg-background border-border min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., React, JavaScript, Web Development"
                value={newBlog.tags}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, tags: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleCreateBlog}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Blog Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Edit Blog Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter blog title..."
                value={newBlog.title}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, title: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Cover Image (Optional)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewBlog((prev) => ({ ...prev, image: e.target.files?.[0] || null }))
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                placeholder="Write your blog content here..."
                value={newBlog.content}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, content: e.target.value }))}
                className="bg-background border-border min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma separated)</Label>
              <Input
                id="edit-tags"
                placeholder="e.g., React, JavaScript, Web Development"
                value={newBlog.tags}
                onChange={(e) => setNewBlog((prev) => ({ ...prev, tags: e.target.value }))}
                className="bg-background border-border"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Blog Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
