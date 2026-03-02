import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Play, History, Settings } from 'lucide-react';
import OwlLogo from '@/components/OwlLogo';
import SubjectsSidebar from '@/components/SubjectsSidebar';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/session/start', label: 'Study', icon: Play },
  { to: '/history', label: 'History', icon: History },
  { to: '/config', label: 'Config', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border gradient-hero">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <OwlLogo className="h-8 w-8" />
            <span className="font-display text-2xl text-gradient tracking-wide">coogaih</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(item => {
              const active = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Body with sidebar */}
      <div className="flex-1 flex">
        {/* Left sidebar - subjects */}
        <aside className="hidden lg:block w-56 border-r border-border py-4 shrink-0">
          <SubjectsSidebar />
        </aside>

        {/* Main */}
        <main className="flex-1 container py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
