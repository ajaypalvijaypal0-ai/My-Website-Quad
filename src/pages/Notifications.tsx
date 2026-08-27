import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState, PageHeader } from '../components/Common';
import { timeAgo } from '../lib/utils';
import type { Notification, Profile } from '../lib/types';

export default function Notifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadNotifications()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        action={unreadCount > 0 ? <button onClick={handleMarkAllRead} className="btn-secondary"><Check className="h-4 w-4" /> Mark all read</button> : undefined}
      />

      <div className="px-4 sm:px-6 lg:px-8">
        {loading ? (
          <Spinner size="lg" className="py-20" />
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications" description="You will see activity from your network here." />
        ) : (
          <div className="max-w-2xl space-y-2">
            {notifications.map((n) => {
              const actor = n.actor as Profile | null;
              return (
                <div
                  key={n.id}
                  className={`card flex items-center gap-3 p-4 ${!n.read ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/10' : ''}`}
                >
                  {actor ? (
                    <Avatar name={actor.full_name} url={actor.avatar_url} size="md" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <Bell className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{n.content}</p>
                    <p className="text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id)} className="btn-ghost" title="Mark as read">
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n.id)} className="btn-ghost text-red-500" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
