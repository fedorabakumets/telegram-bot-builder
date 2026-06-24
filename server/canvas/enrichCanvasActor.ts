/**
 * @fileoverview Обогащение актора холста данными сессии (источник правды — сервер)
 * @module server/canvas/enrichCanvasActor
 */

import type { TelegramUserDB } from '@shared/schema';
import { isCanvasActor, type CanvasActor } from '../../shared/canvas-sync/canvas-actor';

/**
 * Собирает displayName из записи пользователя Telegram
 * @param user - Пользователь из сессии
 * @returns Имя для UI
 */
function displayNameFromUser(user: TelegramUserDB): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (user.username) return `@${user.username}`;
  return 'Пользователь';
}

/**
 * Обогащает актора из клиента данными сессии.
 * kind=agent сохраняется; user/guest перезаписываются сервером.
 * @param sessionUser - Пользователь из Express-сессии
 * @param clientActor - Актор от клиента (может быть неполным)
 * @param tabId - ID вкладки отправителя
 * @returns Проверенный актор для relay
 */
export function enrichCanvasActor(
  sessionUser: TelegramUserDB | undefined,
  clientActor: unknown,
  tabId: string,
): CanvasActor {
  const parsed = isCanvasActor(clientActor) ? clientActor : null;

  if (parsed?.kind === 'agent') {
    return {
      kind: 'agent',
      id: parsed.sessionId ?? parsed.id,
      sessionId: parsed.sessionId ?? parsed.id,
      userId: sessionUser?.id,
      displayName: parsed.displayName || 'ИИ-агент',
      username: sessionUser?.username ?? undefined,
      clientId: tabId,
    };
  }

  if (sessionUser?.id != null) {
    return {
      kind: 'user',
      id: String(sessionUser.id),
      userId: sessionUser.id,
      displayName: displayNameFromUser(sessionUser),
      username: sessionUser.username ?? undefined,
      clientId: tabId,
    };
  }

  return {
    kind: 'guest',
    id: parsed?.id ?? `guest-${tabId}`,
    displayName: parsed?.displayName ?? 'Гость',
    clientId: tabId,
  };
}
