/**
 * @fileoverview Хук для управления коллабораторами проекта
 *
 * Загружает список коллабораторов через GET и предоставляет
 * методы add/remove для добавления и удаления участников.
 *
 * @module use-collaborators
 */

import { useState, useEffect, useCallback } from 'react';
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
  /** Идёт ли добавление */
  isAdding: boolean;
  /** Идёт ли удаление */
  isRemoving: boolean;
  /** Добавить коллаборатора по Telegram ID */
  add: (userId: number) => Promise<void>;
  /** Удалить коллаборатора по Telegram ID */
  remove: (userId: number) => Promise<void>;
  /** Telegram ID текущего пользователя */
  currentTelegramId: number | null;
}

/**
 * Хук для управления коллабораторами проекта
 *
 * @param projectId - ID проекта
 * @returns Состояние и методы управления коллабораторами
 */
export function useCollaborators(projectId: number): UseCollaboratorsResult {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();
  const { user, isTelegramUser } = useTelegramAuth();

  /** Telegram ID текущего пользователя (null для гостей) */
  const currentTelegramId = user && isTelegramUser(user) ? user.id : null;

  /** Загрузить список коллабораторов */
  const fetchCollaborators = useCallback(async () => {
    if (!currentTelegramId) return;
    setIsLoading(true);
    try {
      const data: CollaboratorsResponse = await apiRequest(
        'GET',
        `/api/bot/projects/${projectId}/collaborators?telegram_id=${currentTelegramId}`,
      );
      setCollaborators(data.items ?? []);
    } catch {
      setCollaborators([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, currentTelegramId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  /**
   * Добавить коллаборатора
   * @param userId - Telegram ID добавляемого пользователя
   */
  const add = useCallback(async (userId: number) => {
    if (!currentTelegramId) return;
    setIsAdding(true);
    try {
      await apiRequest(
        'POST',
        `/api/bot/projects/${projectId}/collaborators?telegram_id=${currentTelegramId}`,
        { user_id: userId },
      );
      toast({ title: 'Добавлено', description: `Коллаборатор ${userId} добавлен` });
      await fetchCollaborators();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось добавить коллаборатора', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  }, [projectId, currentTelegramId, fetchCollaborators, toast]);

  /**
   * Удалить коллаборатора
   * @param userId - Telegram ID удаляемого пользователя
   */
  const remove = useCallback(async (userId: number) => {
    if (!currentTelegramId) return;
    setIsRemoving(true);
    try {
      await apiRequest(
        'DELETE',
        `/api/bot/projects/${projectId}/collaborators/${userId}?telegram_id=${currentTelegramId}`,
      );
      toast({ title: 'Удалено', description: `Коллаборатор ${userId} удалён` });
      await fetchCollaborators();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось удалить коллаборатора', variant: 'destructive' });
    } finally {
      setIsRemoving(false);
    }
  }, [projectId, currentTelegramId, fetchCollaborators, toast]);

  return { collaborators, isLoading, isAdding, isRemoving, add, remove, currentTelegramId };
}
