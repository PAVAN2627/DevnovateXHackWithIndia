import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Trophy, Users, BookOpen, AlertCircle, BarChart3, X, CheckCircle } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CreateHackathonButton } from '@/components/dashboard/CreateHackathonButton';
import { HackathonCard } from '@/components/dashboard/HackathonCard';
import { CreateHackathonModal } from '@/components/hackathon/CreateHackathonModal';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useHackathons, Hackathon } from '@/hooks/useHackathons';
import { storage } from '@/lib/storage';
import { RelativeTime } from '@/components/RelativeTime';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile, isOrganizer, loading: authLoading } = useAuth();
  const { hackathons, loading, createHackathon, uploadHackathonImage, editHackathon, deleteHackathon } = useHackathons();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hackathonToDelete, setHackathonToDelete] = useState<Hackathon | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalType, setDetailsModalType] = useState<'hackathons' | 'users' | 'blogs' | 'issues'>('hackathons');
  const [detailsModalData, setDetailsModalData] = useState<any[]>([]);

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

  // Filter hackathons for organizer (only their own)
  const displayHackathons = isOrganizer 
    ? hackathons.filter(h => h.organizer_id === user.id)
    : hackathons;

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

  const totalParticipants = displayHackathons.reduce(
    (sum, h) => sum + (h.participant_count || 0), 
    0
  );

  // Get analytics for organizer
  const allUsers = Object.values((storage.getData && storage.getData().users) || {});
  const allBlogs = storage.getAllBlogs?.() || [];
  const allIssues = storage.getAllIssues?.() || [];
  const resolvedIssues = (allIssues || []).filter((i: any) => i.status === 'resolved' || i.status === 'closed').length;

  const handleStatsClick = (type: 'hackathons' | 'users' | 'blogs' | 'issues') => {
    let data: any[] = [];
    
    switch (type) {
      case 'hackathons':
        data = displayHackathons.map(h => ({
          id: h.id,
          title: h.title,
          status: h.status,
          mode: h.mode,
          start_date: h.start_date,
          end_date: h.end_date,
          created_at: h.created_at
        }));
        break;
      case 'users':
        data = allUsers.map((u: any) => {
          const profile = storage.getProfile(u.id);
          return {
            id: u.id,
            name: profile?.name || 'Anonymous',
            email: u.email,
            role: storage.getUserRole(u.id),
            created_at: u.createdAt
          };
        });
        break;
      case 'blogs':
        data = allBlogs.map((b: any) => {
          const profile = storage.getProfile(b.author_id);
          return {
            id: b.id,
            title: b.title,
            author: profile?.name || 'Anonymous',
            likes: b.likes || 0,
            created_at: b.created_at || b.createdAt
          };
        });
        break;
      case 'issues':
        data = allIssues.map((i: any) => {
          const profile = storage.getProfile(i.author_id);
          return {
            id: i.id,
            title: i.title,
            author: profile?.name || 'Anonymous',
            status: i.status,
            priority: i.priority,
            created_at: i.created_at || i.createdAt
          };
        });
        break;
    }
    
    setDetailsModalType(type);
    setDetailsModalData(data);
    setDetailsModalOpen(true);
  };

  const handleCloseIssue = (issueId: string) => {
    try {
      storage.updateIssue(issueId, { status: 'closed' });
      // Refresh the data
      const updatedData = detailsModalData.map(item => 
        item.id === issueId ? { ...item, status: 'closed' } : item
      );
      setDetailsModalData(updatedData);
      toast.success('Issue closed successfully!');
    } catch (error) {
      toast.error('Failed to close issue');
    }
  };

  const stats = isOrganizer ? [
    { 
      title: 'Your Hackathons', 
      value: displayHackathons.length, 
      change: '', 
      changeType: 'neutral' as const, 
      icon: Trophy,
      onClick: () => handleStatsClick('hackathons')
    },
    { 
      title: 'Total Users', 
      value: allUsers.length, 
      change: '', 
      changeType: 'neutral' as const, 
      icon: Users,
      onClick: () => handleStatsClick('users')
    },
    { 
      title: 'Total Blogs', 
      value: allBlogs.length, 
      change: '', 
      changeType: 'neutral' as const, 
      icon: BookOpen,
      onClick: () => handleStatsClick('blogs')
    },
    {
      title: 'Issues Solved',
      value: resolvedIssues,
      change: `of ${allIssues.length} total`,
      changeType: 'neutral' as const,
      icon: AlertCircle,
      onClick: () => handleStatsClick('issues')
    },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {profile?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isOrganizer 
            ? "Here's what's happening with your hackathons."
            : "Explore and join exciting hackathons."}
        </p>
      </div>

      {/* Stats - Only for organizers */}
      {isOrganizer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* Create Hackathon Button - Only for organizers */}
      {isOrganizer && (
        <div className="max-w-md mx-auto">
          <CreateHackathonButton onClick={() => setIsModalOpen(true)} />
        </div>
      )}

      {/* Hackathons Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {isOrganizer ? 'Your Hackathons' : 'All Hackathons'}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : displayHackathons.length === 0 ? (
          <div className="text-center py-12 glass rounded-xl">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isOrganizer 
                ? "You haven't created any hackathons yet. Click the button above to get started!"
                : "No hackathons available at the moment. Check back later!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayHackathons.map((hackathon) => (
              <HackathonCard 
                key={hackathon.id} 
                hackathon={hackathon}
                onEdit={isOrganizer ? handleEditHackathon : undefined}
                onDelete={isOrganizer ? handleDeleteClick : undefined}
              />
            ))}
          </div>
        )}
      </div>

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

          {/* Details Modal */}
          <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailsModalType === 'hackathons' && <Trophy className="h-5 w-5" />}
                  {detailsModalType === 'users' && <Users className="h-5 w-5" />}
                  {detailsModalType === 'blogs' && <BookOpen className="h-5 w-5" />}
                  {detailsModalType === 'issues' && <AlertCircle className="h-5 w-5" />}
                  {detailsModalType === 'hackathons' && 'All Hackathons'}
                  {detailsModalType === 'users' && 'All Users'}
                  {detailsModalType === 'blogs' && 'All Blogs'}
                  {detailsModalType === 'issues' && 'All Issues'}
                </DialogTitle>
                <DialogDescription>
                  {detailsModalType === 'hackathons' && 'Manage your hackathons'}
                  {detailsModalType === 'users' && 'View all registered users'}
                  {detailsModalType === 'blogs' && 'View all blog posts'}
                  {detailsModalType === 'issues' && 'Manage platform issues'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {detailsModalData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {detailsModalData.map((item) => (
                      <div 
                        key={item.id} 
                        className="glass rounded-lg p-4 cursor-pointer hover:shadow-glow transition-all"
                        onClick={() => {
                          if (detailsModalType === 'hackathons') {
                            navigate(`/hackathons/${item.id}`);
                          } else if (detailsModalType === 'users') {
                            navigate(`/profile/${item.id}`);
                          } else if (detailsModalType === 'blogs') {
                            navigate(`/blog/${item.id}`);
                          } else if (detailsModalType === 'issues') {
                            navigate(`/issues/${item.id}`);
                          }
                          setDetailsModalOpen(false);
                        }}
                      >
                        {detailsModalType === 'hackathons' && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{item.status}</Badge>
                                <Badge variant="outline">{item.mode}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(item.start_date).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })} - {new Date(item.end_date).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {detailsModalType === 'users' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={item.role === 'organizer' ? 'default' : 'outline'}>
                                {item.role}
                              </Badge>
                              <RelativeTime timestamp={item.created_at} />
                            </div>
                          </div>
                        )}

                        {detailsModalType === 'blogs' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">by {item.author}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {item.likes} likes
                              </span>
                              <RelativeTime timestamp={item.created_at} />
                            </div>
                          </div>
                        )}

                        {detailsModalType === 'issues' && (
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">by {item.author}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={
                                    item.status === 'resolved' ? 'default' : 
                                    item.status === 'closed' ? 'secondary' : 'outline'
                                  }
                                >
                                  {item.status}
                                </Badge>
                                <Badge 
                                  variant={
                                    item.priority === 'critical' ? 'destructive' : 
                                    item.priority === 'high' ? 'default' : 'outline'
                                  }
                                >
                                  {item.priority}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RelativeTime timestamp={item.created_at} />
                              {item.status !== 'closed' && item.status !== 'resolved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseIssue(item.id);
                                  }}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Close
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
