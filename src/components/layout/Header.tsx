import { Search, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AvatarUpload } from '@/components/AvatarUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Trophy, 
  BookOpen, 
  AlertCircle, 
  MessageCircle,
  Megaphone
} from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const { profile, role, signOut, isOrganizer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = isOrganizer ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Trophy, label: 'Hackathons', path: '/hackathons' },
    { icon: BookOpen, label: 'Blog', path: '/blog' },
    { icon: AlertCircle, label: 'Issues', path: '/issues' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements' },
    { icon: User, label: 'Profile', path: '/profile' },
  ] : [
    { icon: Trophy, label: 'Hackathons', path: '/hackathons' },
    { icon: BookOpen, label: 'Blog', path: '/blog' },
    { icon: AlertCircle, label: 'Issues', path: '/issues' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 md:px-6">
      {/* Mobile Menu Button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="font-bold text-lg">Menu</h2>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="relative flex-1 max-w-md mx-4 hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search hackathons, blogs, issues..."
          className="pl-10 bg-muted border-transparent focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <AvatarUpload 
                currentAvatar={profile?.avatar_url}
                userName={profile?.name}
                size="sm"
                editable={false}
              />
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{profile?.name || 'User'}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {role || 'participant'}
                </Badge>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
