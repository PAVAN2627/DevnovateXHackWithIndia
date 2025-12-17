import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trophy, 
  BookOpen, 
  AlertCircle, 
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User,
  MessageCircle,
  Megaphone,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadAnnouncements } from '@/hooks/useUnreadAnnouncements';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isOrganizer, signOut } = useAuth();
  const { unreadCount } = useUnreadAnnouncements();

  // Different nav items based on role
  const navItems = isOrganizer ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', shortLabel: 'Dash' },
    { icon: Trophy, label: 'Hackathons', path: '/hackathons', shortLabel: 'Hack' },
    { icon: BookOpen, label: 'Blog', path: '/blog', shortLabel: 'Blog' },
    { icon: AlertCircle, label: 'Issues', path: '/issues', shortLabel: 'Issues' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', shortLabel: 'Chat' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements', shortLabel: 'News' },
    { icon: User, label: 'Profile', path: '/profile', shortLabel: 'Profile' },
  ] : [
    { icon: Trophy, label: 'Hackathons', path: '/hackathons', shortLabel: 'Hack' },
    { icon: BookOpen, label: 'Blog', path: '/blog', shortLabel: 'Blog' },
    { icon: AlertCircle, label: 'Issues', path: '/issues', shortLabel: 'Issues' },
    { icon: MessageCircle, label: 'Messages', path: '/messages', shortLabel: 'Chat' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements', shortLabel: 'News' },
    { icon: User, label: 'Profile', path: '/profile', shortLabel: 'Profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Mobile Navigation (Bottom Bar)
  const MobileNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative min-w-0 flex-1',
                isActive
                  ? 'text-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
              <span className={cn('text-xs font-medium truncate', isActive && 'text-primary')}>
                {item.shortLabel}
              </span>
              {item.path === '/announcements' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-0 flex-1"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs font-medium">More</span>
        </Button>
      </div>
    </div>
  );

  // Mobile Menu Overlay
  const MobileMenuOverlay = () => (
    <div className={cn(
      'md:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
      mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      <div className={cn(
        'fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border rounded-t-xl transition-transform duration-300',
        mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/devnovatelogo.png" 
                alt="Devnovate" 
                className="h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-6 w-6 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-muted-foreground font-bold text-sm">X</span>
            <div className="flex items-center gap-2">
              <img 
                src="/assets/hackwithindialogo.png" 
                alt="HackWithIndia" 
                className="h-6 w-6 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex h-6 w-6 items-center justify-center rounded-lg bg-secondary">
                <Trophy className="h-3 w-3 text-secondary-foreground" />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMobileMenu}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                <div className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.path === '/announcements' && unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
          
          <div className="border-t border-sidebar-border pt-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 px-3 py-3"
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/devnovatelogo.png" 
                    alt="Devnovate" 
                    className="h-7 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                    <Zap className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
                <span className="text-muted-foreground font-bold text-sm">X</span>
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/hackwithindialogo.png" 
                    alt="HackWithIndia" 
                    className="h-7 w-7 object-contain rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                    <Trophy className="h-4 w-4 text-secondary-foreground" />
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex flex-col items-center gap-1 mx-auto">
                <img 
                  src="/assets/devnovatelogo.png" 
                  alt="Devnovate" 
                  className="h-4 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-4 w-4 items-center justify-center rounded bg-primary">
                  <Zap className="h-3 w-3 text-primary-foreground" />
                </div>
                <img 
                  src="/assets/hackwithindialogo.png" 
                  alt="HackWithIndia" 
                  className="h-4 w-4 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex h-4 w-4 items-center justify-center rounded bg-secondary">
                  <Trophy className="h-3 w-3 text-secondary-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                    isActive
                      ? 'bg-sidebar-accent text-primary shadow-glow'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                  {!collapsed && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.label}</span>
                      {item.path === '/announcements' && unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  )}
                  {collapsed && item.path === '/announcements' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-2 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn('w-full', collapsed ? 'justify-center' : 'justify-start')}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <MobileNavigation />
      <MobileMenuOverlay />
    </>
  );
}
