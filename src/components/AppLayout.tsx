import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Play, History, Settings, User, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import OwlLogo from '@/components/OwlLogo';
import SubjectsSidebar from '@/components/SubjectsSidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/session/start', label: 'Study', icon: Play },
  { to: '/history', label: 'History', icon: History },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/config', label: 'Config', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { profile, signOut } = useUser();

  const OWL_AVATARS: Record<string, string> = {
    owl_scholar: '🦉', owl_engineer: '⚙️', owl_nightcoder: '🌙', owl_librarian: '📚',
    owl_quant: '📊', owl_stoic: '🏛️', owl_hacker: '💻', owl_cartographer: '🗺️',
    owl_analyst: '🔬', owl_alchemist: '⚗️', owl_sensei: '🥋', owl_explorer: '🧭',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border glass">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <OwlLogo className="h-7 w-7" />
            <span className="font-display text-xl text-gradient tracking-wide drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]">coogaih</span>
          </div>
          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-0.5">
              {navItems.map(item => {
                const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'glass-active text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-hover))]'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              {profile?.avatar_id && (
                <Link to="/profile" className="text-lg" title="Profile">
                  {OWL_AVATARS[profile.avatar_id] || '🦉'}
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Body with sidebar */}
      <div className="flex-1 flex">
        <aside className="hidden lg:block w-56 border-r border-border py-4 shrink-0 bg-[hsl(var(--sidebar-background))]">
          <SubjectsSidebar />
        </aside>
        <main className="flex-1 container py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
