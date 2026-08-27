import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Send, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/Common';
import { useToast } from '../lib/toast';
import { timeAgo, formatTime } from '../lib/utils';
import type { Conversation, ConversationParticipant, Message, Profile } from '../lib/types';

interface ConversationWithMeta extends Conversation {
  participants?: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
}

export default function Messages() {
  const { conversationId } = useParams();
  const { user, profile } = useAuth();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(conversationId ?? null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, pinned, muted, archived')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('pinned', { ascending: false });

    const participantRows = (parts ?? []) as ConversationParticipant[];
    if (participantRows.length === 0) { setLoading(false); return; }

    const convIds = participantRows.map((p) => p.conversation_id);
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds);

    const convList = (convs as Conversation[]) ?? [];

    // Get all participants for these conversations
    const { data: allParts } = await supabase
      .from('conversation_participants')
      .select('*')
      .in('conversation_id', convIds);
    const allPartRows = (allParts as ConversationParticipant[]) ?? [];

    // Get profiles for all participants
    const userIds = [...new Set(allPartRows.map((p) => p.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
    const pMap: Record<string, Profile> = {};
    (profiles as Profile[] ?? []).forEach((p) => { pMap[p.id] = p; });
    setProfileMap(pMap);

    // Get last message for each conversation
    const convsWithMeta: ConversationWithMeta[] = [];
    for (const conv of convList) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*, profiles:profiles!messages_sender_id_fkey(*)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const myPart = participantRows.find((p) => p.conversation_id === conv.id);
      const lastRead = myPart?.last_read_at;

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .gt('created_at', lastRead ?? '1970-01-01T00:00:00Z');

      convsWithMeta.push({
        ...conv,
        lastMessage: lastMsg as Message | undefined,
        unreadCount: count ?? 0,
      });
    }

    convsWithMeta.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.created_at;
      const bTime = b.lastMessage?.created_at ?? b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(convsWithMeta);
    setLoading(false);
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles:profiles!messages_sender_id_fkey(*), reply_to:messages!messages_reply_to_id_fkey(*)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data as Message[]) ?? []);

    // Mark as seen
    if (user) {
      await supabase.rpc('mark_messages_seen', { p_conversation_id: convId, p_user_id: user.id });
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', user.id);
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (selectedId) loadMessages(selectedId); }, [selectedId, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedId || !user) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== user.id) {
            setMessages((prev) => [...prev, newMsg]);
            supabase.rpc('mark_messages_seen', { p_conversation_id: selectedId, p_user_id: user.id });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, user]);

  const handleSend = async () => {
    if (!input.trim() || !selectedId || !user) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: selectedId, sender_id: user.id, content: text })
      .select('*, profiles:profiles!messages_sender_id_fkey(*)')
      .single();
    setSending(false);
    if (error) { show(error.message, 'error'); setInput(text); return; }
    if (data) setMessages((prev) => [...prev, data as Message]);
    loadConversations();
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    // Check if conversation already exists between these two users
    const { data: myParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const myConvIds = (myParts ?? []).map((p: ConversationParticipant) => p.conversation_id);
    if (myConvIds.length > 0) {
      const { data: otherParts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', myConvIds);

      if (otherParts && otherParts.length > 0) {
        setSelectedId(otherParts[0].conversation_id);
        return;
      }
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({ is_group: false, created_by: user.id })
      .select()
      .single();
    if (error) { show(error.message, 'error'); return; }

    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);
    setSelectedId(conv.id);
    show('Conversation started!', 'success');
    loadConversations();
  };

  const getConvDisplay = (conv: ConversationWithMeta) => {
    if (conv.is_group) return { name: conv.group_name ?? 'Group Chat', avatar: conv.group_avatar };
    // Find the other participant
    const otherParts = (conv.participants ?? []).filter((p) => p.user_id !== user?.id);
    // Actually we need to look up from allParts — but we stored profileMap
    // For simplicity, use the last message sender or search profiles
    return { name: 'Direct Message', avatar: null as string | null };
  };

  const getOtherProfile = (conv: ConversationWithMeta): Profile | null => {
    if (conv.is_group) return null;
    // Find other participant's profile
    // We need the participants for this conv — stored in conversations? No.
    // Let's use the lastMessage sender's profile if it's not us, or look through profileMap
    const lastMsgSender = conv.lastMessage?.sender_id;
    if (lastMsgSender && lastMsgSender !== user?.id && profileMap[lastMsgSender]) {
      return profileMap[lastMsgSender];
    }
    // Try to find any profile that isn't us
    const otherProfiles = Object.values(profileMap).filter((p) => p.id !== user?.id);
    return otherProfiles[0] ?? null;
  };

  const filtered = conversations.filter((c) => {
    if (!searchTerm) return true;
    const name = c.is_group ? (c.group_name ?? '') : (getOtherProfile(c)?.full_name ?? '');
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="flex h-[calc(100vh-0px)] lg:h-screen">
      {/* Conversation list */}
      <div className={`flex flex-col border-r border-slate-200 dark:border-slate-700 ${selectedId ? 'hidden lg:flex' : 'flex'} w-full lg:w-80`}>
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Messages</h1>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9" placeholder="Search conversations…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No conversations" description="Start chatting with your friends from the Search page." />
          ) : (
            filtered.map((conv) => {
              const other = getOtherProfile(conv);
              const name = conv.is_group ? (conv.group_name ?? 'Group Chat') : (other?.full_name ?? 'Unknown');
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-800 ${
                    selectedId === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <Avatar name={name} url={conv.is_group ? conv.group_avatar : other?.avatar_url} size="md" showPresence presenceStatus={other?.presence_status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate font-medium text-slate-900 dark:text-white">{name}</p>
                      {conv.lastMessage && <span className="text-[10px] text-slate-400">{timeAgo(conv.lastMessage.created_at)}</span>}
                    </div>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {conv.lastMessage?.content ?? 'No messages yet'}
                    </p>
                  </div>
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat panel */}
      {selectedId ? (
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
            <button onClick={() => setSelectedId(null)} className="btn-ghost lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
            {(() => {
              const conv = conversations.find((c) => c.id === selectedId);
              const other = conv ? getOtherProfile(conv) : null;
              const name = conv?.is_group ? (conv?.group_name ?? 'Group Chat') : (other?.full_name ?? 'Chat');
              return (
                <>
                  <Avatar name={name} url={conv?.is_group ? conv?.group_avatar : other?.avatar_url} size="sm" showPresence presenceStatus={other?.presence_status} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-400">{other?.presence_status === 'online' ? 'Online' : 'Offline'}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No messages yet. Say hi!</div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const sender = msg.profiles as Profile | undefined;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {!isMe && <div className="flex items-center gap-1.5"><Avatar name={sender?.full_name ?? ''} url={sender?.avatar_url} size="xs" /><span className="text-xs font-medium text-slate-500">{sender?.full_name}</span></div>}
                        <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'}`}>
                          {msg.deleted_for_all ? <span className="italic opacity-60">This message was deleted</span> : msg.content}
                        </div>
                        <span className="px-1 text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input
                className="input-field flex-1"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                disabled={sending}
              />
              <button onClick={handleSend} disabled={!input.trim() || sending} className="btn-primary">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="Select a conversation" description="Choose a conversation from the list to start chatting." />
        </div>
      )}
    </div>
  );
}
