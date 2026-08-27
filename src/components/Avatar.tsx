import { initials } from '../lib/utils';

interface AvatarProps {
  name: string;
  url?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showPresence?: boolean;
  presenceStatus?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

const presenceColors: Record<string, string> = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
  offline: 'bg-slate-400',
  invisible: 'bg-slate-400',
};

export function Avatar({ name, url, size = 'md', className = '', showPresence = false, presenceStatus = 'offline' }: AvatarProps) {
  const dotSizes: Record<string, string> = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      {url ? (
        <img src={url} alt={name} className={`${sizes[size]} rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700`} />
      ) : (
        <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-accent-500 font-semibold text-white ring-1 ring-slate-200 dark:ring-slate-700`}>
          {initials(name)}
        </div>
      )}
      {showPresence && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full ${presenceColors[presenceStatus] || presenceColors.offline} ring-2 ring-white dark:ring-slate-800`} />
      )}
    </div>
  );
}
