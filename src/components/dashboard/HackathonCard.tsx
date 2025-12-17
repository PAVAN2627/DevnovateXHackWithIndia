import { useState } from 'react';
import { Calendar, MapPin, ArrowRight, ImageIcon, Edit, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Hackathon } from '@/hooks/useHackathons';
import { useAuth } from '@/contexts/AuthContext';

interface HackathonCardProps {
  hackathon: Hackathon;
  onEdit?: (hackathon: Hackathon) => void;
  onDelete?: (hackathon: Hackathon) => void;
}

export function HackathonCard({ hackathon, onEdit, onDelete }: HackathonCardProps) {
  const { user } = useAuth();
  const isCreator = user?.id === hackathon.organizer_id;
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const statusColors = {
    upcoming: 'bg-info/20 text-info border-info/30',
    ongoing: 'bg-success/20 text-success border-success/30',
    completed: 'bg-muted text-muted-foreground border-muted',
  };

  const modeColors = {
    online: 'bg-secondary/20 text-secondary border-secondary/30',
    offline: 'bg-warning/20 text-warning border-warning/30',
    hybrid: 'bg-primary/20 text-primary border-primary/30',
  };



  return (
    <div className="glass rounded-xl overflow-hidden card-hover group">
      {/* Image or gradient header */}
      {hackathon.image_url ? (
        <div className="h-40 overflow-hidden">
          <img 
            src={hackathon.image_url} 
            alt={hackathon.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setImageModalOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="h-2 bg-gradient-primary" />
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2">
            <Badge className={cn('border', statusColors[hackathon.status as keyof typeof statusColors])}>
              {hackathon.status}
            </Badge>
            <Badge className={cn('border', modeColors[hackathon.mode as keyof typeof modeColors])}>
              {hackathon.mode}
            </Badge>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {hackathon.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {hackathon.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(hackathon.start_date).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })} - {new Date(hackathon.end_date).toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{hackathon.location}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {hackathon.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        {/* Prizes */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Prize Pool: </span>
            <span className="font-bold text-primary">{hackathon.prizes[0] || 'TBA'}</span>
          </div>
          <div className="flex gap-2 items-center">
            {isCreator && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit?.(hackathon);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete?.(hackathon);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {user ? (
              <Link to={`/hackathons/${hackathon.id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="gap-1">
                  Sign In to View
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {imageModalOpen && hackathon.image_url && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={hackathon.image_url} 
              alt={`${hackathon.title} - Full size`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
