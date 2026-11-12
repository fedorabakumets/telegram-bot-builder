/** @fileoverview Публичная строка административного списка логических групп воркеров. */
export interface WorkerRuntimeGroup {
  /** Ключ группы без внутренних путей и переменных окружения. */
  workerKey: number;
  /** Число зарегистрированных ботов, включая спящих. */
  registeredBots: number;
  /** Число команд запуска, ожидающих подтверждения. */
  pendingBots: number;
  /** Активные обработчики либо неизвестное значение для старого исполнителя. */
  activeHandlers: number | null;
  /** Фактический лимит загруженных обработчиков; null означает безлимит только при подтверждении. */
  activeHandlerLimit: number | null;
  /** Исполнитель сообщил лимит явно; false отличает старую телеметрию от безлимита. */
  activeHandlerLimitKnown: boolean;
  /** Спящие регистрации Node polling либо неизвестное значение. */
  sleepingBots: number | null;
  /** Боты, ожидающие свободного слота обработчика. */
  waitingBots: number | null;
  /** Память Python этой группы, байты; общий процесс учтён один раз. */
  pythonRssBytes: number | null;
  /** Наличие процесса обработки либо неизвестное значение. */
  hostAlive: boolean | null;
  /** Фактический способ обработки process-ботов. */
  handlerMode: 'shared' | 'isolated' | null;
}
