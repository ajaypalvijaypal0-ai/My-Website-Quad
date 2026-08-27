import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <h1 className="text-8xl font-extrabold text-gradient">404</h1>
      <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Page not found</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        <Home className="h-4 w-4" /> Go Home
      </Link>
    </div>
  );
}
