/** @fileoverview Устойчивая привязка проверенной групповой команды к физическому событию. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
ALTER TABLE analytics_audience_evidence_v2 ADD COLUMN IF NOT EXISTS message_event_key text;
CREATE INDEX IF NOT EXISTS analytics_evidence_message_identity_v2
  ON analytics_audience_evidence_v2(project_id,token_id,message_event_key)
  WHERE reason='addressed_command' AND message_event_key IS NOT NULL;

/** Сохраняет только проверенную идентичность сообщения, без текста и параметров команды. */
CREATE OR REPLACE FUNCTION analytics_evidence_message_identity_v2() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  NEW.message_event_key := NULL;
  IF NEW.reason='addressed_command' THEN
    SELECT 'msg:' || m.chat_id || ':' || m.telegram_message_id INTO NEW.message_event_key
      FROM bot_messages m WHERE m.id=NEW.legacy_message_id AND m.project_id=NEW.project_id AND m.token_id=NEW.token_id
        AND m.chat_id=NEW.chat_id AND m.telegram_message_id>0;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION analytics_evidence_message_identity_v2() FROM PUBLIC;
DROP TRIGGER IF EXISTS analytics_evidence_message_identity_v2 ON analytics_audience_evidence_v2;
CREATE TRIGGER analytics_evidence_message_identity_v2 BEFORE INSERT ON analytics_audience_evidence_v2
  FOR EACH ROW EXECUTE FUNCTION analytics_evidence_message_identity_v2();

/** Связывает уже проверенные свидетельства, пока исходная запись ещё доступна. */
UPDATE analytics_audience_evidence_v2 e SET message_event_key='msg:' || m.chat_id || ':' || m.telegram_message_id
  FROM bot_messages m WHERE e.reason='addressed_command' AND e.message_event_key IS NULL
    AND m.id=e.legacy_message_id AND m.project_id=e.project_id AND m.token_id=e.token_id
    AND m.chat_id=e.chat_id AND m.telegram_message_id>0;
COMMIT;
