import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState, PageHeader } from '../components/Common';
import { useToast } from '../lib/toast';
import type { Profile, Friendship } from '../lib/types';

export default function Search() {
  const { user } = useAuth();
  const { show } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Profile[]>([]);
  const [friendshipMap, setFriendshipMap] = useState<Record<string, string>>({});
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,major.ilike.%${q}%,university.ilike.%${q}%`)
      .neq('id', user?.id ?? '')
      .limit(20);
    const profiles = (data as Profile[]) ?? [];
    setResults(profiles);

    if (user && profiles.length > 0) {
      const { data: friends } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const fMap: Record<string, string> = {};
      (friends as Friendship[] ?? []).forEach((f) => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        fMap[otherId] = f.status;
      });
      setFriendshipMap(fMap);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleFriendRequest = async (targetId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: targetId,
      status: 'pending',
    });
    if (error) { show(error.message, 'error'); return; }
    show('Friend request sent!', 'success');
    setFriendshipMap((prev) => ({ ...prev, [targetId]: 'pending' }));
  };

  return (
    <div>
      <PageHeader title="Search" subtitle="Find classmates by name, major, or university." />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-11 text-base"
            placeholder="Search students…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          {loading ? (
            <Spinner size="lg" className="py-20" />
          ) : results.length === 0 ? (
            searched ? (
              <EmptyState icon={<SearchIcon className="h-8 w-8" />} title="No results" description={`No students found for "${query}".`} />
            ) : (
              <EmptyState icon={<SearchIcon className="h-8 w-8" />} title="Search for students" description="Type a name, major, or university to find classmates." />
            )
          ) : (
            <div className="space-y-2">
              {results.map((p) => {
                const status = friendshipMap[p.id];
                return (
                  <div key={p.id} className="card flex items-center gap-3 p-4">
                    <Link to={`/profile/${p.username}`}>
                      <Avatar name={p.full_name} url={p.avatar_url} size="md" showPresence presenceStatus={p.presence_status} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${p.username}`} className="font-semibold text-slate-900 hover:text-primary-600 dark:text-white">
                        {p.full_name}
                      </Link>
                      <p className="truncate text-xs text-slate-400">
                        @{p.username}{p.major && ` • ${p.major}`}{p.university && ` • ${p.university}`}
                      </p>
                    </div>
                    {status === 'accepted' ? (
                      <span className="btn-secondary text-xs"><UserCheck className="h-3.5 w-3.5" /> Friends</span>
                    ) : status === 'pending' ? (
                      <span className="btn-secondary text-xs">Pending</span>
                    ) : (
                      <button onClick={() => handleFriendRequest(p.id)} className="btn-primary text-xs">
                        <UserPlus className="h-3.5 w-3.5" /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
