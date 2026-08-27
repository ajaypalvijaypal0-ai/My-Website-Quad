/*
# Quad — Chat List: Mute, Archive, Unread Tracking

Extends `conversation_participants` with per-user mute/archive flags and
a `last_read_at` timestamp for computing unread message counts.

## 1. New Columns on conversation_participants
- `muted` (boolean, default false) — suppresses notifications for this conversation.
- `archived` (boolean, default false) — hides conversation from the main list.
- `last_read_at` (timestamptz, nullable) — timestamp of the last message the user has read; used to compute unread count.

## 2. RLS
- The existing `cp_update_own` policy already covers these new columns (it allows
  users to update their own row). No new policies needed.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='muted') THEN
    ALTER TABLE conversation_participants ADD COLUMN muted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='archived') THEN
    ALTER TABLE conversation_participants ADD COLUMN archived boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversation_participants' AND column_name='last_read_at') THEN
    ALTER TABLE conversation_participants ADD COLUMN last_read_at timestamptz;
  END IF;
END $$;
