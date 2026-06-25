/**
 * @fileoverview Хук для дублирования проекта
 * Предоставляет мутацию для создания полной копии проекта-источника
 * (без bot token) и добавления копии в кэш списка проектов
 * @module components/editor/sidebar/hooks/use-duplicate-project-mutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotProject } from '@shared/schema';

/**
 * Элемент списка проектов (без поля `data`)
 */
type ProjectListItem = Omit<BotProject, 'data'>;

/**
 * Результат работы хука дублирования проекта
 */
export interface UseDuplicateProjectMutationResult {
  /** Функция для дублирования проекта */
  duplicateProject: (projectId: number) => void;
  /** Индикатор выполнения операции */
  isPending: boolean;
}

/**
 * Хук для дублирования проекта
 * Сервер возвращает безопасный DTO копии в форме элемента списка (без `data`),
 * который добавляется в кэш `['/api/projects/list']` как есть
 * @returns Объект с функцией дублирования и состоянием
 *
 * @example
 * ```typescript
 * const { duplicateProject, isPending } = useDuplicateProjectMutation();
 * duplicateProject(projectId);
 * ```
 */
export function useDuplicateProjectMutation(): UseDuplicateProjectMutationResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (projectId: number) => apiRequest('POST', `/api/projects/${projectId}/duplicate`),
    onSuccess: async (newProject: ProjectListItem) => {
      // Защита от неожиданной формы ответа
      if (!newProject || typeof newProject.id !== 'number') {
        await queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        return;
      }

      // Добавляем копию в кэш списка проектов (ответ уже в форме списка, без `data`)
      const currentList = queryClient.getQueryData<ProjectListItem[]>(['/api/projects/list']);
      if (currentList) {
        queryClient.setQueryData<ProjectListItem[]>(['/api/projects/list'], [...currentList, newProject]);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['/api/projects/list'] });
      }

      // Кэш полных проектов содержит `data`, которого нет в ответе — инвалидируем для дозагрузки
      if (queryClient.getQueryData(['/api/projects'])) {
        await queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      }

      toast({
        title: "Проект дублирован",
        description: `Создана копия "${newProject.name}"`,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка дублирования",
        description: "Не удалось дублировать проект",
        variant: "destructive",
      });
    }
  });

  const duplicateProject = (projectId: number) => {
    mutation.mutate(projectId);
  };

  return {
    duplicateProject,
    isPending: mutation.isPending,
  };
}
