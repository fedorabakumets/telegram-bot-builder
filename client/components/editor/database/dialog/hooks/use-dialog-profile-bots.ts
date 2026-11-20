/** @fileoverview Загрузка общего списка ботов личного профиля независимо от фильтра вкладки. */
import { useQuery } from '@tanstack/react-query';
import type { DialogProfileBotsData } from '@shared/dialog-profile-bots';

/**
 * Переиспользует один ответ для общих дат профиля и списка его ботов.
 * @param projectId - Проект профиля
 * @param userId - Telegram ID человека
 * @returns Состояние чтения сохранённого общего профиля
 */
export function useDialogProfileBots(projectId: number, userId: string | number) {
  const id = String(userId);
  return useQuery<DialogProfileBotsData>({
    queryKey: ['dialog-profile-bots', projectId, id],
    enabled: projectId > 0 && /^[1-9]\d*$/.test(id),
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/projects/${projectId}/dialog-users/${encodeURIComponent(id)}/profile-bots`, {
        credentials: 'include', signal,
      });
      if (!response.ok) throw new Error('Не удалось загрузить ботов пользователя');
      return response.json();
    },
  });
}
