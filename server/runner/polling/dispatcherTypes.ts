/** @fileoverview Контракты диспетчера временных обработчиков без постоянного Python. */

/** Общий процесс допускает любое число сценариев; отдельные процессы ограничиваются числом. */
export type DispatcherCapacity = number | { /** Отсутствие фиксированного ограничения. */ kind: "unlimited" };

/** Настройки зарегистрированного бота; секреты не попадают в счётчики. */
export interface PollingBot {
  /** Внешний webhook вместо запросов getUpdates; регистрацией управляет Node. */
  webhook?: { /** Полный публичный адрес Telegram. */ url: string; /** Секрет проверки Telegram. */ secret: string };
  /** Идентификатор токена. */
  tokenId: number;
  /** Секрет Telegram. */
  token: string;
  /** Путь проверенной сборки. */
  botFile: string;
  /** Переменные сценария. */
  env: Record<string, string>;
  /** Идентификатор проекта. */
  projectId: number;
  /** Простой обработчика в секундах. */
  idleTimeout: number;
  /** Ключ логического воркера. */
  workerKey: string;
  /** Экземпляр логического воркера. */
  instance: string;
}

/** Минимальный жизненный цикл временного процесса. */
export interface PollingChild {
  /** Завершение процесса, включая аварийное. */
  done: Promise<unknown>;
  /** Штатно завершает процесс и дожидается выхода. */
  stop(): Promise<void>;
}

/** Зависимости, подменяемые при проверке конкурентного исполнения. */
export interface DispatcherDependencies {
  /** Передаёт проверенную причину отказа до сообщения завершения регистрации. */
  onError?(bot: PollingBot, error: unknown): void;
  /** Проверяет наличие сохранённого обновления без удаления. */
  hasPending(bot: PollingBot): Promise<boolean>;
  /** Принимает обновления, сохраняя их до вызова пробуждения. */
  receive(bot: PollingBot, signal: AbortSignal, wake: () => void, ready: () => void): Promise<void>;
  /** Создаёт обработчик; отмена обязана завершать даже запуск процесса. */
  startChild(bot: PollingBot, signal: AbortSignal): Promise<PollingChild>;
  /** Передаёт логическое состояние бота панели. */
  lifecycle(bot: PollingBot, state: "started" | "stopped" | "error"): void;
}

/** Регистрация и операции, ещё не завершённые при остановке. */
export interface DispatchEntry {
  /** Параметры бота. */
  bot: PollingBot;
  /** Отмена приёмника и запуска обработчика. */
  abort: AbortController;
  /** Отмена запуска и работы обработчика до освобождения polling-блокировки. */
  childAbort: AbortController;
  /** Запрещает новые запуски при освобождении блокировки приёмника. */
  quiescing: boolean;
  /** Фатальная ошибка завершает регистрацию вместо автоматического перезапуска. */
  failed: boolean;
  /** Работа приёмника. */
  receiver?: Promise<void>;
  /** Работа временного обработчика. */
  task?: Promise<void>;
  /** Запущенный процесс. */
  child?: PollingChild;
  /** Требуется повторно проверить сохранённую очередь. */
  pending: boolean;
  /** Панель уже получила подтверждение регистрации. */
  ready: boolean;
  /** Пауза повторного запуска после ошибки. */
  retry?: ReturnType<typeof setTimeout>;
}
