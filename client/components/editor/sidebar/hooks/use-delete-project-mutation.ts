/**
 * @fileoverview Хук для удаления проекта с оптимистичными обновлениями
 * Предоставляет мутацию для удаления проекта с немедленным откликом UI
 * и откатом изменений при ошибке
 * @module components/editor/sidebar/hooks/use-delete-project-mutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotProject } from '@shared/schema';

/**
 * Результат работы хука удаления проекта
 */
export interface UseDeleteProjectMutationResult {
  /** Функция для удаления проекта */
  deleteProject: (projectId: number) => void;
  /** Индикатор выполнения операции */
  isPending: boolean;
}

/**
 * Хук для удаления проекта с оптимистичными обновлениями
 * @returns Объект с функцией удаления и состоянием
 *
 * @example
 * ```typescript
 * const { deleteProject, isPending } = useDeleteProjectMutation();
 *
 * // Удаление проекта
 * deleteProject(projectId);
 * ```
 */
export function useDeleteProjectMutation(): UseDeleteProjectMutationResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (projectId: number) => apiRequest('DELETE', `/api/projects/${projectId}`),
    onMutate: async (projectId: number) => {
      // Отменяем текущие запросы для предотвращения race condition
      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: ['/api/projects/list'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${projectId}`] });

      // Сохраняем предыдущие значения для отката
      const previousProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      const previousList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']);

      // Оптимистично удаляем проект из кеша
      if (previousProjects) {
        const updatedProjects = previousProjects.filter(p => p.id !== projectId);
        queryClient.setQueryData<BotProject[]>(['/api/projects'], updatedProjects);
      }

      if (previousList) {
        const updatedList = previousList.filter(p => p.id !== projectId);
        queryClient.setQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list'], updatedList);
      }

      // Удаляем из кеша конкретный проект
      queryClient.removeQueries({ queryKey: [`/api/projects/${projectId}`] });

      // Возвращаем контекст для отката
      return { previousProjects, previousList };
    },
    onSuccess: async () => {
      toast({
        title: "Проект удален",
        description: "Проект успешно удален",
      });
    },
    onError: (_, __, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousProjects) {
        queryClient.setQueryData(['/api/projects'], context.previousProjects);
      }
      if (context?.previousList) {
        queryClient.setQueryData(['/api/projects/list'], context.previousList);
      }

      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    }
  });

  const deleteProject = (projectId: number) => {
    mutation.mutate(projectId);
  };

  return {
    deleteProject,
    isPending: mutation.isPending,
  };
}
