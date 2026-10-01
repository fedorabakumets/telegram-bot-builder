/**
 * @fileoverview Redis Streams между панелью и удалённым исполнителем ботов (WORKER_RUNTIME=remote).
 * На исполнителя два потока: команды панели (`cmd`) и события воркеров (`ev`).
 * Streams, а не pub/sub: сообщения не теряются при коротком обрыве соединения.
 * @module server/redis/workerStreams
 */

import type { Redis as RedisConnection } from "ioredis";

/** Сколько записей держать в потоке (приблизительно) */
const STREAM_MAXLEN = 10_000;

/** Сколько ждать новых записей в одном XREAD (мс) */
const READ_BLOCK_MS = 5_000;

/** Команда панели исполнителю */
export interface RunnerCommand {
  /** spawn — поднять воркер; line — строка в stdin; kill — убить; reset — убить все воркеры */
  k: "spawn" | "line" | "kill" | "reset";
  /** Ключ воркера */
  w?: string;
  /** ID экземпляра воркера (новый на каждый spawn) */
  i?: string;
  /** Строка JSON для stdin воркера */
  l?: string;
}

/** Событие воркера от исполнителя */
export interface RunnerEvent {
  /**
   * line — строка stdout; stderr — вывод stderr; exit — воркер завершился; error — не запустился;
   * hello — исполнитель (пере)запущен, воркеров прошлого запуска больше нет (w и i пустые)
   */
  k: "line" | "stderr" | "exit" | "error" | "hello";
  /** Ключ воркера */
  w: string;
  /** ID экземпляра воркера */
  i: string;
  /** Текст строки, stderr или ошибки */
  l?: string;
  /** Код выхода */
  c?: string;
  /** Сигнал завершения */
  s?: string;
}

/**
 * Имя потока команд исполнителя
 * @param runnerId - ID исполнителя
 * @returns ключ Redis
 */
export function runnerCommandStream(runnerId: string): string {
  return `tbb:runner:${runnerId}:cmd`;
}

/**
 * Имя потока событий исполнителя
 * @param runnerId - ID исполнителя
 * @returns ключ Redis
 */
export function runnerEventStream(runnerId: string): string {
  return `tbb:runner:${runnerId}:ev`;
}

/**
 * Создаёт соединение Redis для потоков (без лимита повторов: XREAD блокирующий)
 * @param url - REDIS_URL
 * @returns подключённый клиент
 */
export async function connectStreamRedis(url: string): Promise<RedisConnection> {
  const { default: Redis } = await import("ioredis");
  const client = new Redis(url, { maxRetriesPerRequest: null, lazyConnect: true });
  await client.connect();
  return client;
}

/**
 * Превращает объект в плоский список полей для XADD, пропуская пустые
 * @param fields - Поля записи
 * @returns [поле, значение, ...]
 */
export function encodeFields(fields: object): string[] {
  const flat: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) flat.push(key, String(value));
  }
  return flat;
}

/**
 * Собирает объект из плоского списка полей XREAD
 * @param flat - [поле, значение, ...]
 * @returns поля записи
 */
export function decodeFields(flat: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (let i = 0; i + 1 < flat.length; i += 2) fields[flat[i]] = flat[i + 1];
  return fields;
}

/**
 * Добавляет запись в поток с обрезкой старых
 * @param redis - Соединение
 * @param stream - Ключ потока
 * @param fields - Поля записи
 */
export async function appendToStream(redis: RedisConnection, stream: string, fields: object): Promise<void> {
  await redis.xadd(stream, "MAXLEN", "~", STREAM_MAXLEN, "*", ...encodeFields(fields));
}

/** Чтение потока в фоне */
export interface StreamFollower {
  /** Выполнится, когда определена позиция чтения (записи после неё не потеряются) */
  ready: Promise<void>;
  /** Останавливает чтение и закрывает соединение */
  stop(): void;
}

/**
 * Читает поток с конца в цикле, пока не вызван stop()
 * @param redis - Отдельное соединение (XREAD BLOCK занимает его целиком)
 * @param stream - Ключ потока
 * @param onEntry - Обработчик записи
 * @returns готовность и остановка
 */
export function followStream(
  redis: RedisConnection,
  stream: string,
  onEntry: (fields: Record<string, string>) => void,
): StreamFollower {
  let stopped = false;
  let lastId = "";
  let markReady!: () => void;
  const ready = new Promise<void>((resolve) => (markReady = resolve));
  void (async () => {
    while (!stopped) {
      if (!lastId) {
        // Не "$" в каждом XREAD: записи между двумя чтениями потерялись бы
        try {
          const last = await redis.xrevrange(stream, "+", "-", "COUNT", 1);
          lastId = last[0]?.[0] ?? "0-0";
          markReady();
        } catch (error) {
          if (stopped) return;
          console.error(`[WorkerStreams] Нет доступа к ${stream}:`, error instanceof Error ? error.message : error);
          await new Promise((resolve) => setTimeout(resolve, 1_000));
          continue;
        }
      }
      try {
        const result = await redis.xread("COUNT", 100, "BLOCK", READ_BLOCK_MS, "STREAMS", stream, lastId);
        for (const [, entries] of result ?? []) {
          for (const [id, flat] of entries) {
            lastId = id;
            try {
              onEntry(decodeFields(flat));
            } catch (error) {
              console.error(`[WorkerStreams] Ошибка обработки записи ${stream}:`, error);
            }
          }
        }
      } catch (error) {
        if (stopped) return;
        console.error(`[WorkerStreams] Ошибка чтения ${stream}:`, error instanceof Error ? error.message : error);
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  })();
  return {
    ready,
    stop: () => {
      stopped = true;
      redis.disconnect();
    },
  };
}
