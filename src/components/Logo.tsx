import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  to?: string;
}

export function Logo({ size = 'md', showText = true, to = '/' }: LogoProps) {
  const iconSize = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' };
  const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

  return (
    <Link to={to} className="flex items-center gap-2 transition-opacity hover:opacity-90">
      <div className={`${iconSize[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm`}>
        <GraduationCap className="h-1/2 w-1/2 text-white" />
      </div>
      {showText && (
        <span className={`${textSize[size]} font-extrabold tracking-tight text-slate-900 dark:text-white`}>
          Quad
        </span>
      )}
    </Link>
  );
}
