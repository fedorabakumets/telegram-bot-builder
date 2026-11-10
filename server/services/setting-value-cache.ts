/**
 * @fileoverview Кэш значений настроек с объединением чтений и защитой от устаревших результатов.
 */

/** Кэширует результат чтения БД, включая отсутствие строки, но не ошибки. */
export class SettingValueCache {
  /** Сохранённые значения и сроки их действия. */
  private values = new Map<string, { value: string | undefined; expiresAt: number }>();
  /** Выполняющиеся чтения текущей версии ключа. */
  private pending = new Map<string, Promise<string | undefined>>();
  /** Версии ключей после успешной записи или удаления. */
  private revisions = new Map<string, number>();

  /**
   * Создаёт кэш с заданным сроком жизни.
   * @param ttlMs - Срок хранения результата в миллисекундах
   */
  constructor(private readonly ttlMs: number) {}

  /**
   * Читает значение, объединяя параллельные обращения к одному ключу.
   * @param key - Ключ настройки
   * @param loader - Чтение актуального значения из БД
   * @returns Значение текущей версии настройки
   */
  read(key: string, loader: () => Promise<string | undefined>): Promise<string | undefined> {
    const cached = this.values.get(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const revision = this.revisions.get(key) ?? 0;
    const request = Promise.resolve().then(loader).then(value => {
      if ((this.revisions.get(key) ?? 0) !== revision) return this.read(key, loader);
      this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
      return value;
    }).finally(() => {
      if (this.pending.get(key) === request) this.pending.delete(key);
    });
    this.pending.set(key, request);
    return request;
  }

  /**
   * Инвалидирует значение и отсоединяет старое чтение после успешной мутации.
   * @param key - Изменённый ключ настройки
   */
  invalidate(key: string): void {
    this.revisions.set(key, (this.revisions.get(key) ?? 0) + 1);
    this.values.delete(key);
    this.pending.delete(key);
  }
}
