/**
 * @fileoverview Типы событий проекта, передаваемых через WebSocket
 * @description Реэкспорт единого контракта из shared (источник правды).
 * @module server/terminal/ProjectEvent
 */

export type {
  BroadcastProgressEvent,
  ProjectEvent,
  ProjectEventType,
  StartOfflineProgressPayload,
  StartOfflineProgressStatus,
  StartOfflineSource,
  TokenUpdatedEventData,
  TokenUpdatedFieldKey,
  TokenUpdatedPayload,
  TokenUpdatedSource,
  TokenLikeForUpdatedPayload,
} from '@shared/project-sync/project-event';

export {
  TOKEN_UPDATED_FIELD_KEYS,
  isProjectEvent,
  pickChangedSettings,
  shouldSkipBridgedProjectEvent,
  toStartOfflineProgressPayload,
  toTokenUpdatedPayload,
} from '@shared/project-sync/project-event';
