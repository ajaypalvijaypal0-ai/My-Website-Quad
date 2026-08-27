import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, UserCheck, MessageSquare, MapPin, GraduationCap, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/Common';
import { useToast } from '../lib/toast';
import { timeAgo, formatDate } from '../lib/utils';
import type { Profile as ProfileType, Post, Friendship } from '../lib/types';

export default function Profile() {
  const { username } = useParams();
  const { user, profile: myProfile } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [isMe, setIsMe] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
    const p = prof as ProfileType | null;
    setProfile(p);
    if (!p) { setLoading(false); return; }

    setIsMe(p.id === user?.id);

    const { data: postList } = await supabase
      .from('posts')
      .select('*, profiles:profiles!posts_user_id_fkey(*)')
      .eq('user_id', p.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setPosts((postList as Post[]) ?? []);

    if (user && p.id !== user.id) {
      const { data: f } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .or(`requester_id.eq.${p.id},addressee_id.eq.${p.id}`)
        .maybeSingle();
      setFriendship(f as Friendship | null);
    }
    setLoading(false);
  }, [username, user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFriendRequest = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: profile.id,
      status: 'pending',
    });
    if (error) { show(error.message, 'error'); return; }
    show('Friend request sent!', 'success');
    loadProfile();
  };

  const handleAccept = async () => {
    if (!friendship) return;
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendship.id);
    if (error) { show(error.message, 'error'); return; }
    show('Friend request accepted!', 'success');
    loadProfile();
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  if (!profile) {
    return (
      <div className="px-4 py-6">
        <EmptyState icon={<UserCheck className="h-8 w-8" />} title="Profile not found" description="This user does not exist." actionLabel="Go to Feed" actionTo="/feed" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Profile header */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary-500 to-accent-500" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar name={profile.full_name} url={profile.avatar_url} size="xl" className="ring-4 ring-white dark:ring-slate-800" />
            {isMe ? (
              <Link to="/settings" className="btn-secondary">Edit Profile</Link>
            ) : friendship?.status === 'accepted' ? (
              <span className="btn-secondary"><UserCheck className="h-4 w-4" /> Friends</span>
            ) : friendship?.status === 'pending' ? (
              <span className="btn-secondary">Pending</span>
            ) : (
              <button onClick={handleFriendRequest} className="btn-primary"><UserPlus className="h-4 w-4" /> Add Friend</button>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{profile.full_name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
            {profile.major && <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {profile.major}</span>}
            {profile.year && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {profile.year}</span>}
            {profile.university && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.university}</span>}
          </div>
          <p className="mt-2 text-xs text-slate-400">Joined {formatDate(profile.created_at)}</p>
        </div>
      </div>

      {/* Pending friend request action */}
      {friendship?.status === 'pending' && friendship.addressee_id === user?.id && (
        <div className="card mt-4 flex items-center justify-between p-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{profile.full_name} sent you a friend request.</p>
          <button onClick={handleAccept} className="btn-primary">Accept</button>
        </div>
      )}

      {/* Posts */}
      <h2 className="mb-3 mt-6 text-lg font-semibold text-slate-900 dark:text-white">Posts</h2>
      {posts.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No posts" description={`${isMe ? 'You have' : 'This user has'} not posted anything yet.`} />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="card p-4">
              <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="mt-2 rounded-xl" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
