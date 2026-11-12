/**
 * @fileoverview Изолированная модель пробуждения бота: проверяет планирование, а не надёжную доставку.
 * Хранилище и обработчик поддельные; перезапуск процесса, распределённые блокировки и exactly-once не моделируются.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

/** Создаёт управляемое ожидание для воспроизводимых конкурентных проверок. */
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

/** Моделирует один процесс бота с ограниченной очередью и единственным запуском. */
class DemandScheduler {
  /** Принимает поддельные операции сохранения и запуска рабочего процесса. */
  constructor({ persist, boot, maxCount = 4, maxBytes = 128, idleMs = 20 }) {
    Object.assign(this, { persist, boot, maxCount, maxBytes, idleMs });
    this.entries = new Map();
    this.queue = [];
    this.count = 0;
    this.bytes = 0;
    this.worker = null;
    this.running = null;
    this.timer = null;
    this.failures = [];
    this.completedIds = [];
  }

  /** Возвращает подтверждение только после успешного поддельного сохранения. */
  accept(update) {
    const previous = this.entries.get(update.id);
    if (previous) return previous;
    const size = Buffer.byteLength(JSON.stringify(update));
    if (this.count >= this.maxCount || this.bytes + size > this.maxBytes) {
      return Promise.reject(new Error('Переполнение'));
    }
    clearTimeout(this.timer);
    this.count++;
    this.bytes += size;
    const entry = { update, size };
    const acknowledgement = Promise.resolve().then(async () => {
      try {
        await this.persist(update);
      } catch (error) {
        this.entries.delete(update.id);
        this.release(entry);
        throw error;
      }
      this.queue.push(entry);
      this.start();
      return { persisted: true };
    });
    this.entries.set(update.id, acknowledgement);
    return acknowledgement;
  }

  /** Освобождает бюджет после обработки либо отказа сохранения. */
  release(entry) {
    this.count--;
    this.bytes -= entry.size;
    if (!this.count && !this.running) this.armSleep();
  }

  /** Объединяет одновременные запросы в единственную последовательность запуска. */
  start() {
    if (this.running) return;
    this.running = this.drain().finally(() => {
      this.running = null;
      if (this.queue.length) this.start();
      else this.armSleep();
    });
  }

  /** Обрабатывает сохранённые записи; отказ после подтверждения требует внешнего повторного чтения. */
  async drain() {
    try {
      this.worker ??= await this.boot();
    } catch (error) {
      for (const entry of this.queue.splice(0)) {
        this.failures.push({ id: entry.update.id, error });
        this.release(entry);
      }
      return;
    }
    while (this.queue.length) {
      const entry = this.queue.shift();
      try {
        await this.worker.handle(entry.update);
      } catch (error) {
        this.failures.push({ id: entry.update.id, error });
      } finally {
        this.release(entry);
        this.completedIds.push(entry.update.id);
        if (this.completedIds.length > 64) this.entries.delete(this.completedIds.shift());
      }
    }
  }

  /** Завершает поддельный процесс после периода без работы. */
  armSleep() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.count && !this.running && this.worker) {
        this.worker.stop();
        this.worker = null;
      }
    }, this.idleMs);
    this.timer.unref();
  }

  /** Ожидает завершения уже запланированной обработки. */
  async flush() {
    while (this.running) await this.running;
  }

  /** Освобождает таймер и поддельный процесс после проверки. */
  close() {
    clearTimeout(this.timer);
    this.worker?.stop();
    this.worker = null;
  }
}

/** Создаёт стенд без сети, Telegram, БД и настоящих дочерних процессов. */
function fixture(overrides = {}) {
  const state = { boots: 0, stops: 0, saved: [], handled: [] };
  const scheduler = new DemandScheduler({
    persist: async (update) => { state.saved.push(update.id); },
    boot: async () => {
      state.boots++;
      return {
        handle: async (update) => { state.handled.push(update.id); },
        stop: () => { state.stops++; },
      };
    },
    ...overrides,
  });
  return { scheduler, state };
}

test('Подтверждение ожидает сохранения; процесс до сохранения не запускается', async (t) => {
  const gate = deferred();
  const { scheduler, state } = fixture({ persist: () => gate.promise });
  t.after(() => scheduler.close());
  let acknowledged = false;
  const request = scheduler.accept({ id: 1 }).then(() => { acknowledged = true; });
  await delay(0);
  assert.equal(acknowledged, false);
  assert.equal(state.boots, 0);
  gate.resolve();
  await request;
  await scheduler.flush();
  assert.equal(acknowledged, true);
  assert.deepEqual(state.handled, [1]);
});

test('Конкурентные обновления запускают один процесс; повтор не обрабатывается дважды', async (t) => {
  const gate = deferred();
  let boots = 0;
  const handled = [];
  const { scheduler } = fixture({ boot: async () => {
    boots++;
    await gate.promise;
    return { handle: async (update) => { handled.push(update.id); }, stop() {} };
  } });
  t.after(() => scheduler.close());
  await Promise.all([1, 2, 1, 3].map((id) => scheduler.accept({ id })));
  assert.equal(boots, 1);
  gate.resolve();
  await scheduler.flush();
  assert.deepEqual(handled, [1, 2, 3]);
  assert.equal(scheduler.bytes, 0);
});

test('Количество ожидающих записей ограничено ещё до сохранения', async (t) => {
  const gate = deferred();
  const { scheduler } = fixture({ maxCount: 1, persist: () => gate.promise });
  t.after(() => scheduler.close());
  const first = scheduler.accept({ id: 1 });
  await assert.rejects(scheduler.accept({ id: 2 }), /Переполнение/);
  assert.equal(scheduler.count, 1);
  gate.resolve();
  await first;
  await scheduler.flush();
  assert.equal(scheduler.count, 0);
});

test('Бюджет байтов учитывает UTF-8 и отклоняет слишком большую запись', async (t) => {
  const { scheduler, state } = fixture({ maxBytes: 30 });
  t.after(() => scheduler.close());
  await assert.rejects(scheduler.accept({ id: 1, text: 'я'.repeat(20) }), /Переполнение/);
  assert.equal(scheduler.count, 0);
  assert.deepEqual(state.saved, []);
});

test('Простой завершает процесс; следующее обновление пробуждает его заново', async (t) => {
  const { scheduler, state } = fixture();
  t.after(() => scheduler.close());
  await scheduler.accept({ id: 1 });
  await scheduler.flush();
  await delay(60);
  assert.equal(state.stops, 1);
  assert.equal(scheduler.worker, null);
  await scheduler.accept({ id: 2 });
  await scheduler.flush();
  assert.equal(state.boots, 2);
  assert.deepEqual(state.handled, [1, 2]);
});

test('Ошибка сохранения не подтверждается и допускает повтор', async (t) => {
  let attempts = 0;
  const { scheduler, state } = fixture({ persist: async () => {
    if (++attempts === 1) throw new Error('Хранилище недоступно');
  } });
  t.after(() => scheduler.close());
  await assert.rejects(scheduler.accept({ id: 1 }), /Хранилище/);
  assert.equal(state.boots, 0);
  assert.equal(scheduler.bytes, 0);
  await scheduler.accept({ id: 1 });
  await scheduler.flush();
  assert.deepEqual(state.handled, [1]);
});

test('Ожидающее сохранение не даёт усыпить процесс, отказ восстанавливает таймер простоя', async (t) => {
  let failPersistence;
  const pending = new Promise((resolve, reject) => { failPersistence = reject; });
  const { scheduler, state } = fixture();
  t.after(() => scheduler.close());
  await scheduler.accept({ id: 1 });
  await scheduler.flush();
  scheduler.persist = () => pending;
  const request = scheduler.accept({ id: 2 });
  await delay(60);
  assert.equal(state.stops, 0);
  failPersistence(new Error('Сбой сохранения'));
  await assert.rejects(request, /Сбой сохранения/);
  await delay(60);
  assert.equal(state.stops, 1);
});

test('Ошибка запуска сохраняется отдельно: подтверждение не означает обработку', async (t) => {
  const { scheduler, state } = fixture({ boot: async () => { throw new Error('Ошибка запуска'); } });
  t.after(() => scheduler.close());
  assert.deepEqual(await scheduler.accept({ id: 1 }), { persisted: true });
  await scheduler.flush();
  assert.deepEqual(state.saved, [1]);
  assert.equal(scheduler.failures[0].id, 1);
  assert.equal(scheduler.count, 0);
});

test('Ошибка обработчика не блокирует следующие обновления и освобождает бюджет', async (t) => {
  const handled = [];
  const { scheduler } = fixture({ boot: async () => ({
    handle: async (update) => {
      if (update.id === 1) throw new Error('Ошибка обработчика');
      handled.push(update.id);
    },
    stop() {},
  }) });
  t.after(() => scheduler.close());
  await Promise.all([scheduler.accept({ id: 1 }), scheduler.accept({ id: 2 })]);
  await scheduler.flush();
  assert.deepEqual(handled, [2]);
  assert.equal(scheduler.failures.length, 1);
  assert.equal(scheduler.bytes, 0);
});
