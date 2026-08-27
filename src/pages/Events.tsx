import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, MapPin, Clock, Trash2, Check, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState, PageHeader } from '../components/Common';
import { useToast } from '../lib/toast';
import { formatDateTime } from '../lib/utils';
import type { Event, Profile, EventRsvp } from '../lib/types';

type EventWithMeta = Event & { rsvp_count?: number; my_rsvp?: string };

export default function Events() {
  const { user } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '', end_time: '' });
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, profiles:profiles!events_created_by_fkey(*)')
      .order('start_time', { ascending: true });
    const eventList = (data as Event[]) ?? [];

    if (user && eventList.length > 0) {
      const { data: rsvps } = await supabase.from('event_rsvps').select('event_id, status').eq('user_id', user.id);
      const rsvpMap: Record<string, string> = {};
      (rsvps ?? []).forEach((r: EventRsvp) => { rsvpMap[r.event_id] = r.status; });

      const { data: counts } = await supabase.from('event_rsvps').select('event_id').eq('status', 'going');
      const countMap: Record<string, number> = {};
      (counts ?? []).forEach((r: { event_id: string }) => { countMap[r.event_id] = (countMap[r.event_id] ?? 0) + 1; });

      setEvents(eventList.map((e) => ({ ...e, rsvp_count: countMap[e.id] ?? 0, my_rsvp: rsvpMap[e.id] })));
    } else {
      setEvents(eventList.map((e) => ({ ...e, rsvp_count: 0, my_rsvp: undefined })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.start_time || !user) return;
    setCreating(true);
    const { error } = await supabase.from('events').insert({
      title: form.title,
      description: form.description || null,
      location: form.location || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      created_by: user.id,
    });
    setCreating(false);
    if (error) { show(error.message, 'error'); return; }
    setForm({ title: '', description: '', location: '', start_time: '', end_time: '' });
    setShowCreate(false);
    show('Event created!', 'success');
    loadEvents();
  };

  const handleRsvp = async (eventId: string, status: string) => {
    if (!user) return;
    const { error } = await supabase.from('event_rsvps').upsert({ event_id: eventId, user_id: user.id, status });
    if (error) { show(error.message, 'error'); return; }
    show(`RSVP updated: ${status.replace('_', ' ')}`, 'success');
    loadEvents();
  };

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('created_by', user?.id ?? '');
    if (error) { show(error.message, 'error'); return; }
    show('Event deleted.', 'success');
    loadEvents();
  };

  const rsvpButtons = [
    { status: 'going', label: 'Going', icon: Check, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
    { status: 'maybe', label: 'Maybe', icon: HelpCircle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
    { status: 'not_going', label: "Can't go", icon: X, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  ];

  return (
    <div>
      <PageHeader
        title="Campus Events"
        subtitle="Discover and RSVP to events on your campus."
        action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Event</button>}
      />

      <div className="px-4 sm:px-6 lg:px-8">
        {loading ? (
          <Spinner size="lg" className="py-20" />
        ) : events.length === 0 ? (
          <EmptyState icon={<Calendar className="h-8 w-8" />} title="No events" description="Create the first campus event." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => {
              const p = ev.profiles as Profile | undefined;
              const isOwner = ev.created_by === user?.id;
              return (
                <div key={ev.id} className="card overflow-hidden">
                  {ev.image_url && <img src={ev.image_url} alt="" className="h-32 w-full object-cover" />}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{ev.title}</h3>
                      {isOwner && (
                        <button onClick={() => handleDelete(ev.id)} className="btn-ghost text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {ev.description && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{ev.description}</p>}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {formatDateTime(ev.start_time)}</div>
                      {ev.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {ev.location}</div>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
                      <Avatar name={p?.full_name ?? ''} url={p?.avatar_url} size="xs" />
                      <span className="text-xs text-slate-400">{ev.rsvp_count} going</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {rsvpButtons.map((b) => (
                        <button
                          key={b.status}
                          onClick={() => handleRsvp(ev.id, b.status)}
                          className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                            ev.my_rsvp === b.status ? b.color : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <b.icon className="mr-1 inline h-3 w-3" />
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md card p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Event</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Hackathon 2026" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Student Center, Room 101" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Start Time</label>
                <input type="datetime-local" className="input-field" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">End Time (optional)</label>
                <input type="datetime-local" className="input-field" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <button onClick={handleCreate} disabled={!form.title.trim() || !form.start_time || creating} className="btn-primary w-full">
                {creating ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
