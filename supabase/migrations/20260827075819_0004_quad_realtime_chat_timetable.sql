/*
# Quad — Realtime Chat, Presence, Timetable & Read Receipts

Adds presence, group chat metadata, rich media messages, read receipts,
typing indicators, per-user timetable, chat-media storage bucket, and realtime.

## 1. Profiles — Presence
- `is_online` (boolean), `last_seen` (timestamptz)
## 2. Conversations — Group Chat
- `is_group`, `group_name`, `group_avatar`, `created_by`
## 3. Conversation Participants — Pin & Admin
- `pinned`, `is_admin`
## 4. Messages — Rich Media
- `type`, `media_url`, `edited_at`
## 5. message_status table
## 6. typing_status table
## 7. timetable table
## 8. chat-media storage bucket
## 9. Realtime on new tables
## 10. RLS policies for all new tables
*/

-- 1. Profiles: presence
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_online') THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean NOT NULL DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_seen') THEN
    ALTER TABLE profiles ADD COLUMN last_seen timestamptz;
  END IF;
END $$;

-- 2. Conversations: group chat
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='is_group') THEN
    ALTER TABLE conversations ADD COLUMN is_group boolean NOT NULL DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_name') THEN
    ALTER TABLE conversations ADD COLUMN group_name text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_avatar') THEN
    ALTER TABLE conversations ADD COLUMN group_avatar text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='created_by') THEN
    ALTER TABLE conversations ADD COLUMN created_by uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Conversation Participants: pin & admin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='pinned') THEN
    ALTER TABLE conversation_participants ADD COLUMN pinned boolean NOT NULL DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='is_admin') THEN
    ALTER TABLE conversation_participants ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. Messages: rich media
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='type') THEN
    ALTER TABLE messages ADD COLUMN type text NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','file','voice','gif'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='media_url') THEN
    ALTER TABLE messages ADD COLUMN media_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='edited_at') THEN
    ALTER TABLE messages ADD COLUMN edited_at timestamptz;
  END IF;
END $$;

-- 5. message_status table
CREATE TABLE IF NOT EXISTS message_status (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','delivered','seen')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- 6. typing_status table
CREATE TABLE IF NOT EXISTS typing_status (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- 7. timetable table
CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  time text NOT NULL,
  room text NOT NULL,
  day_of_week smallint NOT NULL DEFAULT 1 CHECK (day_of_week >= 0 AND day_of_week <= 6),
  color_dot text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS timetable_user_day_idx ON timetable (user_id, day_of_week);

-- 8. Storage: chat-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "chat_media_read_all" ON storage.objects;
CREATE POLICY "chat_media_read_all" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'chat-media');
DROP POLICY IF EXISTS "chat_media_insert_own" ON storage.objects;
CREATE POLICY "chat_media_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-media');
DROP POLICY IF EXISTS "chat_media_update_own" ON storage.objects;
CREATE POLICY "chat_media_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'chat-media') WITH CHECK (bucket_id = 'chat-media');
DROP POLICY IF EXISTS "chat_media_delete_own" ON storage.objects;
CREATE POLICY "chat_media_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'chat-media');

-- 9. Realtime
ALTER TABLE message_status REPLICA IDENTITY FULL;
ALTER TABLE typing_status REPLICA IDENTITY FULL;
ALTER TABLE friendships REPLICA IDENTITY FULL;
ALTER TABLE timetable REPLICA IDENTITY FULL;
ALTER TABLE conversation_participants REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- 10. RLS Policies

-- message_status
DROP POLICY IF EXISTS "msg_status_select_involved" ON message_status;
CREATE POLICY "msg_status_select_involved" ON message_status
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.id = message_status.message_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "msg_status_insert_own" ON message_status;
CREATE POLICY "msg_status_insert_own" ON message_status
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM messages m JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id WHERE m.id = message_status.message_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "msg_status_update_own" ON message_status;
CREATE POLICY "msg_status_update_own" ON message_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- typing_status
DROP POLICY IF EXISTS "typing_select_participant" ON typing_status;
CREATE POLICY "typing_select_participant" ON typing_status
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = typing_status.conversation_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "typing_insert_own" ON typing_status;
CREATE POLICY "typing_insert_own" ON typing_status
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = typing_status.conversation_id AND cp.user_id = auth.uid()));
DROP POLICY IF EXISTS "typing_update_own" ON typing_status;
CREATE POLICY "typing_update_own" ON typing_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- timetable
DROP POLICY IF EXISTS "timetable_select_own" ON timetable;
CREATE POLICY "timetable_select_own" ON timetable
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "timetable_insert_own" ON timetable;
CREATE POLICY "timetable_insert_own" ON timetable
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "timetable_update_own" ON timetable;
CREATE POLICY "timetable_update_own" ON timetable
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "timetable_delete_own" ON timetable;
CREATE POLICY "timetable_delete_own" ON timetable
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- conversations: update + delete by creator
DROP POLICY IF EXISTS "convo_insert_any" ON conversations;
CREATE POLICY "convo_insert_any" ON conversations
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "convo_update_creator" ON conversations;
CREATE POLICY "convo_update_creator" ON conversations
  FOR UPDATE TO authenticated USING (auth.uid() = created_by OR created_by IS NULL) WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
DROP POLICY IF EXISTS "convo_delete_creator" ON conversations;
CREATE POLICY "convo_delete_creator" ON conversations
  FOR DELETE TO authenticated USING (auth.uid() = created_by OR created_by IS NULL);

-- conversation_participants: update + delete own
DROP POLICY IF EXISTS "cp_update_own" ON conversation_participants;
CREATE POLICY "cp_update_own" ON conversation_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cp_delete_own" ON conversation_participants;
CREATE POLICY "cp_delete_own" ON conversation_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- messages: update + delete own
DROP POLICY IF EXISTS "msg_update_own" ON messages;
CREATE POLICY "msg_update_own" ON messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "msg_delete_own" ON messages;
CREATE POLICY "msg_delete_own" ON messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- profiles: re-verify update own
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);