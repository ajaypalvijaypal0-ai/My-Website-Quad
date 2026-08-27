/*
# Quad — Social Feed & Content System v2

## Overview
- Rich posts with media, polls, code, links, visibility
- Multi-reaction system (like, love, celebrate, insightful, funny, confused)
- Nested comments with replies, pinning
- Saved posts with collections
- Post drafts with autosave

## 1. posts new columns: post_type, media_urls, poll_question, poll_options, poll_expires_at, code_language, link_url, link_title, link_description, link_image, visibility, edited_at
## 2. reactions table
## 3. comments new columns: parent_comment_id, edited_at, pinned
## 4. comment_likes table
## 5. collections table
## 6. saved_posts table
## 7. post_drafts table
## Security: RLS on all new tables, ownership-scoped policies
*/

-- 1. posts new columns
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='post_type') THEN ALTER TABLE posts ADD COLUMN post_type text NOT NULL DEFAULT 'text'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='media_urls') THEN ALTER TABLE posts ADD COLUMN media_urls jsonb; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='poll_question') THEN ALTER TABLE posts ADD COLUMN poll_question text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='poll_options') THEN ALTER TABLE posts ADD COLUMN poll_options jsonb; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='poll_expires_at') THEN ALTER TABLE posts ADD COLUMN poll_expires_at timestamptz; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='code_language') THEN ALTER TABLE posts ADD COLUMN code_language text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='link_url') THEN ALTER TABLE posts ADD COLUMN link_url text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='link_title') THEN ALTER TABLE posts ADD COLUMN link_title text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='link_description') THEN ALTER TABLE posts ADD COLUMN link_description text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='link_image') THEN ALTER TABLE posts ADD COLUMN link_image text; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='visibility') THEN ALTER TABLE posts ADD COLUMN visibility text NOT NULL DEFAULT 'public'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='edited_at') THEN ALTER TABLE posts ADD COLUMN edited_at timestamptz; END IF; END $$;

-- 2. reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like','love','celebrate','insightful','funny','confused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reactions" ON reactions;
CREATE POLICY "select_reactions" ON reactions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_reactions" ON reactions;
CREATE POLICY "insert_reactions" ON reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_reactions" ON reactions;
CREATE POLICY "delete_reactions" ON reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);

-- 3. comments new columns
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='parent_comment_id') THEN ALTER TABLE comments ADD COLUMN parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='edited_at') THEN ALTER TABLE comments ADD COLUMN edited_at timestamptz; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='pinned') THEN ALTER TABLE comments ADD COLUMN pinned boolean NOT NULL DEFAULT false; END IF; END $$;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);

-- 4. comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_comment_likes" ON comment_likes;
CREATE POLICY "select_comment_likes" ON comment_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_comment_likes" ON comment_likes;
CREATE POLICY "insert_comment_likes" ON comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_comment_likes" ON comment_likes;
CREATE POLICY "delete_comment_likes" ON comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_private boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_collections" ON collections;
CREATE POLICY "select_collections" ON collections FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_collections" ON collections;
CREATE POLICY "insert_collections" ON collections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_collections" ON collections;
CREATE POLICY "update_collections" ON collections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_collections" ON collections;
CREATE POLICY "delete_collections" ON collections FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 6. saved_posts table
CREATE TABLE IF NOT EXISTS saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_saved_posts" ON saved_posts;
CREATE POLICY "select_saved_posts" ON saved_posts FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_saved_posts" ON saved_posts;
CREATE POLICY "insert_saved_posts" ON saved_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_saved_posts" ON saved_posts;
CREATE POLICY "delete_saved_posts" ON saved_posts FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "update_saved_posts" ON saved_posts;
CREATE POLICY "update_saved_posts" ON saved_posts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 7. post_drafts table
CREATE TABLE IF NOT EXISTS post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  post_type text NOT NULL DEFAULT 'text',
  media_urls jsonb,
  poll_data jsonb,
  code_content text,
  code_language text,
  link_url text,
  visibility text NOT NULL DEFAULT 'public',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_drafts" ON post_drafts;
CREATE POLICY "select_drafts" ON post_drafts FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_drafts" ON post_drafts;
CREATE POLICY "insert_drafts" ON post_drafts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update_drafts" ON post_drafts;
CREATE POLICY "update_drafts" ON post_drafts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_drafts" ON post_drafts;
CREATE POLICY "delete_drafts" ON post_drafts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);