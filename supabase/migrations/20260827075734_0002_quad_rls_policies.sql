/*
# Quad — Row Level Security Policies

Adds all RLS policies for the Quad tables created in migration 0001.

## Security model
- Profiles: readable by all authenticated; writable only by owner.
- Feed (posts/comments/likes): readable by all authenticated; writable by owner.
- Study groups + events: readable by all authenticated; editable by creator.
- Group/event membership: readable by all authenticated; insert/delete by the joining user.
- Friendships: readable by the two involved users; insert by requester; update/delete by either party.
- Conversations + messages: readable only by participants; messages insertable by participants.
- Notifications: readable + updatable only by the owning user.
*/

-- ---------- profiles ----------
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- posts ----------
DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all" ON posts
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- comments ----------
DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- likes ----------
DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- study_groups ----------
DROP POLICY IF EXISTS "groups_select_all" ON study_groups;
CREATE POLICY "groups_select_all" ON study_groups
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "groups_insert_own" ON study_groups;
CREATE POLICY "groups_insert_own" ON study_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "groups_update_own" ON study_groups;
CREATE POLICY "groups_update_own" ON study_groups
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "groups_delete_own" ON study_groups;
CREATE POLICY "groups_delete_own" ON study_groups
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ---------- group_members ----------
DROP POLICY IF EXISTS "gmembers_select_all" ON group_members;
CREATE POLICY "gmembers_select_all" ON group_members
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "gmembers_insert_own" ON group_members;
CREATE POLICY "gmembers_insert_own" ON group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "gmembers_delete_own" ON group_members;
CREATE POLICY "gmembers_delete_own" ON group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- events ----------
DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all" ON events
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "events_insert_own" ON events;
CREATE POLICY "events_insert_own" ON events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "events_update_own" ON events;
CREATE POLICY "events_update_own" ON events
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "events_delete_own" ON events;
CREATE POLICY "events_delete_own" ON events
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- ---------- event_rsvps ----------
DROP POLICY IF EXISTS "rsvps_select_all" ON event_rsvps;
CREATE POLICY "rsvps_select_all" ON event_rsvps
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rsvps_insert_own" ON event_rsvps;
CREATE POLICY "rsvps_insert_own" ON event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "rsvps_update_own" ON event_rsvps;
CREATE POLICY "rsvps_update_own" ON event_rsvps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "rsvps_delete_own" ON event_rsvps;
CREATE POLICY "rsvps_delete_own" ON event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- friendships ----------
DROP POLICY IF EXISTS "friends_select_involved" ON friendships;
CREATE POLICY "friends_select_involved" ON friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "friends_insert_requester" ON friendships;
CREATE POLICY "friends_insert_requester" ON friendships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
DROP POLICY IF EXISTS "friends_update_involved" ON friendships;
CREATE POLICY "friends_update_involved" ON friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "friends_delete_involved" ON friendships;
CREATE POLICY "friends_delete_involved" ON friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ---------- conversations ----------
DROP POLICY IF EXISTS "convo_select_participant" ON conversations;
CREATE POLICY "convo_select_participant" ON conversations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "convo_insert_any" ON conversations;
CREATE POLICY "convo_insert_any" ON conversations
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---------- conversation_participants ----------
DROP POLICY IF EXISTS "cp_select_participant" ON conversation_participants;
CREATE POLICY "cp_select_participant" ON conversation_participants
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
        AND cp2.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "cp_insert_own" ON conversation_participants;
CREATE POLICY "cp_insert_own" ON conversation_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---------- messages ----------
DROP POLICY IF EXISTS "msg_select_participant" ON messages;
CREATE POLICY "msg_select_participant" ON messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "msg_insert_participant" ON messages;
CREATE POLICY "msg_insert_participant" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- ---------- notifications ----------
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);