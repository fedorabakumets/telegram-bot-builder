/** @fileoverview Ограниченное локальное хранилище лимитов с общей квотой Redis и резервным режимом. */
import type { IncrementResponse, Store } from 'express-rate-limit';
import { incrementUsersRedisLimit } from './users-rate-limit-redis';

/** Счётчик одного клиента. */
interface Bucket {
  /** Число обращений в окне. */
  totalHits: number;
  /** Время окончания окна. */
  resetTime: Date;
}

/** Хранит локальную копию квоты, ограничивает память и продолжает защиту при сбое Redis. */
export class UsersRateLimitStore implements Store {
  /** Префикс разделяет квоты IP и авторизованного пользователя. */
  readonly prefix: string;
  /** Общие ключи Redis доступны нескольким процессам. */
  readonly localKeys = false;
  /** Ограниченная таблица текущих квот. */
  private readonly buckets = new Map<string, Bucket>();
  /** Время следующей очистки истёкших записей. */
  private cleanupAt = 0;

  /** Создаёт хранилище без фоновых таймеров.
   * @param prefix - Пространство имён квоты.
   * @param windowMs - Продолжительность окна.
   * @param capacity - Максимальное число ключей в памяти.
   * @param now - Источник времени.
   */
  constructor(prefix: string, private readonly windowMs = 60_000,
    private readonly capacity = 10_000, private readonly now = Date.now) {
    this.prefix = `bot-users-limit:${prefix}:`;
  }

  /** Увеличивает счётчик; заполненная память закрывает доступ новым ключам.
   * @param key - Доверенный ключ клиента.
   * @returns Число обращений и конец окна.
   */
  async increment(key: string): Promise<IncrementResponse> {
    const time = this.now();
    if (time >= this.cleanupAt) {
      for (const [id, item] of this.buckets) if (+item.resetTime <= time) this.buckets.delete(id);
      this.cleanupAt = time + Math.min(this.windowMs, 1000);
    }
    let bucket = this.buckets.get(key);
    if (bucket && +bucket.resetTime <= time) { this.buckets.delete(key); bucket = undefined; }
    if (!bucket) {
      if (this.buckets.size >= this.capacity) {
        return { totalHits: Number.MAX_SAFE_INTEGER, resetTime: new Date(time + this.windowMs) };
      }
      bucket = { totalHits: 0, resetTime: new Date(time + this.windowMs) };
      this.buckets.set(key, bucket);
    }
    bucket.totalHits = Math.min(Number.MAX_SAFE_INTEGER, bucket.totalHits + 1);
    const shared = await incrementUsersRedisLimit(this.prefix + key, this.windowMs);
    if (shared) {
      bucket.totalHits = Math.max(bucket.totalHits, shared.totalHits);
      // Общий TTL определяет границу окна и для резервной копии поздно подключившейся реплики.
      if (shared.resetTime) bucket.resetTime = shared.resetTime;
    }
    return { totalHits: bucket.totalHits, resetTime: new Date(bucket.resetTime) };
  }

  /** Сохраняет учёт всех обращений: успешные и ошибочные запросы расходуют квоту.
   * @param _key - Ключ клиента.
   */
  decrement(_key: string): void { /* Возврат квоты намеренно отключён. */ }

  /** Запрещает обход общей квоты локальным сбросом; записи истекают по TTL.
   * @param _key - Ключ клиента.
   */
  resetKey(_key: string): void { /* Сброс общей квоты выполняется только истечением окна. */ }
}
