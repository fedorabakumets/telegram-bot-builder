/** @fileoverview Безопасные подписи проверенных исторических кнопок сохраняются независимо от переписки. */
BEGIN;
SELECT pg_advisory_xact_lock(7262401);
ALTER TABLE analytics_audience_evidence_v2 ADD COLUMN IF NOT EXISTS button_label text;
/** Не переносим callback payload и скрываем любые подписи с параметром авторизации. */
CREATE OR REPLACE FUNCTION analytics_evidence_button_label_v2() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE label text;
BEGIN
  IF NEW.reason='legacy_callback' THEN
    SELECT m.message_data->>'button_text' INTO label FROM bot_messages m
      WHERE m.project_id=NEW.project_id AND m.token_id=NEW.token_id AND m.id=NEW.legacy_message_id;
    NEW.button_label=CASE WHEN label IS NOT NULL AND lower(label) NOT LIKE '%link\_%' ESCAPE '\'
      THEN left(NULLIF(trim(label),''),160) ELSE NULL END;
  ELSE NEW.button_label=NULL; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION analytics_evidence_button_label_v2() FROM PUBLIC;
DROP TRIGGER IF EXISTS analytics_evidence_button_label_v2 ON analytics_audience_evidence_v2;
CREATE TRIGGER analytics_evidence_button_label_v2 BEFORE INSERT ON analytics_audience_evidence_v2
  FOR EACH ROW EXECUTE FUNCTION analytics_evidence_button_label_v2();
/** Уже проверенные свидетельства обогащаются без создания новых событий. */
UPDATE analytics_audience_evidence_v2 e SET button_label=left(NULLIF(trim(m.message_data->>'button_text'),''),160)
  FROM bot_messages m WHERE e.reason='legacy_callback' AND e.button_label IS NULL
    AND m.id=e.legacy_message_id AND m.project_id=e.project_id AND m.token_id=e.token_id
    AND lower(m.message_data->>'button_text') NOT LIKE '%link\_%' ESCAPE '\';
COMMIT;
