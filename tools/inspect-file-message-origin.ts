/** @fileoverview Чтение истории отправки файла и кандидатов блоков из локальной копии БД. */
import 'dotenv/config';
import { pool } from '../server/database/db';

/** Читает диагностические сведения без изменения сообщений и сценария. */
async function main() {
  if (!/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? '')) throw new Error('Нужна локальная БД');
  const id = Number(process.argv[2] ?? 136300);
  const { rows: [message] } = await pool.query('select id, project_id, token_id, user_id, message_type, message_text, node_id, message_data, created_at from bot_messages where id=$1', [id]);
  if (!message) throw new Error('Сообщение не найдено');
  console.log('Сообщение', JSON.stringify(message));
  const { rows: history } = await pool.query(`select id, message_type, left(message_text, 350) as text, node_id, created_at,
    message_data->>'callback_data' as callback_data from bot_messages where project_id=$1 and token_id=$2 and user_id=$3
    and created_at between $4::timestamptz - interval '2 minutes' and $4::timestamptz + interval '1 minute' order by created_at, id`,
    [message.project_id, message.token_id, message.user_id, message.created_at]);
  console.log('История', JSON.stringify(history));
  const { rows: logs } = await pool.query(`select type, content, timestamp from bot_logs where project_id=$1 and token_id=$2
    and timestamp between $3::timestamptz - interval '10 seconds' and $3::timestamptz + interval '10 seconds' order by timestamp limit 150`,
    [message.project_id, message.token_id, message.created_at]);
  console.log('Логи отправки', JSON.stringify(logs).replace(/\b\d{5,}:[A-Za-z0-9_-]{20,}/g, '[ТОКЕН СКРЫТ]'));
  const { rows: coverage } = await pool.query('select count(*) as count, min(timestamp) as first, max(timestamp) as last from bot_logs where project_id=$1 and token_id=$2', [message.project_id, message.token_id]);
  console.log('Период логов', JSON.stringify(coverage));
  const { rows: [project] } = await pool.query('select data from bot_projects where id=$1', [message.project_id]);
  const fileId = message.message_data?.photo?.file_id;
  /** Обходит JSON проекта и выводит только узлы, совпавшие по тексту или идентификатору файла. */
  function visit(value: any) {
    if (!value || typeof value !== 'object') return;
    if (value.id && value.data) {
      const text = String(value.data.messageText ?? '');
      const sameText = message.message_text && message.message_text !== '[Фото]' && text.includes(message.message_text.slice(0, 70));
      if ((fileId && JSON.stringify(value.data).includes(fileId)) || sameText) console.log('Кандидат блока', JSON.stringify(value));
    }
    for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
  }
  visit(project.data);
  await pool.end();
}
main().catch(async error => { console.error(error.message); await pool.end(); process.exitCode = 1; });
