/** @fileoverview Явная связь размещения с наблюдаемой исторической меткой без переписывания первого привлечения. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
CREATE TABLE IF NOT EXISTS analytics_placement_history_v2 (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  placement_id integer NOT NULL,
  token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
  marker varchar(64) NOT NULL CHECK(marker ~ '^[A-Za-z0-9_-]{1,64}$' AND lower(marker) NOT LIKE '%link\_%' ESCAPE '\'),
  is_demo boolean NOT NULL DEFAULT false,
  PRIMARY KEY(project_id,placement_id),UNIQUE(project_id,token_id,marker),
  FOREIGN KEY(project_id,placement_id) REFERENCES analytics_placements(project_id,id) ON DELETE CASCADE
);
COMMIT;
