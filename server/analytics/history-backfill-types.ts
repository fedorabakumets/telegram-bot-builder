/** @fileoverview Настройки и безопасные агрегированные сообщения фонового переноса истории. */
import type { PoolClient } from 'pg';
/** Операция отдельного контура истории, использующая общую надёжную очередь. */
export interface HistoryBackfillTask {
  /** Ключ межрепличной блокировки этого контура. */ lockKey: number;
  /** Однократный захват конечных областей. */ capture: (client: PoolClient) => Promise<HistoryBackfillScope[]>;
  /** Одна транзакционная пачка с безопасной агрегированной статистикой. */
  execute: (client: PoolClient, project: number, token: number, size: number, through: number) => Promise<{
    /** Область полностью просмотрена. */ complete: boolean;
    /** Безопасные показатели текущей пачки. */ batch: {
      /** Просмотренные строки. */ scanned: number;
      /** Новые факты. */ imported: number;
      /** Пропущенные строки. */ skipped: number;
      /** Причины пропуска без данных человека. */ reasons: Record<string, number>;
    };
  }>;
}
/** Состояние фоновой обработки, без идентификаторов людей и содержимого истории. */
export interface AnalyticsHistoryBackfillLog {
  /** Этап работы. */ event: 'started' | 'waiting' | 'batch' | 'retry' | 'scope_failed' | 'completed' | 'cancelled' | 'failed';
  /** Число областей в запуске. */ scopes?: number;
  /** Число завершённых областей. */ completed?: number;
  /** Число областей, требующих следующего запуска. */ failed?: number;
  /** Номер повторной попытки. */ attempt?: number;
  /** Число просмотренных строк текущей пачки. */ scanned?: number;
  /** Число добавленных событий текущей пачки. */ imported?: number;
  /** Число пропусков текущей пачки. */ skipped?: number;
  /** Агрегированные безопасные причины пропуска. */ reasons?: Record<string, number>;
  /** Только код ошибки, без исходного текста PostgreSQL. */ code?: string;
}
/** Параметры фонового запуска; значения по умолчанию щадят интерактивные запросы. */
export interface AnalyticsHistoryBackfillOptions {
  /** Строк за короткую транзакцию, по умолчанию 100. */ batchSize?: number;
  /** Пауза между пачками, по умолчанию 100 мс. */ pauseMs?: number;
  /** Начальная задержка повтора, по умолчанию 1000 мс. */ retryBaseMs?: number;
  /** Ожидание другой реплики, по умолчанию 5000 мс. */ lockRetryMs?: number;
  /** Число повторов ошибочной области, по умолчанию 3. */ maxRetries?: number;
  /** Приёмник безопасных сообщений, по умолчанию console.info. */ logger?: (event: AnalyticsHistoryBackfillLog) => void;
}
/** Проверенные настройки исполнителя. */
export interface HistoryBackfillSettings {
  /** Размер пачки. */ batchSize: number;
  /** Пауза между пачками. */ pauseMs: number;
  /** Начальная задержка повторов. */ retryBaseMs: number;
  /** Пауза ожидания реплики. */ lockRetryMs: number;
  /** Максимум повторных попыток. */ maxRetries: number;
  /** Безопасное логирование. */ log: (event: AnalyticsHistoryBackfillLog) => void;
}
/** Один конечный диапазон проверенной области проекта и бота. */
export interface HistoryBackfillScope {
  /** Проект. */ project: number;
  /** Бот этого проекта, включая архивный. */ token: number;
  /** Верхний ID на момент старта; новый поток не продлевает очередь. */ through: number;
  /** Число последовательных ошибок текущей пачки. */ failures: number;
  /** Ближайшее время разрешённого повтора. */ retryAt: number;
}
