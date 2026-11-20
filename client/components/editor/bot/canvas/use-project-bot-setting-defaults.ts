/** @fileoverview Запрос и запись расширенных настроек проекта для ботов. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { toast } from '@/hooks/use-toast';
import type { MessagesRetentionDays } from '@shared/messages-retention';
import type { LogLevel } from '../card/log-level-options';

/** Сохранённые проектные значения для наследуемых настроек. */
export interface ProjectBotSettingDefaults {
  /** Сохранение входящих медиа. */
  saveIncomingMedia: 0 | 1;
  /** Срок хранения сообщений в днях; 0 означает отсутствие ограничения. */
  messagesRetentionDays: MessagesRetentionDays;
  /** Кэширование контента. */
  contentCache: 0 | 1;
  /** Уровень детализации журнала. */
  logLevel: LogLevel;
  /** Обработка незнакомых сообщений и нажатий. */
  catchAllHandlers: 0 | 1;
  /** Отслеживание блокировок бота пользователями. */
  trackUserBlocks: 0 | 1;
  /** Отслеживание участия бота в группах. */
  trackGroupMembership: 0 | 1;
  /** Защита сообщений от пересылки и сохранения. */
  protectContent: 0 | 1;
  /** Проектный базовый адрес webhook; null означает адрес сервера. */
  webhookBaseUrl: string | null;
}

/**
 * Загружает значения проекта и применяет частичное обновление.
 * @param projectId - Идентификатор проекта.
 * @returns Запрос сохранённых значений и мутация.
 */
export function useProjectBotSettingDefaults(projectId: number) {
  const queryClient = useQueryClient();
  const projectUrl = `/api/projects/${projectId}`;
  const url = `${projectUrl}/bot/setting-defaults`;
  const query = useQuery<ProjectBotSettingDefaults>({
    queryKey: [url],
    queryFn: () => apiRequest('GET', url),
  });
  const save = useMutation({
    mutationFn: (patch: Partial<ProjectBotSettingDefaults>): Promise<ProjectBotSettingDefaults> =>
      apiRequest('PUT', url, patch),
    onSuccess: (data, changes) => {
      /** Срок хранения учитывает очередная очистка без перезапуска бота. */
      toast({ title: 'Настройки сохранены', description: Object.keys(changes).some((key) => key !== 'messagesRetentionDays')
        ? 'Изменения в работе ботов вступят в силу при следующем запуске.' : undefined });
      queryClient.setQueryData([url], data);
      void queryClient.invalidateQueries({ queryKey: [`${projectUrl}/tokens`] });
      void queryClient.invalidateQueries({ queryKey: [projectUrl] });
      void queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
  return { query, save };
}
