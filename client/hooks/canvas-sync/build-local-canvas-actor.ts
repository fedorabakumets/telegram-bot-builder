/**
 * @fileoverview Сборка актора холста на клиенте из данных авторизации
 * @module client/hooks/canvas-sync/build-local-canvas-actor
 */

import type { CanvasActor } from '@shared/canvas-sync/canvas-actor';
import type { AppUser } from '@/types/telegram-user';
import { isGuest } from '@/types/telegram-user';

/**
 * Собирает актора для исходящих canvas-sync сообщений
 * @param user - Текущий пользователь приложения
 * @param tabId - ID вкладки
 * @param agentOverride - Явный актор агента (MCP / вкладка агента)
 * @returns CanvasActor для сообщения sync
 */
export function buildLocalCanvasActor(
  user: AppUser | null | undefined,
  tabId: string,
  agentOverride?: CanvasActor,
): CanvasActor {
  if (agentOverride?.kind === 'agent') {
    return {
      ...agentOverride,
      clientId: tabId,
      userId: user && !isGuest(user) ? user.id : agentOverride.userId,
    };
  }

  if (user && !isGuest(user)) {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ')
      || (user.username ? `@${user.username}` : 'Пользователь');
    return {
      kind: 'user',
      id: String(user.id),
      userId: user.id,
      displayName,
      username: user.username,
      clientId: tabId,
    };
  }

  return {
    kind: 'guest',
    id: `guest-${tabId}`,
    displayName: 'Гость',
    clientId: tabId,
  };
}
