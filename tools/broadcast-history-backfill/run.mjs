/**
 * @fileoverview Восстановление истории одной рассылки; по умолчанию только обезличенный план.
 */
import pg from 'pg';
import { planBackfill } from './matching.mjs';

/** Проверяет обязательную явную область и запрещает неизвестные параметры. */
function parseArgs(args) {
  const scope = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--apply') { scope.apply = true; continue; }
    if (!['--project', '--broadcast', '--token'].includes(key) || scope[key] != null) throw new Error('arguments');
    const value = Number(args[++i]);
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('arguments');
    scope[key] = value;
  }
  if (!scope['--project'] || !scope['--broadcast'] || !scope['--token']) throw new Error('arguments');
  return scope;
}

/** Выполняет согласованное чтение и необязательное применение плана в одной транзакции. */
async function main() {
  const scope = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error('database_url_required');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query(scope.apply ? 'BEGIN ISOLATION LEVEL SERIALIZABLE' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '30s'");
    const params = [scope['--project'], scope['--broadcast'], scope['--token']];
    const { rows: broadcasts } = await client.query(`SELECT id, message_text, buttons, buttons_per_row, status
      FROM broadcasts WHERE project_id=$1 AND id=$2 AND token_id=$3`, params);
    if (broadcasts.length !== 1 || !['done', 'stopped', 'failed'].includes(broadcasts[0].status)) throw new Error('scope_or_status');
    const { rows: messages } = await client.query(`SELECT id, user_id, chat_id, message_type, message_text, message_data, telegram_message_id
      FROM bot_messages WHERE project_id=$1 AND token_id=$3 AND message_data->>'broadcastId'=$2::text`, params);
    const { rows: results } = await client.query(`SELECT user_id, status, telegram_message_id
      FROM broadcast_results WHERE broadcast_id=$1`, [params[1]]);
    const plan = planBackfill(broadcasts[0], messages, results);
    if (scope.apply) {
      for (const change of plan.changes) {
        const updated = await client.query(`UPDATE bot_messages SET telegram_message_id=$1, message_data=$2::jsonb
          WHERE id=$3 AND project_id=$4 AND token_id=$5`,
        [change.telegramMessageId, JSON.stringify(change.messageData), change.id, params[0], params[2]]);
        if (updated.rowCount !== 1) throw new Error('concurrent_change');
      }
    }
    await client.query(scope.apply ? 'COMMIT' : 'ROLLBACK');
    console.log(JSON.stringify({ mode: scope.apply ? 'apply' : 'dry-run', examined: messages.length, eligible: plan.changes.length, skipped: plan.skipped }));
  } finally { await client.end(); }
}

/** Не выводит ошибки драйвера, параметры соединения или содержимое сообщений. */
main().catch(() => { console.error('Операция не выполнена. Проверьте область, завершённость рассылки и подключение; при конфликте повторите dry-run.'); process.exitCode = 1; });
