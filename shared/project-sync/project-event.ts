/**
 * @fileoverview Типы событий проекта (WebSocket terminal / live UI)
 * @description Единый контракт для сервера и клиента. Payload token-updated
 * не содержит секретов (token, webhookSecretToken, userbot*).
 * @module shared/project-sync/project-event
 */

/** Источник изменения настроек токена (аудит, без PII) */
export type TokenUpdatedSource = 'ui' | 'mcp' | 'api';

/**
 * Безопасный снимок токена для WS token-updated (явный whitelist).
 * Не включает token, webhookSecretToken, userbotApiHash, userbotSessionString.
 */
export interface TokenUpdatedPayload {
  /** ID токена */
  id: number;
  /** ID проекта */
  projectId: number;
  /** Пользовательское имя */
  name: string;
  /** Username бота */
  botUsername: string | null;
  /** Имя бота */
  botFirstName: string | null;
  /** Токен по умолчанию */
  isDefault: number | null;
  /** Активность */
  isActive: number | null;
  /** Срок хранения сообщений (дни), 0 = безлимит */
  messagesRetentionDays: number;
  /** Автоперезапуск */
  autoRestart: number | null;
  /** Макс. попыток рестарта */
  maxRestartAttempts: number | null;
  /** Уровень логов */
  logLevel: string | null;
  /** Защита контента */
  protectContent: number | null;
  /** Сохранять входящие медиа */
  saveIncomingMedia: number | null;
  /** Catch-all обработчики */
  catchAllHandlers: number | null;
  /** Живой кэш контента */
  contentCache: number | null;
  /** Режим запуска */
  launchMode: string | null;
  /** Базовый URL webhook (не секрет) */
  webhookBaseUrl: string | null;
  /** Включён ли userbot */
  userbotEnabled: number | null;
}

/** Данные события token-updated */
export interface TokenUpdatedEventData {
  /** Какие поля изменились */
  changedFields: string[];
  /** Безопасный снимок токена после update */
  token: TokenUpdatedPayload;
  /** Источник изменения */
  source?: TokenUpdatedSource;
}

/** Типы событий проекта на terminal/project WS */
export type ProjectEventType =
  | 'token-created'
  | 'token-deleted'
  | 'token-updated'
  | 'bot-started'
  | 'bot-stopped'
  | 'bot-error'
  | 'new-message'
  | 'message-deleted'
  | 'message-edited'
  | 'new-user'
  | 'broadcast-progress'
  | 'start-offline-progress'
  | 'stdout'
  | 'stderr'
  | 'status';

/** Источник bulk-операции старта офлайн-ботов */
export type StartOfflineSource = 'ui' | 'mcp' | 'api';

/** Статус bulk-запуска офлайн-ботов */
export type StartOfflineProgressStatus = 'running' | 'done';

/**
 * Безопасный payload прогресса start-offline-all (без секретов).
 * Не включает token, env, cmdline процесса.
 */
export interface StartOfflineProgressPayload {
  /** Успешно запущено */
  started: number;
  /** Ошибок запуска */
  failed: number;
  /** Пропущено (уже running) */
  skipped: number;
  /** Всего кандидатов (offline на старте операции) */
  total: number;
  /** Текущий обрабатываемый tokenId */
  currentTokenId?: number;
  /** Фаза операции */
  status: StartOfflineProgressStatus;
  /** Источник вызова */
  source?: StartOfflineSource;
}

/**
 * Собирает whitelist payload прогресса start-offline (без секретов)
 * @param input - Счётчики и статус
 * @returns Безопасный payload для WS
 */
export function toStartOfflineProgressPayload(
  input: StartOfflineProgressPayload,
): StartOfflineProgressPayload {
  return {
    started: input.started,
    failed: input.failed,
    skipped: input.skipped,
    total: input.total,
    currentTokenId: input.currentTokenId,
    status: input.status,
    source: input.source,
  };
}

/**
 * Событие проекта, рассылаемое подключённым клиентам
 */
export interface ProjectEvent {
  /** Тип события */
  type: ProjectEventType;
  /** Идентификатор проекта */
  projectId: number;
  /** ID токена (для событий бота/настроек) */
  tokenId?: number;
  /** Дополнительные данные */
  data?: unknown;
  /** Временная метка ISO */
  timestamp: string;
  /** Уникальный id события (anti-loop / дедуп) */
  eventId?: string;
  /** ID инстанса Node, опубликовавшего в Redis (anti-loop) */
  originInstanceId?: string;
  /** Содержимое лога (stdout/stderr) */
  content?: string;
  /** ID записи bot_logs */
  logId?: number;
}

/**
 * Событие прогресса рассылки (расширенный data-контракт)
 */
export interface BroadcastProgressEvent {
  /** Тип события */
  type: 'broadcast-progress';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор рассылки */
  broadcastId: number;
  /** Количество отправленных сообщений */
  sentCount: number;
  /** Количество доставленных сообщений */
  deliveredCount: number;
  /** Количество ошибок */
  failedCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Текущий статус рассылки */
  status: 'running' | 'stopped' | 'done' | 'failed';
  /** Аварийная остановка из‑за недействительного токена */
  abortReason?: 'unauthorized';
}

/** Поля токена, допустимые в TokenUpdatedPayload / changedFields */
export const TOKEN_UPDATED_FIELD_KEYS = [
  'name',
  'botUsername',
  'botFirstName',
  'isDefault',
  'isActive',
  'messagesRetentionDays',
  'autoRestart',
  'maxRestartAttempts',
  'logLevel',
  'protectContent',
  'saveIncomingMedia',
  'catchAllHandlers',
  'contentCache',
  'launchMode',
  'webhookBaseUrl',
  'userbotEnabled',
] as const;

/** Ключ поля из whitelist настроек */
export type TokenUpdatedFieldKey = (typeof TOKEN_UPDATED_FIELD_KEYS)[number];

/**
 * Минимальные поля записи токена для сборки безопасного payload
 */
export type TokenLikeForUpdatedPayload = {
  id: number;
  projectId: number;
  name: string;
  botUsername?: string | null;
  botFirstName?: string | null;
  isDefault?: number | null;
  isActive?: number | null;
  messagesRetentionDays?: number | null;
  autoRestart?: number | null;
  maxRestartAttempts?: number | null;
  logLevel?: string | null;
  protectContent?: number | null;
  saveIncomingMedia?: number | null;
  catchAllHandlers?: number | null;
  contentCache?: number | null;
  launchMode?: string | null;
  webhookBaseUrl?: string | null;
  userbotEnabled?: number | null;
};

/**
 * Собирает безопасный снимок токена для WS (без секретов)
 * @param token - Запись токена из БД или DTO
 * @returns Whitelist-payload
 */
export function toTokenUpdatedPayload(token: TokenLikeForUpdatedPayload): TokenUpdatedPayload {
  return {
    id: token.id,
    projectId: token.projectId,
    name: token.name,
    botUsername: token.botUsername ?? null,
    botFirstName: token.botFirstName ?? null,
    isDefault: token.isDefault ?? null,
    isActive: token.isActive ?? null,
    messagesRetentionDays: token.messagesRetentionDays ?? 0,
    autoRestart: token.autoRestart ?? null,
    maxRestartAttempts: token.maxRestartAttempts ?? null,
    logLevel: token.logLevel ?? null,
    protectContent: token.protectContent ?? null,
    saveIncomingMedia: token.saveIncomingMedia ?? null,
    catchAllHandlers: token.catchAllHandlers ?? null,
    contentCache: token.contentCache ?? null,
    launchMode: token.launchMode ?? null,
    webhookBaseUrl: token.webhookBaseUrl ?? null,
    userbotEnabled: token.userbotEnabled ?? null,
  };
}

/**
 * Сравнивает два снимка и возвращает имена изменившихся whitelist-полей
 * @param before - Состояние до update
 * @param after - Состояние после update
 * @returns Список ключей changedFields
 */
export function pickChangedSettings(
  before: TokenLikeForUpdatedPayload | null | undefined,
  after: TokenLikeForUpdatedPayload,
): TokenUpdatedFieldKey[] {
  const afterPayload = toTokenUpdatedPayload(after);
  if (!before) {
    return [...TOKEN_UPDATED_FIELD_KEYS];
  }
  const beforePayload = toTokenUpdatedPayload(before);
  const changed: TokenUpdatedFieldKey[] = [];
  for (const key of TOKEN_UPDATED_FIELD_KEYS) {
    if (beforePayload[key] !== afterPayload[key]) {
      changed.push(key);
    }
  }
  return changed;
}

/**
 * Нужно ли пропустить bridged-событие (своё же из Redis — anti-loop)
 * @param event - Событие из Redis
 * @param localInstanceId - ID текущего инстанса Node
 * @returns true если событие публиковал этот же инстанс
 */
export function shouldSkipBridgedProjectEvent(
  event: Pick<ProjectEvent, 'originInstanceId'>,
  localInstanceId: string,
): boolean {
  return Boolean(event.originInstanceId && event.originInstanceId === localInstanceId);
}

/**
 * Проверяет, что сообщение — ProjectEvent с известным type
 * @param msg - Распарсенное сообщение
 * @returns true если похоже на ProjectEvent
 */
export function isProjectEvent(msg: unknown): msg is ProjectEvent {
  return (
    typeof msg === 'object'
    && msg !== null
    && typeof (msg as ProjectEvent).type === 'string'
    && typeof (msg as ProjectEvent).projectId === 'number'
  );
}
