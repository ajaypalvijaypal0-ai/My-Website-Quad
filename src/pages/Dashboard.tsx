import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Users, Calendar, MessageSquare, Bell, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { PageHeader } from '../components/Common';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/Common';
import { timeAgo } from '../lib/utils';
import type { Post, Event, StudyGroup, Notification } from '../lib/types';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    async function load() {
      const [postsRes, eventsRes, groupsRes, notifRes] = await Promise.all([
        supabase.from('posts').select('*, profiles:profiles!posts_user_id_fkey(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('*, profiles:profiles!events_created_by_fkey(*)').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(5),
        supabase.from('study_groups').select('*, profiles:profiles!study_groups_created_by_fkey(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*, actor:profiles!notifications_actor_id_fkey(*)').eq('user_id', user?.id ?? '').order('created_at', { ascending: false }).limit(5),
      ]);
      setPosts((postsRes.data as Post[]) ?? []);
      setEvents((eventsRes.data as Event[]) ?? []);
      setGroups((groupsRes.data as StudyGroup[]) ?? []);
      setNotifications((notifRes.data as Notification[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  if (loading) return <Spinner size="lg" className="py-20" />;

  const stats = [
    { label: 'Feed Posts', value: posts.length, icon: Newspaper, to: '/feed' },
    { label: 'Study Groups', value: groups.length, icon: Users, to: '/groups' },
    { label: 'Upcoming Events', value: events.length, icon: Calendar, to: '/events' },
    { label: 'Notifications', value: notifications.length, icon: Bell, to: '/notifications' },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name?.split(' ')[0] ?? 'Student'}!`} subtitle="Here is what is happening on your campus." />

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="card p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Recent posts */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Posts</h2>
              <Link to="/feed" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
            </div>
            {posts.length === 0 ? (
              <EmptyState icon={<Newspaper className="h-8 w-8" />} title="No posts yet" description="Be the first to share something on the campus feed." actionLabel="Create Post" actionTo="/feed" />
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={post.profiles?.full_name ?? ''} url={post.profiles?.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{post.profiles?.full_name}</p>
                        <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming events */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
                <Link to="/events" className="text-sm font-medium text-primary-600">View all</Link>
              </div>
              {events.length === 0 ? (
                <div className="card p-4 text-center text-sm text-slate-400">No upcoming events.</div>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <Link key={ev.id} to="/events" className="card block p-3 transition-all hover:shadow-md">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{ev.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{ev.location} • {new Date(ev.start_time).toLocaleDateString()}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Study groups */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Study Groups</h2>
                <Link to="/groups" className="text-sm font-medium text-primary-600">View all</Link>
              </div>
              {groups.length === 0 ? (
                <div className="card p-4 text-center text-sm text-slate-400">No study groups yet.</div>
              ) : (
                <div className="space-y-2">
                  {groups.map((g) => (
                    <Link key={g.id} to="/groups" className="card block p-3 transition-all hover:shadow-md">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{g.name}</p>
                      {g.course && <p className="mt-0.5 text-xs text-primary-600">{g.course}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
              </div>
              {notifications.length === 0 ? (
                <div className="card p-4 text-center text-sm text-slate-400">No recent activity.</div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 card p-3">
                      {n.actor && <Avatar name={n.actor.full_name} url={n.actor.avatar_url} size="xs" />}
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">{n.content}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
