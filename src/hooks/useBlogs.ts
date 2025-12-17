
// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notifications';

export interface Blog {
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
  views: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface BlogComment {
  id: string;
  blog_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  content: string;
  created_at: string;
}

export function useBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBlogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names, avatars, and comment counts
      const blogsWithDetails = await Promise.all(
        (data || []).map(async (blog) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', blog.author_id)
            .single();

          const { count } = await supabase
            .from('blog_comments')
            .select('*', { count: 'exact', head: true })
            .eq('blog_id', blog.id);

          return {
            ...blog,
            author_name: profile?.name || 'Unknown',
            author_avatar: profile?.avatar_url || null,
            comment_count: count || 0,
          };
        })
      );

      setBlogs(blogsWithDetails);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBlog = async (blogData: Partial<Blog>) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await (supabase as any)
      .from('blogs')
      .insert({
        title: blogData.title,
        content: blogData.content,
        excerpt: blogData.excerpt,
        author_id: user.id,
        image_url: blogData.image_url,
        tags: blogData.tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    await fetchBlogs();
    return data;
  };

  const updateBlog = async (blogId: string, updates: Partial<Blog>) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await (supabase as any)
      .from('blogs')
      .update(updates)
      .eq('id', blogId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    await fetchBlogs();
    return data;
  };

  const deleteBlog = async (blogId: string) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await (supabase as any)
      .from('blogs')
      .delete()
      .eq('id', blogId);

    if (error) throw error;

    await fetchBlogs();
  };

  useEffect(() => {
    fetchBlogs();
  }, [user]);

  return {
    blogs,
    loading,
    createBlog,
    updateBlog,
    deleteBlog,
    refetch: fetchBlogs,
  };
}

export function useBlog(id: string) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBlog = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Get author name and avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', data.author_id)
          .single();

        // Get comment count
        const { count } = await supabase
          .from('blog_comments')
          .select('*', { count: 'exact', head: true })
          .eq('blog_id', data.id);

        setBlog({
          ...data,
          author_name: profile?.name || 'Unknown',
          author_avatar: profile?.avatar_url || null,
          comment_count: count || 0,
        });

        // Increment views
        await supabase
          .from('blogs')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user names and avatars
      const commentsWithDetails = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', comment.author_id)
            .single();

          return {
            ...comment,
            author_name: profile?.name || 'Unknown',
            author_avatar: profile?.avatar_url || null,
          };
        })
      );

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (content: string) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        blog_id: id,
        author_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to blog author (if not commenting on own blog)
    if (blog && blog.author_id !== user.id) {
      const { data: commenterProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      notificationService.addBlogCommentNotification(
        blog.author_id,
        id,
        blog.title,
        commenterProfile?.name || 'Someone',
        content
      );
    }

    await fetchComments();
    return data;
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('blog_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;

    await fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    await fetchComments();
  };

  const toggleLike = async () => {
    if (!user || !blog) throw new Error('Must be logged in');

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('blog_likes')
        .delete()
        .eq('blog_id', id)
        .eq('user_id', user.id);

      await supabase
        .from('blogs')
        .update({ likes: Math.max(0, blog.likes - 1) })
        .eq('id', id);
    } else {
      // Like
      await supabase
        .from('blog_likes')
        .insert({ blog_id: id, user_id: user.id });

      await supabase
        .from('blogs')
        .update({ likes: blog.likes + 1 })
        .eq('id', id);
    }

    await fetchBlog();
  };

  const updateBlog = async (updates: Partial<Blog>) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await (supabase as any)
      .from('blogs')
      .update(updates)
      .eq('id', id)
      .eq('author_id', user.id);

    if (error) throw error;

    await fetchBlog();
  };

  const deleteBlog = async () => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await (supabase as any)
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const checkIfLiked = async () => {
    if (!user) return false;

    const { data } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('blog_id', id)
      .eq('user_id', user.id)
      .single();

    return !!data;
  };

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [id]);

  return {
    blog,
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    updateBlog,
    deleteBlog,
    toggleLike,
    checkIfLiked,
    refetch: fetchBlog,
  };
}
