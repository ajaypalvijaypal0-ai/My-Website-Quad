/*
# Quad — Enterprise Messaging: Reactions, Replies, Delete-for-All

## 1. message_reactions table — per-user emoji reactions on messages
## 2. messages.reply_to_id — reply threading self-reference
## 3. messages.deleted_for_all — soft-delete flag
*/

-- 1. message_reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reactions" ON message_reactions;
CREATE POLICY "select_own_reactions" ON message_reactions FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_reactions" ON message_reactions;
CREATE POLICY "insert_own_reactions" ON message_reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reactions" ON message_reactions;
CREATE POLICY "delete_own_reactions" ON message_reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. reply_to_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='reply_to_id') THEN
    ALTER TABLE messages ADD COLUMN reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. deleted_for_all
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='deleted_for_all') THEN
    ALTER TABLE messages ADD COLUMN deleted_for_all boolean NOT NULL DEFAULT false;
  END IF;
END $$;