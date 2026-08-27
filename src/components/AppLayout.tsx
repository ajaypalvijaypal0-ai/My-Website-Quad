import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, Users, Calendar, MessageSquare, Bell, Search, Settings, LogOut,
  Menu, X, Moon, Sun, GraduationCap, Newspaper,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Avatar } from './Avatar';
import { Logo } from './Logo';
import { getStoredTheme, setStoredTheme, applyTheme } from '../lib/theme';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/feed', label: 'Campus Feed', icon: Newspaper },
  { to: '/groups', label: 'Study Groups', icon: Users },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <Logo />
        <button onClick={() => setSidebarOpen(false)} className="btn-ghost lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <Link to={`/profile/${profile?.username ?? ''}`} className="nav-link" onClick={() => setSidebarOpen(false)}>
          <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size="sm" />
          <span className="truncate">{profile?.full_name ?? 'Profile'}</span>
        </Link>
        <Link to="/settings" className="nav-link" onClick={() => setSidebarOpen(false)}>
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button onClick={toggleTheme} className="nav-link w-full">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleSignOut} className="nav-link w-full text-red-600 dark:text-red-400">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary-500" />
            <span className="font-bold">Quad</span>
          </div>
          <Link to="/notifications" className="btn-ghost">
            <Bell className="h-5 w-5" />
          </Link>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
