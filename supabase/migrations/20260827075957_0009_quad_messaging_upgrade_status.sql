/*
# Quad — Messaging Upgrade: Auto Status, Delivered, Seen Timestamps

## 1. message_status.seen_at column
## 2. Trigger: auto_create_message_status — creates status rows for all participants on message insert
## 3. Function: mark_messages_delivered — marks messages as delivered when recipient opens conversation
## 4. Function: mark_messages_seen — marks all unread messages as seen for the calling user
*/

-- 1. seen_at column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='message_status' AND column_name='seen_at') THEN
    ALTER TABLE message_status ADD COLUMN seen_at timestamptz;
  END IF;
END $$;

-- 2. Function to auto-create message_status rows on message insert
CREATE OR REPLACE FUNCTION auto_create_message_status()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
BEGIN
  FOR participant IN
    SELECT user_id FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    INSERT INTO message_status (message_id, user_id, status)
    VALUES (NEW.id, participant.user_id, 'sent')
    ON CONFLICT (message_id, user_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_message_status ON messages;
CREATE TRIGGER trigger_auto_message_status
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_message_status();

-- 3. Function to mark messages as delivered
CREATE OR REPLACE FUNCTION mark_messages_delivered(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE message_status
  SET status = 'delivered', updated_at = now()
  WHERE message_id IN (
    SELECT m.id FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id
  )
  AND user_id = p_user_id
  AND status = 'sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to mark all messages as seen
CREATE OR REPLACE FUNCTION mark_messages_seen(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE message_status
  SET status = 'seen', seen_at = now(), updated_at = now()
  WHERE message_id IN (
    SELECT m.id FROM messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id != p_user_id
  )
  AND user_id = p_user_id
  AND status IN ('sent', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_messages_delivered(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_seen(uuid, uuid) TO authenticated;

ALTER TABLE messages REPLICA IDENTITY FULL;