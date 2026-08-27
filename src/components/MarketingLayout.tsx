import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { getStoredTheme, setStoredTheme, applyTheme } from '../lib/theme';

export function MarketingLayout() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  };

  const links = [
    { to: '/about', label: 'About' },
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign In</Link>
            <Link to="/signup" className="btn-primary hidden sm:inline-flex">Get Started</Link>
            <button onClick={() => setOpen(!open)} className="btn-ghost md:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="nav-link">
                  {l.label}
                </Link>
              ))}
              <Link to="/login" onClick={() => setOpen(false)} className="nav-link">Sign In</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary mt-2">Get Started</Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                The social network built for college students.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link to="/features" className="hover:text-primary-600">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary-600">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link to="/about" className="hover:text-primary-600">About</Link></li>
                <li><Link to="/contact" className="hover:text-primary-600">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><Link to="/privacy" className="hover:text-primary-600">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-400 dark:border-slate-700">
            © {new Date().getFullYear()} Quad. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
