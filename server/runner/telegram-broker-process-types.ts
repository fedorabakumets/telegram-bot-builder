/** @fileoverview Контракты единственного встроенного брокера на процесс исполнителя. */
import type { spawn } from 'node:child_process';

/** Подготовка процесса без передачи сессий в потребительские воркеры. */
export interface TelegramBrokerProcessOptions {
  /** Интерпретатор, используемый исполнителем. */ pythonPath: string;
  /** Путь воркера определяет соседний скрипт брокера по умолчанию. */ workerScript: string;
  /** Окружение управляющего процесса, не окружение бота. */ env?: NodeJS.ProcessEnv;
  /** Отмена подготовки до объявления готовности исполнителя. */ signal?: AbortSignal;
  /** Утрата брокера требует остановки потребителей, без автоматического перезапуска. */ onUnexpectedExit: (error: Error) => void;
  /** Подменяемый запуск для проверок без Python и Telegram. */ spawnProcess?: typeof spawn;
  /** Максимальное ожидание готовности; по умолчанию 30 секунд. */ startupTimeoutMs?: number;
  /** Бюджет штатного закрытия с ожиданием запросов; по умолчанию 70 секунд. */ shutdownTimeoutMs?: number;
  /** Бюджет после SIGTERM; по умолчанию 10 секунд. */ terminateTimeoutMs?: number;
  /** Бюджет после SIGKILL; по умолчанию 5 секунд. */ killTimeoutMs?: number;
}

/** Закрытие вызывается только после остановки потребителей общей сессии. */
export interface TelegramBrokerProcess {
  /** Закрывает собственный процесс и дожидается подтверждения его завершения. */ close: () => Promise<void>;
}
