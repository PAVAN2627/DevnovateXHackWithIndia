import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { imageStorage } from '@/lib/imageStorage';
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
      const allHackathons = storage.getAllHackathons();
      const formattedData = (allHackathons || []).map((h: any) => ({
        ...h,
        organizer_name: 'Devnovate X HackWithIndia',
        participant_count: storage.getHackathonParticipants(h.id).length,
      }));
      setHackathons(formattedData);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHackathon = async (hackathonData: Partial<Hackathon>) => {
    if (!user) throw new Error('Must be logged in');

    const newHackathon = storage.addHackathon({
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
    });

    await fetchHackathons();
    return newHackathon;
  };

  const uploadHackathonImage = async (file: File): Promise<string> => {
    try {
      return await imageStorage.uploadImage(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const editHackathon = async (hackathonId: string, updates: Partial<Hackathon>) => {
    if (!user) throw new Error('Must be logged in');
    
    const hackathon = storage.getHackathon(hackathonId);
    if (hackathon?.organizer_id !== user.id) {
      throw new Error('Only organizer can edit this hackathon');
    }

    const updated = storage.updateHackathon(hackathonId, updates);
    await fetchHackathons();
    return updated;
  };

  const deleteHackathon = async (hackathonId: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const hackathon = storage.getHackathon(hackathonId);
    if (hackathon?.organizer_id !== user.id) {
      throw new Error('Only organizer can delete this hackathon');
    }

    storage.deleteHackathon(hackathonId);
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
    try {
      const data = storage.getHackathon(id);
      if (data) {
        setHackathon({
          ...data,
          organizer_name: 'Devnovate X HackWithIndia',
          participant_count: storage.getHackathonParticipants(id).length,
        });
      }
    } catch (error) {
      console.error('Error fetching hackathon:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { hackathon, loading };
}
