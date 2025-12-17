import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fileStorage } from '@/lib/fileStorage';
import { useAuth } from '@/contexts/AuthContext';

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  mode: 'online' | 'offline' | 'hybrid';
  max_participants: number;
  prizes: string[];
  tags: string[];
  image_url: string | null;
  organizer_id: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_at: string;
  participant_count?: number;
  organizer_name?: string;
}

export function useHackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHackathons = async () => {
    try {
      const { data, error } = await supabase
        .from('hackathons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch organizer names separately
      const hackathonsWithDetails = await Promise.all(
        (data || []).map(async (h: any) => {
          // Get organizer name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', h.organizer_id)
            .single();

          // Get participant count
          const { count } = await supabase
            .from('hackathon_participants')
            .select('*', { count: 'exact', head: true })
            .eq('hackathon_id', h.id);

          return {
            ...h,
            organizer_name: profile?.name || 'Unknown',
            participant_count: count || 0,
          };
        })
      );
      
      setHackathons(hackathonsWithDetails);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHackathon = async (hackathonData: Partial<Hackathon>) => {
    if (!user) throw new Error('Must be logged in');

    const { data, error } = await supabase
      .from('hackathons')
      .insert({
        title: hackathonData.title,
        description: hackathonData.description,
        start_date: hackathonData.start_date,
        end_date: hackathonData.end_date,
        registration_deadline: hackathonData.registration_deadline,
        location: hackathonData.location,
        mode: hackathonData.mode,
        max_participants: hackathonData.max_participants,
        prizes: hackathonData.prizes,
        tags: hackathonData.tags,
        image_url: hackathonData.image_url,
        organizer_id: user.id,
        status: 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;

    await fetchHackathons();
    return data;
  };

  const uploadHackathonImage = async (file: File): Promise<string> => {
    try {
      const fileMetadata = await fileStorage.uploadFile({
        file,
        bucket: 'hackathon-media',
        folder: user?.id || 'public',
        compress: true,
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85
      });

      if (!fileMetadata) throw new Error('Failed to upload image');
      return fileMetadata.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const editHackathon = async (hackathonId: string, updates: Partial<Hackathon>) => {
    if (!user) throw new Error('Must be logged in');
    
    const { data: hackathon, error: fetchError } = await supabase
      .from('hackathons')
      .select('organizer_id')
      .eq('id', hackathonId)
      .single();

    if (fetchError) throw fetchError;
    if (hackathon?.organizer_id !== user.id) {
      throw new Error('Only organizer can edit this hackathon');
    }

    const { data, error } = await supabase
      .from('hackathons')
      .update(updates)
      .eq('id', hackathonId)
      .select()
      .single();

    if (error) throw error;

    await fetchHackathons();
    return data;
  };

  const deleteHackathon = async (hackathonId: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const { data: hackathon, error: fetchError } = await supabase
      .from('hackathons')
      .select('organizer_id')
      .eq('id', hackathonId)
      .single();

    if (fetchError) throw fetchError;
    if (hackathon?.organizer_id !== user.id) {
      throw new Error('Only organizer can delete this hackathon');
    }

    const { error } = await supabase
      .from('hackathons')
      .delete()
      .eq('id', hackathonId);

    if (error) throw error;

    await fetchHackathons();
  };

  useEffect(() => {
    fetchHackathons();
  }, [user]);

  return {
    hackathons,
    loading,
    createHackathon,
    uploadHackathonImage,
    editHackathon,
    deleteHackathon,
    refetch: fetchHackathons,
  };
}

export function useHackathon(id: string) {
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const { data, error } = await supabase
          .from('hackathons')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          // Get organizer name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', data.organizer_id)
            .single();

          // Get participant count
          const { count } = await supabase
            .from('hackathon_participants')
            .select('*', { count: 'exact', head: true })
            .eq('hackathon_id', data.id);

          setHackathon({
            ...data,
            organizer_name: profile?.name || 'Unknown',
            participant_count: count || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching hackathon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHackathon();
  }, [id]);

  return { hackathon, loading };
}
