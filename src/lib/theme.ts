type Theme = 'light' | 'dark' | 'system';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('quad-theme') as Theme) || 'system';
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem('quad-theme', theme);
}

export function applyTheme(theme: Theme): void {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function initTheme(): void {
  const theme = getStoredTheme();
  applyTheme(theme);

  if (theme === 'system') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (getStoredTheme() === 'system') applyTheme('system');
    });
  }
}
