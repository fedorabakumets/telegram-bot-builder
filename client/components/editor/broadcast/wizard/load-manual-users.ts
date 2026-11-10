/** @fileoverview Полная постраничная загрузка пользователей для ручного выбора рассылки. */
import { buildUsersApiUrl } from '@/components/editor/database/utils';
import type { UserBotData } from '@shared/schema';

/** Страница пользователей, возвращаемая сервером. */
interface UsersPage {
  /** Пользователи страницы. */
  users: UserBotData[];
  /** Общее число записей. */
  total: number;
  /** Наличие следующей страницы. */
  hasMore: boolean;
}

/**
 * Загружает все страницы и убирает повторяющиеся Telegram ID.
 * @param projectId - Проект аудитории
 * @param tokenId - Выбранный бот
 * @param signal - Сигнал отмены при закрытии или смене проекта
 * @returns Полный список пользователей без повторов
 */
export async function loadManualUsers(projectId: number, tokenId?: number | null, signal?: AbortSignal): Promise<UserBotData[]> {
  const users = new Map<string, UserBotData>();
  let offset = 0;
  while (true) {
    const url = buildUsersApiUrl(`/api/projects/${projectId}/users`, tokenId, {
      limit: '1000', offset: String(offset),
    });
    const response = await fetch(url, { credentials: 'include', signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const page: UsersPage = await response.json();
    for (const user of page.users) users.set(String(user.userId), user);
    offset += page.users.length;
    if (!page.hasMore && offset >= page.total) return [...users.values()];
    if (page.users.length === 0) throw new Error('Не удалось загрузить полную аудиторию');
  }
}
