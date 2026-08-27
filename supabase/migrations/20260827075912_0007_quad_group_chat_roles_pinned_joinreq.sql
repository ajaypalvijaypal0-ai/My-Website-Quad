/*
# Quad — Group Chat System: Roles, Metadata, Pinned Messages, Join Requests

## 1. Conversations new columns: group_description, group_category, group_privacy, group_cover
## 2. conversation_participants role column with auto-owner trigger
## 3. pinned_messages table
## 4. group_join_requests table
## Security: RLS on all new tables, admin/owner-scoped policies
*/

-- 1. conversations new columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_description') THEN
    ALTER TABLE conversations ADD COLUMN group_description text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_category') THEN
    ALTER TABLE conversations ADD COLUMN group_category text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_privacy') THEN
    ALTER TABLE conversations ADD COLUMN group_privacy text NOT NULL DEFAULT 'private';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='group_cover') THEN
    ALTER TABLE conversations ADD COLUMN group_cover text;
  END IF;
END $$;

-- 2. conversation_participants role column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='role') THEN
    ALTER TABLE conversation_participants ADD COLUMN role text NOT NULL DEFAULT 'member';
  END IF;
END $$;

-- Function to auto-assign owner role to conversation creator
CREATE OR REPLACE FUNCTION set_owner_role() RETURNS trigger AS $$
DECLARE
  creator uuid;
BEGIN
  SELECT created_by INTO creator FROM conversations WHERE id = NEW.conversation_id;
  IF creator = NEW.user_id AND NEW.role = 'member' THEN
    NEW.role := 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS assign_owner_role_on_create ON conversation_participants;
CREATE TRIGGER assign_owner_role_on_create
  BEFORE INSERT ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION set_owner_role();

-- 3. pinned_messages
CREATE TABLE IF NOT EXISTS pinned_messages (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, message_id)
);
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_pinned_messages" ON pinned_messages;
CREATE POLICY "select_pinned_messages" ON pinned_messages FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_participants.conversation_id = pinned_messages.conversation_id AND conversation_participants.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_pinned_messages" ON pinned_messages;
CREATE POLICY "insert_pinned_messages" ON pinned_messages FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = pinned_messages.conversation_id AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "delete_pinned_messages" ON pinned_messages;
CREATE POLICY "delete_pinned_messages" ON pinned_messages FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = pinned_messages.conversation_id AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')));

-- 4. group_join_requests
CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  UNIQUE (conversation_id, user_id)
);
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_join_requests" ON group_join_requests;
CREATE POLICY "select_join_requests" ON group_join_requests FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = group_join_requests.conversation_id AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')));
DROP POLICY IF EXISTS "insert_join_requests" ON group_join_requests;
CREATE POLICY "insert_join_requests" ON group_join_requests FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_join_requests" ON group_join_requests;
CREATE POLICY "update_join_requests" ON group_join_requests FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = group_join_requests.conversation_id AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = group_join_requests.conversation_id AND cp.user_id = auth.uid() AND cp.role IN ('owner', 'admin')));

CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation ON pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_conversation ON group_join_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON group_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_role ON conversation_participants(role);