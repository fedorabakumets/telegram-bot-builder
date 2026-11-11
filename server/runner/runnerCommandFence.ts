/**
 * @fileoverview Проверка версии намерения в PostgreSQL перед выполнением команды бота.
 * @module server/runner/runnerCommandFence
 */

import { Pool } from "pg";

/** Узкий ленивый пул проверки команд; не загружает БД, маршруты и фоновые службы панели. */
let fencePool: Pool | undefined;

/**
 * Создаёт подключение только при первой проверке команды запуска или остановки.
 * @returns Пул коротких запросов актуальности команды
 */
function getFencePool(): Pool {
  if (fencePool) return fencePool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Для проверки актуальности команды бота нужен DATABASE_URL");
  fencePool = new Pool({
    connectionString, max: 2, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 20_000,
    application_name: `${process.env.PGAPPNAME?.trim() || 'botcraft-runtime'}-command-fence`,
    ssl: process.env.NODE_ENV === 'production' && process.env.PGSSLMODE !== 'disable'
      && !connectionString.includes('localhost') ? { rejectUnauthorized: false } : false,
  });
  fencePool.on('error', () => console.error('[runner-command-fence] Соединение проверки команд прервано'));
  return fencePool;
}

/**
 * Закрывает соединения защиты команд при остановке исполнителя.
 * @returns Завершение закрытия уже созданного пула
 */
export async function closeBotCommandFence(): Promise<void> {
  const closing = fencePool;
  fencePool = undefined;
  await closing?.end();
}

/** Поля защиты, переданные вместе с командой воркеру. */
export interface BotCommandFence {
  /** ID экземпляра бота в базе */
  instance_id: number;
  /** Версия желаемого состояния */
  desired_generation: number;
  /** ID токена для исключения перепутанных экземпляров */
  token_id: number;
}

/**
 * Проверяет актуальность команды в авторитетной базе данных.
 * @param fence - Идентификаторы команды
 * @param operation - Запуск или остановка
 * @returns true только для актуальной версии
 */
export async function isCurrentBotCommand(fence: BotCommandFence, operation: "start_bot" | "stop_bot"): Promise<boolean> {
  if (!Number.isSafeInteger(fence.instance_id) || !Number.isSafeInteger(fence.desired_generation)
    || !Number.isSafeInteger(fence.token_id)) return false;
  const { rows: [instance] } = await getFencePool().query<{
    /** Токен экземпляра бота. */
    tokenId: number;
    /** Желаемое состояние бота. */
    desiredStatus: string | null;
    /** Актуальная версия команды. */
    desiredGeneration: number;
  }>('SELECT token_id AS "tokenId", desired_status AS "desiredStatus", desired_generation AS "desiredGeneration" FROM bot_instances WHERE id = $1 LIMIT 1', [fence.instance_id]);
  if (!instance || instance.tokenId !== fence.token_id || instance.desiredGeneration !== fence.desired_generation) return false;
  return operation === "start_bot" ? instance.desiredStatus === "running" : true;
}
