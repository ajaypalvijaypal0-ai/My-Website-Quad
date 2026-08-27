import { useEffect, useState, useCallback } from 'react';
import { Heart, MessageCircle, Send, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { PostSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/Common';
import { useToast } from '../lib/toast';
import { timeAgo } from '../lib/utils';
import type { Post, Comment, Profile } from '../lib/types';

export default function Feed() {
  const { user, profile } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [likeSet, setLikeSet] = useState<Set<string>>(new Set());

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:profiles!posts_user_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts((data as Post[]) ?? []);

    if (user) {
      const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
      setLikeSet(new Set((likes ?? []).map((l: { post_id: string }) => l.post_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({ content, user_id: user.id });
    setPosting(false);
    if (error) { show(error.message, 'error'); return; }
    setContent('');
    show('Posted!', 'success');
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    if (likeSet.has(postId)) {
      setLikeSet((prev) => { const next = new Set(prev); next.delete(postId); return next; });
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      setLikeSet((prev) => new Set(prev).add(postId));
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    }
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { show(error.message, 'error'); return; }
    show('Post deleted.', 'success');
    loadPosts();
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:profiles!comments_user_id_fkey(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setCommentsByPost((prev) => ({ ...prev, [postId]: (data as Comment[]) ?? [] }));
  };

  const toggleComments = (postId: string) => {
    const next = new Set(expandedComments);
    if (next.has(postId)) { next.delete(postId); }
    else { next.add(postId); loadComments(postId); }
    setExpandedComments(next);
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !user) return;
    const { error } = await supabase.from('comments').insert({ post_id: postId, content: text, user_id: user.id });
    if (error) { show(error.message, 'error'); return; }
    setCommentText((prev) => ({ ...prev, [postId]: '' }));
    loadComments(postId);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Campus Feed</h1>

      {/* Composer */}
      <div className="card mb-6 p-4">
        <div className="flex gap-3">
          <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size="md" />
          <div className="flex-1">
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Share something with your campus…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <button className="btn-ghost" onClick={() => show('Image upload coming soon', 'info')}>
                <ImageIcon className="h-5 w-5" />
              </button>
              <button onClick={handlePost} disabled={!content.trim() || posting} className="btn-primary">
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>
      ) : posts.length === 0 ? (
        <EmptyState icon={<MessageCircle className="h-8 w-8" />} title="No posts yet" description="Be the first to share something on the campus feed." />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const p = post.profiles as Profile | undefined;
            const isOwner = post.user_id === user?.id;
            const liked = likeSet.has(post.id);
            const showComments = expandedComments.has(post.id);
            return (
              <div key={post.id} className="card p-4 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={p?.full_name ?? ''} url={p?.avatar_url} size="md" showPresence presenceStatus={p?.presence_status} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{p?.full_name}</p>
                      <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={() => handleDelete(post.id)} className="btn-ghost text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{post.content}</p>
                {post.image_url && <img src={post.image_url} alt="" className="mt-3 rounded-xl" />}

                <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-700/50">
                  <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}>
                    <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                    <span>Like</span>
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-primary-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>Comment</span>
                  </button>
                </div>

                {showComments && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700/50">
                    {(commentsByPost[post.id] ?? []).map((c) => {
                      const cp = c.profiles as Profile | undefined;
                      return (
                        <div key={c.id} className="flex gap-2">
                          <Avatar name={cp?.full_name ?? ''} url={cp?.avatar_url} size="xs" />
                          <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-700/40">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{cp?.full_name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex gap-2">
                      <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size="xs" />
                      <input
                        className="input-field flex-1"
                        placeholder="Write a comment…"
                        value={commentText[post.id] ?? ''}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <button onClick={() => handleComment(post.id)} className="btn-ghost text-primary-600">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
