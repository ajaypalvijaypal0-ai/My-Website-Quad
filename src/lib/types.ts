export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  major: string | null;
  year: string | null;
  university: string | null;
  is_online: boolean;
  last_seen: string | null;
  presence_status: string;
  read_receipts_enabled: boolean;
  last_seen_visible: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  post_type: string;
  media_urls: string[] | null;
  visibility: string;
  edited_at: string | null;
  created_at: string;
  profiles?: Profile;
  likes?: Like[];
  comments?: Comment[];
  reactions?: Reaction[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  pinned: boolean;
  edited_at: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  course: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  profiles?: Profile;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string | null;
  start_time: string;
  end_time: string | null;
  created_by: string;
  created_at: string;
  profiles?: Profile;
  rsvp_count?: number;
}

export interface EventRsvp {
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  requester?: Profile;
  addressee?: Profile;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  group_name: string | null;
  group_avatar: string | null;
  created_by: string | null;
  group_description: string | null;
  group_category: string | null;
  group_privacy: string;
  group_cover: string | null;
  created_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  pinned: boolean;
  is_admin: boolean;
  muted: boolean;
  archived: boolean;
  last_read_at: string | null;
  role: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  media_url: string | null;
  edited_at: string | null;
  reply_to_id: string | null;
  deleted_for_all: boolean;
  created_at: string;
  profiles?: Profile;
  reply_to?: Message | null;
}

export interface MessageReaction {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  actor_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile | null;
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  subject: string;
  time: string;
  room: string;
  day_of_week: number;
  color_dot: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  collection_id: string | null;
  created_at: string;
}

export interface PostDraft {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  media_urls: string[] | null;
  poll_data: Record<string, unknown> | null;
  code_content: string | null;
  code_language: string | null;
  link_url: string | null;
  visibility: string;
  updated_at: string;
  created_at: string;
}
