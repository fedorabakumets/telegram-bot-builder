/**
 * @fileoverview Singleton-модуль управления восстановлением серверной сессии
 * @module utils/session-restore
 */

import { queryClient } from '@/queryClient';

/**
 * Данные пользователя из localStorage
 */
export interface StoredUser {
  /** Уникальный идентификатор пользователя Telegram */
  id: number;
  /** Имя пользователя */
  firstName: string;
  /** Фамилия пользователя */
  lastName?: string;
  /** Username в Telegram */
  username?: string;
  /** URL аватара */
  photoUrl?: string;
}

/** Текущий промис восстановления сессии — null если ещё не запускался */
let restorePromise: Promise<void> | null = null;

/**
 * Запускает восстановление серверной сессии через POST /api/auth/telegram.
 * Гарантирует что fetch выполняется ровно один раз — все последующие вызовы
 * возвращают тот же промис.
 *
 * @param user - Данные пользователя из localStorage
 * @returns Промис, завершающийся после восстановления сессии
 */
export function restoreSession(user: StoredUser): Promise<void> {
  if (restorePromise !== null) {
    return restorePromise;
  }

  restorePromise = fetch('/api/auth/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      photo_url: user.photoUrl,
    }),
  })
    .then(() => {
      // Инвалидируем кеш проектов один раз после восстановления сессии.
      // Используем invalidateQueries вместо removeQueries — не вызывает немедленный рефетч,
      // только помечает данные устаревшими для следующего обращения.
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
    })
    .catch(e => {
      console.error('Ошибка восстановления серверной сессии:', e);
    });

  return restorePromise;
}

/**
 * Сбрасывает промис восстановления сессии.
 * Вызывается при logout — чтобы при следующем логине сессия восстанавливалась заново.
 */
export function resetSessionRestore(): void {
  restorePromise = null;
}
