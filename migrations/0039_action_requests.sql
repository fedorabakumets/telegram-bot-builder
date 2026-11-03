/* @fileoverview Постоянные квитанции внешних действий; незавершённые записи не переисполняются автоматически. */
CREATE TABLE IF NOT EXISTS action_requests (
  scope text NOT NULL,
  action text NOT NULL,
  request_id uuid NOT NULL,
  request_hash text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','completed','unknown')),
  status integer,
  receipt jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, action, request_id)
);
COMMENT ON TABLE action_requests IS 'Квитанции без тел запросов и секретов; pending/unknown требуют ручной сверки, автоматического TTL нет';
