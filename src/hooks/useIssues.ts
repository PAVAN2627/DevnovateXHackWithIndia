// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/lib/notifications';

export interface Issue {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  upvotes: number;
  image_url?: string;
  github_url?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string | null;
  content: string;
  attachments?: string[];
  created_at: string;
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIssues = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch author names, avatars, and comment counts
      const issuesWithDetails = await Promise.all(
        (data || []).map(async (issue) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('user_id', issue.author_id)
            .single();

          const { count } = await supabase
            .from('issue_comments')
            .select('*', { count: 'exact', head: true })
            .eq('issue_id', issue.id);

          return {
            ...issue,
            author_name: profile?.name || 'Unknown',
            author_avatar: profile?.avatar_url || null,
            comment_count: count || 0,
          };
        })
      );

      console.log('Fetched issues with details:', issuesWithDetails);
      setIssues(issuesWithDetails);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const createIssue = async (issueData: Partial<Issue>) => {
    if (!user) throw new Error('Must be logged in');

    console.log('createIssue received data:', issueData);
    const insertData = {
      title: issueData.title,
      description: issueData.description,
      author_id: user.id,
      status: issueData.status || 'open',
      priority: issueData.priority || 'medium',
      tags: issueData.tags || [],
      image_url: issueData.image_url || null,
      github_url: issueData.github_url || null,
      attachments: issueData.attachments || [],
    };
    console.log('Inserting issue data:', insertData);

    const { data, error } = await (supabase as any)
      .from('issues')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating issue:', error);
      throw error;
    }

    console.log('Issue created successfully:', data);
    await fetchIssues();
    return data;
  };



  useEffect(() => {
    fetchIssues();
  }, [user]);

  return {
    issues,
    loading,
    createIssue,
    refetch: fetchIssues,
  };
}

export function useIssue(id: string) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchIssue = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('issues')
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
          .from('issue_comments')
          .select('*', { count: 'exact', head: true })
          .eq('issue_id', data.id);

        const issueWithDetails = {
          ...data,
          author_name: profile?.name || 'Unknown',
          author_avatar: profile?.avatar_url || null,
          comment_count: count || 0,
        };
        console.log('Issue details with image_url:', issueWithDetails);
        setIssue(issueWithDetails);
      }
    } catch (error) {
      console.error('Error fetching issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select('*')
        .eq('issue_id', id)
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

  const addComment = async (content: string, attachments?: string[]) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('issue_comments')
      .insert({
        issue_id: id,
        author_id: user.id,
        content,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to issue author (if not commenting on own issue)
    if (issue && issue.author_id !== user.id) {
      const { data: commenterProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      notificationService.addIssueCommentNotification(
        issue.author_id,
        id,
        issue.title,
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
      .from('issue_comments')
      .update({ content })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;

    await fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await supabase
      .from('issue_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;

    await fetchComments();
  };

  const updateIssue = async (updates: Partial<Issue>) => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await (supabase as any)
      .from('issues')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    await fetchIssue();
  };

  const deleteIssue = async () => {
    if (!user) throw new Error('Must be logged in');

    const { error } = await (supabase as any)
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const toggleUpvote = async () => {
    if (!user || !issue) throw new Error('Must be logged in');

    // Check if already upvoted
    const { data: existingUpvote } = await supabase
      .from('issue_upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingUpvote) {
      // Remove upvote
      await supabase
        .from('issue_upvotes')
        .delete()
        .eq('issue_id', id)
        .eq('user_id', user.id);

      await supabase
        .from('issues')
        .update({ upvotes: Math.max(0, issue.upvotes - 1) })
        .eq('id', id);
    } else {
      // Add upvote
      await supabase
        .from('issue_upvotes')
        .insert({ issue_id: id, user_id: user.id });

      await supabase
        .from('issues')
        .update({ upvotes: issue.upvotes + 1 })
        .eq('id', id);
    }

    await fetchIssue();
  };

  const checkIfUpvoted = async () => {
    if (!user) return false;

    const { data } = await supabase
      .from('issue_upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', user.id)
      .single();

    return !!data;
  };

  useEffect(() => {
    fetchIssue();
    fetchComments();
  }, [id]);

  return {
    issue,
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    updateIssue,
    deleteIssue,
    toggleUpvote,
    checkIfUpvoted,
    refetch: fetchIssue,
  };
}
