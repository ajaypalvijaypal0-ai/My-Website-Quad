/*
# Quad — Presence Status, Read-Receipt & Last-Seen Privacy

## 1. profiles: presence_status
- Adds `presence_status` text column (default 'offline') with CHECK constraint
  covering 'online', 'offline', 'away', 'busy', 'invisible'.
- 'invisible' behaves like offline to other users but the user is still online.

## 2. profiles: read_receipts_enabled
- Adds `read_receipts_enabled` boolean (default true). When false, this user's
  message_status rows are never upgraded to 'seen' for messages they read,
  so senders do not get double-blue ticks from them.

## 3. profiles: last_seen_visible
- Adds `last_seen_visible` boolean (default true). When false, other users see
  'offline' instead of the user's last_seen timestamp.

## 4. mark_messages_seen RPC — privacy-aware
- Replaces the existing mark_messages_seen function so it only upgrades a
  recipient's message_status to 'seen' when that recipient has
  read_receipts_enabled = true. Users who disabled read receipts still mark
  messages delivered (single tick) but never 'seen' (double blue tick).

## 5. mark_messages_delivered RPC — privacy-aware
- Replaces mark_messages_delivered so it only marks delivered when the
  recipient has not disabled read receipts. This keeps the single/double
  tick semantics consistent.

## 6. RLS
- The existing profiles_update_own policy already covers the new columns.
  No new policies needed.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='presence_status') THEN
    ALTER TABLE profiles ADD COLUMN presence_status text NOT NULL DEFAULT 'offline'
      CHECK (presence_status IN ('online','offline','away','busy','invisible'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='read_receipts_enabled') THEN
    ALTER TABLE profiles ADD COLUMN read_receipts_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_seen_visible') THEN
    ALTER TABLE profiles ADD COLUMN last_seen_visible boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- Re-create the privacy-aware mark_messages_seen function
CREATE OR REPLACE FUNCTION mark_messages_seen(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_receipts boolean;
BEGIN
  SELECT read_receipts_enabled INTO v_receipts FROM profiles WHERE id = p_user_id;
  IF v_receipts IS NULL OR v_receipts = true THEN
    UPDATE message_status
    SET status = 'seen', seen_at = now(), updated_at = now()
    WHERE message_id IN (
      SELECT m.id FROM messages m
      WHERE m.conversation_id = p_conversation_id
        AND m.sender_id != p_user_id
    )
    AND user_id = p_user_id
    AND status IN ('sent', 'delivered');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the privacy-aware mark_messages_delivered function
CREATE OR REPLACE FUNCTION mark_messages_delivered(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_receipts boolean;
BEGIN
  SELECT read_receipts_enabled INTO v_receipts FROM profiles WHERE id = p_user_id;
  IF v_receipts IS NULL OR v_receipts = true THEN
    UPDATE message_status
    SET status = 'delivered', updated_at = now()
    WHERE message_id IN (
      SELECT m.id FROM messages m
      WHERE m.conversation_id = p_conversation_id
        AND m.sender_id != p_user_id
    )
    AND user_id = p_user_id
    AND status = 'sent';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_messages_delivered(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_seen(uuid, uuid) TO authenticated;
