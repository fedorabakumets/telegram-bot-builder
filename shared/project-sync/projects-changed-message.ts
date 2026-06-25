/**
 * @fileoverview Тип сообщения «список проектов владельца изменился».
 * Отправляется сервером на owner-канал `user_<ownerId>` после создания,
 * переименования, переупорядочивания или удаления проекта, чтобы открытый
 * в браузере список проектов инвалидировал react-query и обновился в реальном
 * времени без перезагрузки страницы.
 * @module shared/project-sync/projects-changed-message
 */

/** Причина изменения списка проектов */
export type ProjectsChangedReason = 'created' | 'renamed' | 'reordered' | 'deleted';

/** Сообщение «список проектов владельца изменился» (для live-обновления списка) */
export interface ProjectsChangedMessage {
  /** Тип сообщения */
  type: 'projects-changed';
  /** ID владельца, чей список проектов изменился */
  ownerId: number;
  /** Причина изменения (опционально) */
  reason?: ProjectsChangedReason;
  /** Временная метка отправки (опционально) */
  timestamp?: number;
}

/**
 * Проверяет, что сообщение — projects-changed
 * @param msg - Распарсенное сообщение
 * @returns true если это сигнал об изменении списка проектов
 */
export function isProjectsChangedMessage(msg: unknown): msg is ProjectsChangedMessage {
  return (
    typeof msg === 'object'
    && msg !== null
    && (msg as ProjectsChangedMessage).type === 'projects-changed'
    && typeof (msg as ProjectsChangedMessage).ownerId === 'number'
  );
}
