/** @fileoverview Безопасные агрегаты памяти и задержек административного монитора. */
export interface MetricDistribution {
  /** Число последних измерений в ограниченном окне. */
  count: number;
  /** Медиана в миллисекундах. */
  p50Ms: number;
  /** Девяносто пятый процентиль в миллисекундах. */
  p95Ms: number;
  /** Последний замер в миллисекундах. */
  lastMs: number;
}
export interface WorkerMetricPoint {
  /** Время фактического чтения исполнителя. */
  sampledAt: string;
  /** RSS общего Node, байты; отсутствие измерения обозначается null. */
  nodeRssBytes: number | null;
  /** Сумма RSS Python, байты; общие страницы могут учитываться повторно. */
  pythonRssBytes: number | null;
  /** Активные обработчики Node polling либо неизвестное значение. */
  activeHandlers: number | null;
  /** Спящие регистрации Node polling либо неизвестное значение. */
  sleepingBots: number | null;
  /** Боты, ожидающие слот обработчика, а не количество сообщений. */
  waitingBots: number | null;
}
export interface WorkerMetrics extends Omit<WorkerMetricPoint, 'sampledAt'> {
  /** Доступность свежего снимка; история сама по себе не подтверждает связь. */
  status: 'live' | 'unavailable';
  /** Последний успешный снимок; null при недоступном исполнителе. */
  sampledAt: string | null;
  /** Источник измерения. */
  source: 'runner-inspect';
  /** История собирается только при наблюдении через административную панель. */
  historyMode: 'while-observed';
  /** Не более 120 точек с интервалом не меньше десяти секунд. */
  history: WorkerMetricPoint[];
  /** Агрегаты пробуждения сценария и времени от получения до обработки. */
  latency: { startupMs: MetricDistribution | null; handlingMs: MetricDistribution | null };
}
