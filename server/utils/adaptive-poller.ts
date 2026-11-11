/**
 * @fileoverview Последовательный опрос с ограниченным замедлением при отсутствии работы.
 */

/** Настройки последовательного опроса. */
export interface AdaptivePollerOptions {
  /** Проверка: истина означает наличие работы и сбрасывает задержку. */
  poll: () => Promise<boolean>;
  /** Обработчик ошибки одного прохода. */
  onError: (error: unknown) => void;
  /** Минимальная пауза после завершения прохода, в миллисекундах. */
  intervalMs: number;
  /** Максимальная пауза пустой очереди, в миллисекундах. */
  maxIntervalMs: number;
}

/**
 * Запускает опрос без пересечения проходов и увеличивает паузу пустой очереди.
 * @param options - Проверка, обработчик ошибок и пределы задержки
 * @returns Остановка будущих проверок, включая отложенный проход после текущего
 */
export function startAdaptivePoller(options: AdaptivePollerOptions): () => void {
  const base = Math.max(1, options.intervalMs);
  const maximum = Math.max(base, options.maxIntervalMs);
  let delay = base;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Выполняет одну проверку и планирует следующую только после её завершения. */
  async function tick(): Promise<void> {
    let hasWork = false;
    try {
      hasWork = await options.poll();
    } catch (error) {
      options.onError(error);
    }
    if (stopped) return;
    delay = hasWork ? base : Math.min(maximum, delay * 2);
    timer = setTimeout(() => void tick(), delay);
    timer.unref?.();
  }

  void tick();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
