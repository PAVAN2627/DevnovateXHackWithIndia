import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalUsers: number;
  totalBlogs: number;
  totalIssues: number;
  resolvedIssues: number;
  totalHackathons: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBlogs: 0,
    totalIssues: 0,
    resolvedIssues: 0,
    totalHackathons: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch total users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total blogs count
        const { count: blogsCount } = await supabase
          .from('blogs')
          .select('*', { count: 'exact', head: true });

        // Fetch total issues count
        const { count: issuesCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true });

        // Fetch resolved issues count
        const { count: resolvedCount } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .in('status', ['resolved', 'closed']);

        // Fetch total hackathons count
        const { count: hackathonsCount } = await supabase
          .from('hackathons')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalUsers: usersCount || 0,
          totalBlogs: blogsCount || 0,
          totalIssues: issuesCount || 0,
          resolvedIssues: resolvedCount || 0,
          totalHackathons: hackathonsCount || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading };
}