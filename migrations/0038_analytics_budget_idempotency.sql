/* @fileoverview Постоянные квитанции бюджетов; хранятся до удаления проекта, без автоматического TTL. */
CREATE TABLE IF NOT EXISTS analytics_budget_requests (
  project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  request_hash text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, request_id)
);
COMMENT ON TABLE analytics_budget_requests IS 'Защита повторной записи бюджета; срок хранения равен сроку проекта';
