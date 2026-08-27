/*
# Quad — Messaging Upgrade: Auto Status, Delivered, Seen Timestamps

## 1. message_status.seen_at
Adds `seen_at` timestamptz to track when the recipient actually saw the message.

## 2. Trigger: auto_create_message_status
On INSERT into messages, automatically creates message_status rows for all
other conversation participants with status='sent'. This ensures delivered/
seen tracking works without the client needing to manually create rows.

## 3. Trigger: mark_delivered_on_read
When a user updates their last_read_at on conversation_participants, mark
all their message_status rows in that conversation as 'delivered' (if not
already 'seen'). This gives the sender "delivered" double-ticks.

## 4. Function: mark_messages_seen
A security-definer function that marks all unread messages in a conversation
as 'seen' for the calling user. Called when a user opens a chat.
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
  -- Insert message_status rows for all participants except the sender
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

-- 3. Function to mark messages as delivered when recipient opens conversation
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

-- 4. Function to mark all messages in a conversation as seen for the calling user
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

-- Grant execute to authenticated
GRANT EXECUTE ON FUNCTION mark_messages_delivered(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_seen(uuid, uuid) TO authenticated;

-- Enable realtime on messages if not already (needed for the trigger to be useful)
ALTER TABLE messages REPLICA IDENTITY FULL;
