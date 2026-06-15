/**
 * @fileoverview Хук создания новой рассылки
 * @module client/components/editor/broadcast/hooks/use-create-broadcast
 */

import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { NewBroadcastFormData } from '../types';

/**
 * Параметры хука useCreateBroadcast
 */
interface UseCreateBroadcastParams {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена */
  tokenId?: number | null;
  /** Колбэк после успешного создания */
  onSuccess?: (broadcastId: number) => void;
  /** Колбэк для обновления списка */
  refetch?: () => void;
}

/**
 * Хук создания рассылки через POST /api/projects/:projectId/broadcasts.
 * При успехе показывает toast и вызывает refetch.
 *
 * @param params - Параметры хука
 * @returns Мутация создания рассылки
 */
export function useCreateBroadcast({
  projectId,
  tokenId,
  onSuccess,
  refetch,
}: UseCreateBroadcastParams) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: NewBroadcastFormData) => {
      const { audienceType, ...filterFields } = formData.filters;
      // Строим фильтры в зависимости от типа аудитории
      const filters =
        audienceType === 'all' ? {} :
        audienceType === 'tags' ? { tags: filterFields.tags } :
        audienceType === 'date' ? {
          registeredFrom: filterFields.registeredFrom,
          registeredTo: filterFields.registeredTo,
        } :
        audienceType === 'manual' ? { userIds: filterFields.userIds } : {
          activeFrom: filterFields.activeFrom,
          activeTo: filterFields.activeTo,
        };

      // Добавляем groupIds если выбраны группы
      const filtersWithGroups = {
        ...filters,
        ...(filterFields.groupIds?.length ? { groupIds: filterFields.groupIds } : {}),
      };

      const url = tokenId
        ? `/api/projects/${projectId}/broadcasts?tokenId=${tokenId}`
        : `/api/projects/${projectId}/broadcasts`;

      return apiRequest('POST', url, {
        name: formData.name,
        messageText: formData.messageText,
        mediaUrls: formData.mediaUrls ?? [],
        buttons: formData.buttons ?? [],
        filters: filtersWithGroups,
      });
    },
    onSuccess: (data) => {
      toast({ title: 'Рассылка создана', description: 'Рассылка запущена успешно' });
      refetch?.();
      onSuccess?.(data?.id);
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка создания рассылки',
        description: error.message || 'Не удалось создать рассылку',
        variant: 'destructive',
      });
    },
  });
}
