-- Add tags array to lists table (up to 3 user-defined labels per list)
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
