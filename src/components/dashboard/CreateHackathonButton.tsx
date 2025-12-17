import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateHackathonButtonProps {
  onClick: () => void;
}

export function CreateHackathonButton({ onClick }: CreateHackathonButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="hero"
      size="xl"
      className="w-full h-32 rounded-2xl flex flex-col gap-2 animate-pulse-glow"
    >
      <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
        <Plus className="h-8 w-8" />
      </div>
      <span>Organize New Hackathon</span>
    </Button>
  );
}
