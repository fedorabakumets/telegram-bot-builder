/** @fileoverview Безопасные сведения о выбранных и фактических режимах отдельных ботов. */
export type WorkerBotRuntimeMode = 'direct' | 'ondemand' | 'process';
/** Наблюдаемое состояние сценария; регистрация сама по себе не означает загрузку. */
export type WorkerBotRuntimeActivity = 'active' | 'sleeping' | 'waiting' | 'starting' | 'stopped' | 'error' | 'unknown';
/** Строка административного списка без токенов и переменных окружения. */
export interface WorkerBotRuntimeRow {
  /** Идентификатор записи бота. */
  tokenId: number;
  /** Идентификатор проекта. */
  projectId: number;
  /** Название проекта. */
  projectName: string;
  /** Отображаемое имя бота. */
  botName: string;
  /** Публичное имя пользователя Telegram. */
  botUsername: string | null;
  /** Собственный выбор; null означает наследование. */
  configuredMode: WorkerBotRuntimeMode | null;
  /** Режим следующего запуска с учётом общего значения и списка исключений. */
  effectiveMode: WorkerBotRuntimeMode | null;
  /** Ошибка настройки; null означает корректный выбор режима. */
  configurationError: string | null;
  /** Источник выбранного режима. */
  source: 'bot' | 'server' | 'default';
  /** Настроенный транспорт получения обновлений. */
  launchMode: 'polling' | 'webhook';
  /** Сохранённый статус экземпляра. */
  status: string;
  /** Последнее намерение пользователя. */
  desiredStatus: string | null;
  /** Режим подтверждённого запуска; null означает отсутствие телеметрии. */
  actualMode: WorkerBotRuntimeMode | null;
  /** Фактическая логическая группа, если она известна. */
  workerKey: number | null;
  /** Наблюдаемое состояние конкретного сценария. */
  activity: WorkerBotRuntimeActivity;
  /** Нужен перезапуск; null при неизвестном фактическом режиме работающего бота. */
  restartRequired: boolean | null;
  /** Совместимость выбранного режима с транспортом. */
  transportCompatible: boolean;
}
/** Страница ботов с единым снимком исполнителя для всех строк. */
export interface WorkerBotRuntimePage {
  /** Строки текущей страницы. */
  rows: WorkerBotRuntimeRow[];
  /** Всего строк после применения фильтров. */
  total: number;
  /** Номер страницы, начиная с единицы. */
  page: number;
  /** Максимальное число строк страницы. */
  pageSize: number;
  /** Время успешного снимка исполнителя. */
  sampledAt: string | null;
  /** Доступна ли свежая телеметрия исполнителя. */
  runtimeAvailable: boolean;
}
