/**
 * @fileoverview Хук для управления коллабораторами проекта
 *
 * Загружает список коллабораторов через GET и предоставляет
 * методы add/remove для добавления и удаления участников.
 *
 * @module use-collaborators
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import { useTelegramAuth } from '@/components/editor/header/hooks/use-telegram-auth';
import type { ProjectCollaborator } from '@shared/schema';

/**
 * Ответ API на запрос списка коллабораторов
 */
interface CollaboratorsResponse {
  /** Список коллабораторов */
  items: ProjectCollaborator[];
  /** Общее количество */
  count: number;
}

/**
 * Результат хука useCollaborators
 */
export interface UseCollaboratorsResult {
  /** Список коллабораторов */
  collaborators: ProjectCollaborator[];
  /** Идёт ли загрузка */
  isLoading: boolean;
  /** Есть ошибка получения участников */
  isError: boolean;
  /** Повторить загрузку списка */
  refetch: () => Promise<unknown>;
  /** Идёт ли добавление */
  isAdding: boolean;
  /** Идёт ли удаление */
  isRemoving: boolean;
  /** Добавить коллаборатора по Telegram ID */
  add: (userId: number) => Promise<boolean>;
  /** Удалить коллаборатора по Telegram ID */
  remove: (userId: number) => Promise<void>;
  /** Telegram ID текущего пользователя */
  currentTelegramId: number | null;
}

/**
 * Извлекает сообщение о доступе или ошибке из ответа сервера.
 * @param error - Ошибка запроса.
 * @param fallback - Сообщение при отсутствии деталей.
 * @returns Сообщение для уведомления.
 */
function collaboratorError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const detail = (error as Error & { /** Ошибка в ответе API. */ error?: unknown }).error;
  if (detail === 'UNAUTHORIZED') return 'Войдите, чтобы управлять доступом к проекту';
  return typeof detail === 'string' ? detail : fallback;
}

/**
 * Хук для управления коллабораторами проекта
 *
 * @param projectId - ID проекта
 * @param loadRoster - Нужно ли загружать отдельный список приглашённых участников
 * @returns Состояние и методы управления коллабораторами
 */
export function useCollaborators(projectId: number, loadRoster = true): UseCollaboratorsResult {
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isTelegramUser } = useTelegramAuth();

  /** Telegram ID текущего пользователя (null для гостей) */
  const currentTelegramId = user && isTelegramUser(user) ? user.id : null;

  const endpoint = `/api/bot/projects/${projectId}/collaborators`;
  const { data, isLoading, isError, refetch } = useQuery<CollaboratorsResponse>({
    queryKey: [endpoint, currentTelegramId],
    queryFn: () => apiRequest('GET', endpoint),
    enabled: loadRoster && projectId > 0 && currentTelegramId !== null,
  });

  /** Обновляет список участников и их профили после изменения доступа. */
  const invalidateLists = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [endpoint] }),
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'collaborators'] }),
    ]);
  }, [endpoint, projectId, queryClient]);

  /**
   * Добавить коллаборатора
   * @param userId - Telegram ID добавляемого пользователя
   * @returns Успешно ли выдан доступ
   */
  const add = useCallback(async (userId: number) => {
    if (!currentTelegramId) return false;
    setIsAdding(true);
    try {
      await apiRequest('POST', endpoint, { user_id: userId });
      toast({ title: 'Участник добавлен', description: `Telegram ID ${userId}` });
      await invalidateLists();
      return true;
    } catch (error) {
      toast({ title: 'Ошибка', description: collaboratorError(error, 'Не удалось добавить участника'), variant: 'destructive' });
      return false;
    } finally {
      setIsAdding(false);
    }
  }, [endpoint, currentTelegramId, invalidateLists, toast]);

  /**
   * Удалить коллаборатора
   * @param userId - Telegram ID удаляемого пользователя
   */
  const remove = useCallback(async (userId: number) => {
    if (!currentTelegramId) return;
    setIsRemoving(true);
    try {
      await apiRequest('DELETE', `${endpoint}/${userId}`);
      toast({ title: 'Доступ участника закрыт', description: `Telegram ID ${userId}` });
      await invalidateLists();
    } catch (error) {
      toast({ title: 'Ошибка', description: collaboratorError(error, 'Не удалось удалить участника'), variant: 'destructive' });
    } finally {
      setIsRemoving(false);
    }
  }, [endpoint, currentTelegramId, invalidateLists, toast]);

  return { collaborators: data?.items ?? [], isLoading, isError, refetch, isAdding, isRemoving, add, remove, currentTelegramId };
}
