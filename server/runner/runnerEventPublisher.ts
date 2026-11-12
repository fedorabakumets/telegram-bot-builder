/** @fileoverview Пересылка событий с ограничением команд Redis и обратным давлением без удаления событий. */
import type { RunnerEvent } from "../redis/workerStreams";

/** Настройки доставки; пороги ограничивают чтение вывода, а не удаляют сообщения. */
interface PublisherOptions {
  /** Отправка одного события с подтверждением Redis. */
  send: (event: RunnerEvent) => Promise<void>;
  /** Приостанавливает либо возобновляет stdout и stderr всех воркеров. */
  setPaused: (paused: boolean) => void;
  /** Сообщает об окончательном отказе транспорта, как исходный обработчик отправки. */
  onError: (error: unknown, event: RunnerEvent) => void;
  /** Максимальное число одновременно отправляемых команд. */
  concurrency?: number;
  /** Порог количества событий, включая отправляемые. */
  highCount?: number;
  /** Порог суммарного размера JSON в байтах, включая отправляемые события. */
  highBytes?: number;
}

/** Элемент очереди с заранее вычисленным размером полезной нагрузки. */
interface PendingEvent {
  /** Исходное событие без изменения протокола. */
  event: RunnerEvent;
  /** Размер сериализованной полезной нагрузки в UTF-8. */
  bytes: number;
}

/**
 * Создаёт очередь с гистерезисом: пауза на верхнем пороге, продолжение ниже половины обоих порогов.
 * Уже прочитанный кусок и системные события сохраняются даже сверх порога; жёсткого лимита RSS нет.
 * @param options - Отправитель, управление чтением и пороги
 * @returns Отправка, ожидание опустошения и числовые показатели
 */
export function createRunnerEventPublisher(options: PublisherOptions) {
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 16));
  const highCount = Math.max(1, Math.floor(options.highCount ?? 1024));
  const highBytes = Math.max(1, Math.floor(options.highBytes ?? 1024 * 1024));
  const queue: PendingEvent[] = [];
  const waiters: Array<() => void> = [];
  let pendingCount = 0, pendingBytes = 0, peakBytes = 0, inFlight = 0, failures = 0;
  let paused = false;

  /** Согласует состояние чтения с обоими порогами, сохраняя гистерезис. */
  const updatePressure = () => {
    const next = paused
      ? pendingCount > Math.floor(highCount / 2) || pendingBytes > Math.floor(highBytes / 2)
      : pendingCount >= highCount || pendingBytes >= highBytes;
    if (next !== paused) { paused = next; options.setPaused(paused); }
  };
  /** Отправляет ограниченное число событий; порядок вызовов XADD совпадает с порядком приёма. */
  const pump = () => {
    while (inFlight < concurrency && queue.length) {
      const item = queue.shift()!;
      inFlight++;
      let sent: Promise<void>;
      try { sent = options.send(item.event); }
      catch (error) { sent = Promise.reject(error); }
      void sent.catch((error) => {
        failures++;
        try { options.onError(error, item.event); }
        catch { /* Ошибка журнала не должна блокировать освобождение очереди. */ }
      }).finally(() => {
        inFlight--; pendingCount--; pendingBytes -= item.bytes;
        updatePressure();
        pump();
        if (!pendingCount) for (const resolve of waiters.splice(0)) resolve();
      });
    }
  };
  return {
    /** Возвращает счётчики без содержания команд, токенов и журналов. */
    snapshot: () => ({ pendingCount, pendingJsonBytes: pendingBytes, peakJsonBytes: peakBytes,
      inFlight, queuedCount: queue.length, paused, failures }),
    /**
     * Сохраняет любое событие, включая завершение процесса во время паузы.
     * @param event - Событие воркера
     */
    publish(event: RunnerEvent): void {
      const bytes = Buffer.byteLength(JSON.stringify(event));
      queue.push({ event, bytes });
      pendingCount++; pendingBytes += bytes;
      peakBytes = Math.max(peakBytes, pendingBytes);
      updatePressure();
      pump();
    },
    /** Ожидает подтверждения или окончательного отказа всех принятых событий. */
    drain: (): Promise<void> => pendingCount ? new Promise((resolve) => waiters.push(resolve)) : Promise.resolve(),
  };
}
