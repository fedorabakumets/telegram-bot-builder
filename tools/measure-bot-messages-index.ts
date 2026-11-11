/**
 * @fileoverview Замер чтения сообщений до и после построения индекса времени.
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { Client } from 'pg';

/** Узел плана PostgreSQL с вложенными операциями. */
interface PlanNode {
  /** Название операции. */
  'Node Type': string;
  /** Название использованного индекса. */
  'Index Name'?: string;
  /** Таблица, к которой относится операция. */
  'Relation Name'?: string;
  /** Прочитанные из хранилища блоки. */
  'Shared Read Blocks'?: number;
  /** Найденные в кеше блоки. */
  'Shared Hit Blocks'?: number;
  /** Вложенные операции плана. */
  Plans?: PlanNode[];
}

/** Результат одного варианта запроса. */
interface Measurement {
  /** Вариант выборки. */
  scope: string;
  /** Время выполнения запроса, мс. */
  executionMs: number;
  /** Прочитанные блоки по корневому узлу. */
  readBlocks: number;
  /** Блоки в кеше по корневому узлу. */
  hitBlocks: number;
  /** Индексы, выбранные планировщиком. */
  indexes: string[];
  /** Операции последовательного чтения сообщений. */
  messageSeqScans: number;
}

/** Сохранённый результат обоих вариантов запроса. */
interface Snapshot {
  /** Идентификатор проекта. */
  projectId: number;
  /** Идентификатор бота. */
  tokenId: number;
  /** Замеры проекта и бота. */
  measurements: Measurement[];
}

/** SQL второго запроса активности пользователей за сутки. */
const QUERY = `
  SELECT COUNT(DISTINCT bm.user_id)::int AS active,
    COUNT(DISTINCT bm.user_id) FILTER (
      WHERE COALESCE(bu.registered_at, bm.created_at) >= NOW() - INTERVAL '24 hours'
    )::int AS newcomers
  FROM bot_messages bm
  LEFT JOIN bot_users bu
    ON bu.project_id = bm.project_id
   AND bu.token_id = COALESCE(bm.token_id, 0)
   AND bu.user_id::text = bm.user_id
  WHERE bm.project_id = $1
    AND ($2::integer IS NULL OR bm.token_id = $2)
    AND bm.message_type = 'user'
    AND bm.created_at >= NOW() - INTERVAL '24 hours'`;

/**
 * Собирает названия индексов и число последовательных чтений из плана.
 * @param node - Текущий узел плана.
 * @param indexes - Множество использованных индексов.
 * @returns Количество операций последовательного чтения.
 */
function inspectPlan(node: PlanNode, indexes: Set<string>): number {
  if (node['Index Name']) indexes.add(node['Index Name']);
  return Number(node['Node Type'] === 'Seq Scan' && node['Relation Name'] === 'bot_messages')
    + (node.Plans ?? []).reduce((count, child) => count + inspectPlan(child, indexes), 0);
}

/**
 * Выполняет один реальный запрос активности в транзакции только для чтения.
 * @param client - Соединение с базой.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор бота или отсутствие фильтра.
 * @returns Время и объём чтения по плану.
 */
async function measure(client: Client, projectId: number, tokenId: number | null): Promise<Measurement> {
  const result = await client.query<{ 'QUERY PLAN': [{ Plan: PlanNode; 'Execution Time': number }] }>(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${QUERY}`, [projectId, tokenId],
  );
  const report = result.rows[0]['QUERY PLAN'][0];
  const indexes = new Set<string>();
  const messageSeqScans = inspectPlan(report.Plan, indexes);
  return {
    scope: tokenId === null ? 'project' : 'token',
    executionMs: report['Execution Time'],
    readBlocks: report.Plan['Shared Read Blocks'] ?? 0,
    hitBlocks: report.Plan['Shared Hit Blocks'] ?? 0,
    indexes: [...indexes],
    messageSeqScans,
  };
}

/**
 * Печатает разницу с ранее сохранённым замером того же проекта и бота.
 * @param current - Текущий замер.
 * @param baselinePath - Путь к исходному JSON.
 * @returns Завершение сравнения.
 */
function compare(current: Snapshot, baselinePath: string): void {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Snapshot;
  if (baseline.projectId !== current.projectId || baseline.tokenId !== current.tokenId) {
    throw new Error('Исходный замер относится к другому проекту или боту');
  }
  for (const item of current.measurements) {
    const before = baseline.measurements.find((candidate) => candidate.scope === item.scope);
    if (!before || !Number.isFinite(before.executionMs) || !Number.isFinite(before.readBlocks)
      || !Number.isFinite(before.messageSeqScans)) {
      throw new Error(`Некорректный исходный замер для ${item.scope}`);
    }
    console.log(`${item.scope}: время ${before.executionMs} → ${item.executionMs} мс; `
      + `чтение ${before.readBlocks} → ${item.readBlocks} блоков; `
      + `полных проходов сообщений ${before.messageSeqScans} → ${item.messageSeqScans}`);
  }
}

/**
 * Проверяет аргументы и сохраняет результаты двух вариантов запроса.
 * @returns Завершение замера.
 */
async function main(): Promise<void> {
  const [projectArg, tokenArg, outputPath, baselinePath] = process.argv.slice(2);
  const projectId = Number(projectArg);
  const tokenId = Number(tokenArg);
  if (!process.env.DATABASE_URL || !Number.isSafeInteger(projectId) || projectId <= 0
    || !Number.isSafeInteger(tokenId) || tokenId <= 0 || !outputPath) {
    throw new Error('Формат: tsx tools/measure-bot-messages-index.ts PROJECT_ID TOKEN_ID OUTPUT.json [BASELINE.json]; нужен DATABASE_URL');
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL, application_name: 'bot_messages_index_measure' });
  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '15s'");
    const measurements = [
      await measure(client, projectId, null),
      await measure(client, projectId, tokenId),
    ];
    await client.query('ROLLBACK');
    const snapshot: Snapshot = { projectId, tokenId, measurements };
    for (const item of measurements) console.log(item);
    if (baselinePath) compare(snapshot, baselinePath);
    writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
    console.log(`Результат сохранён: ${outputPath}`);
  } finally {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error('Замер остановлен:', error);
  process.exitCode = 1;
});
