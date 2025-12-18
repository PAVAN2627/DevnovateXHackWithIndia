
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

    // Subscribe to real-time blog updates
    const subscription = supabase
      .channel('blogs_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blogs',
        },
        async (payload) => {
          console.log('Real-time blog updated in list:', payload);
          const updatedBlog = payload.new as any;
          
          // Update the specific blog in the list with new data
          setBlogs(prevBlogs => 
            prevBlogs.map(blog => 
              blog.id === updatedBlog.id 
                ? { 
                    ...blog, 
                    likes: updatedBlog.likes, 
                    views: updatedBlog.views,
                    updated_at: updatedBlog.updated_at 
                  }
                : blog
            )
          );
          
          console.log('Blog list updated with new like count:', updatedBlog.likes);
        }
      )
      .subscribe();

    // Listen for custom blog like update events
    const handleBlogLikeUpdate = (event: any) => {
      const { blogId, newLikeCount } = event.detail;
      console.log('Custom event: Blog like updated', { blogId, newLikeCount });
      
      setBlogs(prevBlogs => 
        prevBlogs.map(blog => 
          blog.id === blogId 
            ? { ...blog, likes: newLikeCount }
            : blog
        )
      );
    };

    window.addEventListener('blogLikeUpdated', handleBlogLikeUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('blogLikeUpdated', handleBlogLikeUpdate);
    };
  }, [user]);

  // Function to force refresh a specific blog in the list
  const refreshBlogInList = async (blogId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single();

      if (error) throw error;

      if (data) {
        // Get author info
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

        const updatedBlog = {
          ...data,
          author_name: profile?.name || 'Unknown',
          author_avatar: profile?.avatar_url || null,
          comment_count: count || 0,
        };

        // Update this specific blog in the list
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog.id === blogId ? updatedBlog : blog
          )
        );

        console.log('Manually refreshed blog in list:', updatedBlog);
      }
    } catch (error) {
      console.error('Error refreshing blog in list:', error);
    }
  };

  return {
    blogs,
    loading,
    createBlog,
    updateBlog,
    deleteBlog,
    refetch: fetchBlogs,
    refreshBlogInList,
  };
}

export function useBlog(id: string) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBlog = async (incrementViews = false) => {
    try {
      const { data, error } = await (supabase as any)
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Fetched blog data:', { id: data.id, likes: data.likes, title: data.title });

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

        const blogData = {
          ...data,
          author_name: profile?.name || 'Unknown',
          author_avatar: profile?.avatar_url || null,
          comment_count: count || 0,
        };

        console.log('Setting blog state with:', { likes: blogData.likes });
        setBlog(blogData);

        // Only increment views on initial load, not on refreshes
        if (incrementViews) {
          await supabase
            .from('blogs')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id);
        }
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
          console.log('Fetching profile for comment author:', comment.author_id);
          
          // First try to get from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('name, avatar_url, email')
            .eq('user_id', comment.author_id)
            .single();

          console.log('Profile result:', { profile, profileError, authorId: comment.author_id });

          let authorName = profile?.name;
          
          // If no name in profile, try to use email prefix
          if (!authorName && profile?.email) {
            authorName = profile.email.split('@')[0];
          }
          
          // Final fallback
          if (!authorName) {
            authorName = 'Anonymous User';
          }
          
          console.log('Final author name:', authorName);
          
          return {
            ...comment,
            author_name: authorName,
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

    // Add the comment
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

    // Automatically add a like when commenting (if not already liked)
    const { data: existingLike } = await (supabase as any)
      .from('blog_likes')
      .select('id')
      .eq('blog_id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingLike) {
      await (supabase as any)
        .from('blog_likes')
        .insert({ blog_id: id, user_id: user.id });
    }

    // Update like count to match comment count + manual likes
    const { count: commentCount } = await supabase
      .from('blog_comments')
      .select('*', { count: 'exact', head: true })
      .eq('blog_id', id);

    const { count: likeCount } = await (supabase as any)
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('blog_id', id);

    // Update blog with the total like count
    await (supabase as any)
      .from('blogs')
      .update({ likes: likeCount || 0 })
      .eq('id', id);

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
    
    // Update blog state with new like count
    setBlog(prevBlog => 
      prevBlog ? { ...prevBlog, likes: likeCount || 0 } : prevBlog
    );

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

    console.log('toggleLike called:', { userId: user.id, blogId: id, currentLikes: blog.likes });

    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await (supabase as any)
        .from('blog_likes')
        .select('id')
        .eq('blog_id', id)
        .eq('user_id', user.id)
        .single();

      console.log('Existing like check:', { existingLike, checkError });

      if (existingLike) {
        // Unlike
        console.log('Unliking blog...');
        const { error: deleteError } = await (supabase as any)
          .from('blog_likes')
          .delete()
          .eq('blog_id', id)
          .eq('user_id', user.id);

        console.log('Delete like result:', { deleteError });
        if (deleteError) throw deleteError;
      } else {
        // Like
        console.log('Liking blog...');
        const { error: insertError } = await (supabase as any)
          .from('blog_likes')
          .insert({ blog_id: id, user_id: user.id });

        console.log('Insert like result:', { insertError });
        if (insertError) throw insertError;
      }

      // Get the actual count from database instead of using cached value
      const { count: actualLikeCount, error: countError } = await (supabase as any)
        .from('blog_likes')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', id);

      console.log('Actual like count from DB:', { actualLikeCount, countError });

      if (countError) throw countError;

      // Update the blog with the actual count
      const { error: updateError } = await (supabase as any)
        .from('blogs')
        .update({ likes: actualLikeCount || 0 })
        .eq('id', id);

      console.log('Update blog likes with actual count:', { updateError, actualCount: actualLikeCount });
      if (updateError) throw updateError;

      // Directly update the blog state with the correct count
      setBlog(prevBlog => 
        prevBlog ? { ...prevBlog, likes: actualLikeCount || 0 } : prevBlog
      );

      console.log('Blog state updated with new like count:', actualLikeCount);
      
      // Trigger a custom event to notify blog list to refresh
      window.dispatchEvent(new CustomEvent('blogLikeUpdated', { 
        detail: { blogId: id, newLikeCount: actualLikeCount } 
      }));
    } catch (error) {
      console.error('Error in toggleLike:', error);
      throw error;
    }
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
    fetchBlog(true); // Increment views on initial load
    fetchComments();

    // Subscribe to real-time updates for this specific blog
    const subscription = supabase
      .channel(`blog_${id}_updates`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'blogs',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('Individual blog updated:', payload);
          const updatedBlog = payload.new as any;
          
          // Update the blog state with new like count
          setBlog(prevBlog => 
            prevBlog ? { ...prevBlog, likes: updatedBlog.likes, views: updatedBlog.views } : prevBlog
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blog_comments',
          filter: `blog_id=eq.${id}`,
        },
        (payload) => {
          console.log('New comment added:', payload);
          // Refresh comments when a new comment is added
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
    refetch: () => fetchBlog(false), // Don't increment views on manual refresh
  };
}
