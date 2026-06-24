/**
 * @fileoverview Идентификация актора изменений на холсте (человек, агент, гость)
 * @module shared/canvas-sync/canvas-actor
 */

/** Тип актора синхронизации холста */
export type CanvasActorKind = 'user' | 'agent' | 'guest';

/** Актор — кто вносит изменения на холсте */
export interface CanvasActor {
  /** Тип актора */
  kind: CanvasActorKind;
  /** Стабильный ID: userId, agent-session или guest id */
  id: string;
  /** Telegram user id (для kind=user) */
  userId?: number;
  /** Имя для UI: «Вася», «ИИ-агент» */
  displayName: string;
  /** @username в Telegram */
  username?: string;
  /** ID сессии агента (kind=agent) */
  sessionId?: string;
  /** ID вкладки/клиента отправителя */
  clientId?: string;
}

/**
 * Проверяет, что значение похоже на CanvasActor
 * @param value - Проверяемое значение
 * @returns true если структура актора валидна
 */
export function isCanvasActor(value: unknown): value is CanvasActor {
  if (typeof value !== 'object' || value === null) return false;
  const a = value as CanvasActor;
  return (
    (a.kind === 'user' || a.kind === 'agent' || a.kind === 'guest')
    && typeof a.id === 'string'
    && typeof a.displayName === 'string'
  );
}

/**
 * Форматирует подпись актора для UI
 * @param actor - Актор изменения
 * @returns Человекочитаемая подпись
 */
export function formatCanvasActorLabel(actor: CanvasActor): string {
  if (actor.kind === 'agent') {
    return actor.displayName || 'ИИ-агент';
  }
  if (actor.username) {
    return `@${actor.username}`;
  }
  return actor.displayName;
}

/**
 * Создаёт актора для ИИ-агента (MCP, вкладка агента)
 * @param options - Параметры сессии агента
 * @returns CanvasActor kind=agent
 */
export function buildAgentCanvasActor(options: {
  sessionId: string;
  displayName?: string;
  userId?: number;
  clientId?: string;
}): CanvasActor {
  return {
    kind: 'agent',
    id: options.sessionId,
    sessionId: options.sessionId,
    userId: options.userId,
    displayName: options.displayName ?? 'ИИ-агент',
    clientId: options.clientId,
  };
}
