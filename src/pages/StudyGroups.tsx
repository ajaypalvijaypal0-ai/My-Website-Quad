import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Trash2, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState, PageHeader } from '../components/Common';
import { useToast } from '../lib/toast';
import type { StudyGroup, Profile } from '../lib/types';

export default function StudyGroups() {
  const { user, profile } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<(StudyGroup & { member_count?: number; is_member?: boolean })[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', course: '' });
  const [creating, setCreating] = useState(false);

  const loadGroups = useCallback(async () => {
    const { data } = await supabase
      .from('study_groups')
      .select('*, profiles:profiles!study_groups_created_by_fkey(*)')
      .order('created_at', { ascending: false });
    const groupList = (data as StudyGroup[]) ?? [];

    if (user && groupList.length > 0) {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      const memberSet = new Set((memberships ?? []).map((m: { group_id: string }) => m.group_id));

      const { data: counts } = await supabase
        .from('group_members')
        .select('group_id');
      const countMap: Record<string, number> = {};
      (counts ?? []).forEach((m: { group_id: string }) => { countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1; });

      setGroups(groupList.map((g) => ({ ...g, member_count: countMap[g.id] ?? 0, is_member: memberSet.has(g.id) })));
    } else {
      setGroups(groupList.map((g) => ({ ...g, member_count: 0, is_member: false })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreate = async () => {
    if (!form.name.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase.from('study_groups').insert({
      name: form.name,
      description: form.description || null,
      course: form.course || null,
      created_by: user.id,
    }).select().single();
    setCreating(false);
    if (error) { show(error.message, 'error'); return; }
    await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id });
    setForm({ name: '', description: '', course: '' });
    setShowCreate(false);
    show('Study group created!', 'success');
    loadGroups();
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
    if (error) { show(error.message, 'error'); return; }
    show('Joined group!', 'success');
    loadGroups();
  };

  const handleLeave = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    if (error) { show(error.message, 'error'); return; }
    show('Left group.', 'info');
    loadGroups();
  };

  const handleDelete = async (groupId: string) => {
    const { error } = await supabase.from('study_groups').delete().eq('id', groupId).eq('created_by', user?.id ?? '');
    if (error) { show(error.message, 'error'); return; }
    show('Group deleted.', 'success');
    loadGroups();
  };

  return (
    <div>
      <PageHeader
        title="Study Groups"
        subtitle="Find and join study groups for your courses."
        action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Group</button>}
      />

      <div className="px-4 sm:px-6 lg:px-8">
        {loading ? (
          <Spinner size="lg" className="py-20" />
        ) : groups.length === 0 ? (
          <EmptyState icon={<Users className="h-8 w-8" />} title="No study groups" description="Create the first study group for your campus." actionLabel="Create Group" actionTo="/groups" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const p = g.profiles as Profile | undefined;
              const isOwner = g.created_by === user?.id;
              return (
                <div key={g.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{g.name}</h3>
                        {g.course && <p className="text-xs text-primary-600">{g.course}</p>}
                      </div>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleDelete(g.id)} className="btn-ghost text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {g.description && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{g.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Avatar name={p?.full_name ?? ''} url={p?.avatar_url} size="xs" />
                      <span className="text-xs text-slate-400">{g.member_count} member{g.member_count !== 1 ? 's' : ''}</span>
                    </div>
                    {!isOwner && (
                      g.is_member ? (
                        <button onClick={() => handleLeave(g.id)} className="btn-secondary text-xs">
                          <LogOut className="h-3.5 w-3.5" /> Leave
                        </button>
                      ) : (
                        <button onClick={() => handleJoin(g.id)} className="btn-primary text-xs">
                          <LogIn className="h-3.5 w-3.5" /> Join
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-md card p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Study Group</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Group Name</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CS 101 Study Squad" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Course</label>
                <input className="input-field" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="CS 101" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea className="input-field resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this group about?" />
              </div>
              <button onClick={handleCreate} disabled={!form.name.trim() || creating} className="btn-primary w-full">
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
