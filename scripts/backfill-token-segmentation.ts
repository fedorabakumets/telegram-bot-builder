/**
 * @fileoverview Скрипт явного бэкфилла token_id для legacy-данных user database и истории сообщений
 * @description Переносит записи с token_id = 0 в реальный token_id, если его можно определить безопасно
 */

import { Pool } from 'pg';
import 'dotenv/config';

/**
 * Контекст проекта для бэкфилла legacy-данных
 */
interface ProjectBackfillContext {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор целевого токена */
  tokenId: number;
}

/**
 * Извлекает значение CLI-аргумента по имени
 * @param flag - Имя флага
 * @returns Значение флага или undefined
 */
function getArgValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const flagIndex = args.indexOf(flag);
  return flagIndex >= 0 ? args[flagIndex + 1] : undefined;
}

/**
 * Преобразует CLI-значение в положительное число
 * @param value - Сырое значение аргумента
 * @returns Число или null, если значение невалидно
 */
function parsePositiveInt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Возвращает контексты проектов для безопасного бэкфилла
 * @param pool - Подключение к PostgreSQL
 * @param projectId - Необязательный фильтр по одному проекту
 * @returns Список проектов с однозначно определённым tokenId
 */
async function resolveProjectsForBackfill(
  pool: Pool,
  projectId?: number
): Promise<ProjectBackfillContext[]> {
  const result = await pool.query<{
    project_id: number;
    resolved_token_id: number | null;
    token_count: number;
  }>(`
    SELECT
      bt.project_id,
      COALESCE(
        MAX(bt.id) FILTER (WHERE bt.is_default = 1),
        CASE WHEN COUNT(*) = 1 THEN MAX(bt.id) ELSE NULL END
      ) AS resolved_token_id,
      COUNT(*)::integer AS token_count
    FROM bot_tokens bt
    WHERE ($1::integer IS NULL OR bt.project_id = $1)
    GROUP BY bt.project_id
    ORDER BY bt.project_id
  `, [projectId ?? null]);

  return result.rows
    .filter((row) => row.resolved_token_id !== null)
    .map((row) => ({
      projectId: row.project_id,
      tokenId: Number(row.resolved_token_id),
    }));
}

/**
 * Выполняет бэкфилл legacy token_id=0 для одного проекта
 * @param pool - Подключение к PostgreSQL
 * @param context - Контекст проекта и целевого токена
 * @returns Сводка по количеству обновлённых строк
 */
async function backfillProject(
  pool: Pool,
  context: ProjectBackfillContext
): Promise<Record<string, number>> {
  const summary: Record<string, number> = {};

  const tables = [
    'bot_users',
    'bot_messages',
    'user_bot_data',
  ] as const;

  for (const tableName of tables) {
    const result = await pool.query(
      `
        UPDATE ${tableName}
        SET token_id = $1
        WHERE project_id = $2
          AND token_id = 0
      `,
      [context.tokenId, context.projectId]
    );

    summary[tableName] = result.rowCount ?? 0;
  }

  return summary;
}

/**
 * Печатает инструкцию по использованию скрипта
 * @returns void
 */
function printUsage(): void {
  console.log('Использование:');
  console.log('  npx tsx --tsconfig tsconfig.node.json scripts/backfill-token-segmentation.ts --projectId 157');
  console.log('  npx tsx --tsconfig tsconfig.node.json scripts/backfill-token-segmentation.ts --all-safe');
}

/**
 * Точка входа скрипта бэкфилла
 * @returns Promise<void>
 */
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const projectId = parsePositiveInt(getArgValue('--projectId'));
  const runAllSafe = process.argv.includes('--all-safe');

  if (!databaseUrl) {
    console.error('DATABASE_URL не найден');
    process.exit(1);
  }

  if (!projectId && !runAllSafe) {
    console.error('Нужно передать --projectId <id> или --all-safe');
    printUsage();
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const contexts = await resolveProjectsForBackfill(pool, projectId ?? undefined);

    if (contexts.length === 0) {
      console.log('Подходящих проектов для бэкфилла не найдено');
      return;
    }

    for (const context of contexts) {
      console.log(`Проект ${context.projectId}: перенос legacy token_id=0 -> token_id=${context.tokenId}`);
      const summary = await backfillProject(pool, context);
      console.log(
        `  bot_users=${summary.bot_users}, bot_messages=${summary.bot_messages}, user_bot_data=${summary.user_bot_data}`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Ошибка бэкфилла token segmentation:', error);
  process.exit(1);
});
