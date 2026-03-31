-- Add admin_ids column to bot_projects table
ALTER TABLE bot_projects ADD COLUMN IF NOT EXISTS admin_ids TEXT DEFAULT '';
