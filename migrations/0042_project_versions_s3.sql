/**
 * @fileoverview Поля для переноса снимков версий из PostgreSQL в приватное S3.
 */
ALTER TABLE project_versions ALTER COLUMN snapshot DROP NOT NULL;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_storage_id TEXT;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_key TEXT;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_sha256 TEXT;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_bytes BIGINT;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_state TEXT NOT NULL DEFAULT 'postgres';
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_retry_at TIMESTAMP;
ALTER TABLE project_versions ADD COLUMN IF NOT EXISTS snapshot_attempts INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_project_versions_order ON project_versions(project_id, created_at DESC NULLS LAST, id DESC);
CREATE TABLE IF NOT EXISTS project_version_object_deletions (
  id BIGSERIAL PRIMARY KEY,
  storage_id TEXT NOT NULL,
  object_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(storage_id, object_key)
);
CREATE OR REPLACE FUNCTION queue_deleted_project_version_object() RETURNS trigger AS $$
BEGIN
  IF OLD.snapshot_key IS NOT NULL AND OLD.snapshot_storage_id IS NOT NULL THEN
    INSERT INTO project_version_object_deletions(storage_id, object_key)
    VALUES (OLD.snapshot_storage_id, OLD.snapshot_key)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_project_version_object_delete ON project_versions;
CREATE TRIGGER trg_project_version_object_delete AFTER DELETE ON project_versions
FOR EACH ROW EXECUTE FUNCTION queue_deleted_project_version_object();
