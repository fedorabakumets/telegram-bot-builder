/** @fileoverview Совместимая с Python надёжная Redis-очередь Telegram-обновлений. */
import type { Redis } from "ioredis";
import { ACK, ENQUEUE, OFFSET, PEEK } from "./queueScripts";
import { ENQUEUE_WEBHOOK } from "./webhookQueueScript";

/** Обновление Telegram с обязательным номером доставки. */
export interface PollingUpdate {
  /** Неотрицательный идентификатор Telegram. */
  update_id: number;
  /** Остальные поля Telegram сохраняются без преобразования. */
  [key: string]: unknown;
}

/** Ограничения атомарной записи пакета. */
export interface DemandQueueOptions {
  /** Максимальное число неподтверждённых обновлений. */
  maxPending?: number;
  /** Максимальный суммарный размер JSON в байтах UTF-8. */
  maxBytes?: number;
  /** Изолированный префикс для интеграционных тестов; в работе не задаётся. */
  keyPrefix?: string;
  /** Время хранения принятых webhook ID после доставки, по умолчанию двое суток. */
  webhookRetentionSeconds?: number;
  /** Защитный предел истории повторов; переполнение требует повторить доставку. */
  maxWebhookHistory?: number;
}

/** Переполнение требует повторить пакет до следующего getUpdates. */
export class QueueFullError extends Error {
  /** Создаёт безопасную ошибку без содержимого обновлений. */
  constructor() { super("Очередь обновлений заполнена"); this.name = "QueueFullError"; }
}

/** Сохраняет пакет и offset атомарно; подтверждение выполняет Python после записи состояния. */
export class DemandQueue {
  /** Порядок ключей совпадает с demand_queue.py и demand_state.py. */
  readonly keys: string[];
  /** Предел неподтверждённых обновлений. */
  private readonly maxPending: number;
  /** Предел суммарного размера обновлений. */
  private readonly maxBytes: number;
  /** Отдельная история webhook остаётся после подтверждения обновления Python. */
  readonly webhookSeenKey: string;
  /** Срок и предел истории повторов webhook. */
  private readonly webhookLimits: readonly [number, number];

  /** Настраивает очередь на внешнем общем соединении Redis, не управляя его закрытием. */
  constructor(private readonly redis: Redis, tokenId: number, options: DemandQueueOptions = {}) {
    if (!Number.isSafeInteger(tokenId) || tokenId < 1) throw new Error("Недопустимый идентификатор бота");
    this.maxPending = options.maxPending ?? 1000;
    this.maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
    if (![this.maxPending, this.maxBytes].every(value => Number.isSafeInteger(value) && value > 0)) {
      throw new Error("Ограничения очереди должны быть положительными целыми числами");
    }
    const prefix = `${options.keyPrefix ?? "tbb:demand"}:{${tokenId}}`;
    this.keys = ["pending", "payloads", "offset", "bytes", "sequence", "received"].map(part => `${prefix}:${part}`);
    this.webhookSeenKey = `${prefix}:webhook-seen`;
    this.webhookLimits = [options.webhookRetentionSeconds ?? 172800, options.maxWebhookHistory ?? 1_000_000];
    if (!this.webhookLimits.every(value => Number.isSafeInteger(value) && value > 0)) {
      throw new Error("Ограничения истории webhook должны быть положительными целыми числами");
    }
  }

  /** Принимает webhook в любом порядке и подавляет повторы даже после подтверждения Python. */
  async enqueueWebhook(update: PollingUpdate): Promise<void> {
    if (!update || !Number.isSafeInteger(update.update_id) || update.update_id < 0) {
      throw new Error("Обновление должно содержать целочисленный update_id");
    }
    const result = await this.redis.eval(ENQUEUE_WEBHOOK, 7, ...this.keys, this.webhookSeenKey,
      String(update.update_id), JSON.stringify(update), this.maxPending, this.maxBytes, ...this.webhookLimits);
    if (!result) throw new QueueFullError();
  }

  /** Записывает весь пакет либо оставляет очередь и подтверждённое смещение неизменными. */
  async enqueue(updates: readonly PollingUpdate[]): Promise<void> {
    if (!updates.length) return;
    const args: (string | number)[] = [this.maxPending, this.maxBytes, Math.floor(Date.now() / 1000)];
    for (const update of updates) {
      if (!update || !Number.isSafeInteger(update.update_id) || update.update_id < 0) {
        throw new Error("Обновление должно содержать целочисленный update_id");
      }
      args.push(String(update.update_id), JSON.stringify(update));
    }
    if (!await this.redis.eval(ENQUEUE, this.keys.length, ...this.keys, ...args)) throw new QueueFullError();
  }

  /** Возвращает только сохранённый offset; после шести дней без пакетов разрешает новый случайный ID Telegram. */
  async offset(): Promise<number | null> {
    const value = await this.redis.eval(OFFSET, this.keys.length, ...this.keys, Math.floor(Date.now() / 1000));
    return value === null ? null : Number(value);
  }

  /** Читает первое обновление без удаления; эксклюзивность обработчика обеспечивается внешним lease. */
  async peek(): Promise<PollingUpdate | null> {
    const payload = await this.redis.eval(PEEK, this.keys.length, ...this.keys);
    return payload ? JSON.parse(String(payload)) as PollingUpdate : null;
  }

  /** Проверяет пробуждение без загрузки потенциально большого тела обновления в Node. */
  async hasPending(): Promise<boolean> {
    return (await this.redis.zcard(this.keys[0])) > 0;
  }

  /** Идемпотентно удаляет подтверждённое обновление; рабочий Python использует атомарный save_and_ack. */
  async ack(updateId: number): Promise<void> {
    if (!Number.isSafeInteger(updateId) || updateId < 0) throw new Error("Недопустимый update_id");
    await this.redis.eval(ACK, this.keys.length, ...this.keys, String(updateId));
  }
}
