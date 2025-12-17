import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HackathonCard } from '@/components/dashboard/HackathonCard';
import { CreateHackathonModal } from '@/components/hackathon/CreateHackathonModal';
import { useAuth } from '@/contexts/AuthContext';
import { useHackathons, Hackathon } from '@/hooks/useHackathons';
import { toast } from 'sonner';
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
import { Trophy } from 'lucide-react';

export default function Hackathons() {
  const { isOrganizer, user } = useAuth();
  const { hackathons, loading, createHackathon, uploadHackathonImage, editHackathon, deleteHackathon } = useHackathons();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hackathonToDelete, setHackathonToDelete] = useState<Hackathon | null>(null);

  const handleCreateHackathon = async (data: any, imageFile: File | null) => {
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadHackathonImage(imageFile);
      }

      await createHackathon({
        ...data,
        image_url: imageUrl,
      });

      setIsModalOpen(false);
      toast.success('Hackathon created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create hackathon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHackathon = (hackathon: Hackathon) => {
    setSelectedHackathon(hackathon);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (data: any, imageFile: File | null) => {
    if (!selectedHackathon) return;
    
    setIsSubmitting(true);
    try {
      let imageUrl = selectedHackathon.image_url;
      if (imageFile) {
        imageUrl = await uploadHackathonImage(imageFile);
      }

      await editHackathon(selectedHackathon.id, {
        ...data,
        image_url: imageUrl,
      });

      setIsEditModalOpen(false);
      setSelectedHackathon(null);
      toast.success('Hackathon updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update hackathon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (hackathon: Hackathon) => {
    setHackathonToDelete(hackathon);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hackathonToDelete) return;

    try {
      await deleteHackathon(hackathonToDelete.id);
      setDeleteConfirmOpen(false);
      setHackathonToDelete(null);
      toast.success('Hackathon deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete hackathon');
    }
  };

  const filteredHackathons = hackathons.filter((h) => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false;
    if (modeFilter !== 'all' && h.mode !== modeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hackathons</h1>
          <p className="text-muted-foreground mt-1">Browse and manage all hackathons</p>
        </div>
        {isOrganizer && (
          <Button variant="hero" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Hackathon
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hackathons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hackathons found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <HackathonCard 
              key={hackathon.id} 
              hackathon={hackathon}
              onEdit={handleEditHackathon}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isOrganizer && (
        <>
          <CreateHackathonModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSubmit={handleCreateHackathon}
            isSubmitting={isSubmitting}
          />

          {/* Edit Modal */}
          {selectedHackathon && (
            <CreateHackathonModal
              open={isEditModalOpen}
              onOpenChange={setIsEditModalOpen}
              onSubmit={handleSaveEdit}
              isSubmitting={isSubmitting}
              initialData={selectedHackathon}
              isEditing={true}
            />
          )}

          {/* Delete Confirmation */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Hackathon</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{hackathonToDelete?.title}"? This action cannot be undone.
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
        </>
      )}
    </div>
  );
}
