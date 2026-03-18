/**
 * @fileoverview Хук сохранения проекта редактора
 *
 * Управляет мутацией сохранения проекта с оптимистичным обновлением.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import type { BotProject, BotData, BotDataWithSheets } from '@shared/schema';

/** Результат сохранения проекта */
interface UseProjectSaveResult {
  /** Мутация сохранения */
  saveProject: (options?: { restartOnUpdate?: boolean }) => void;
  /** Флаг выполнения сохранения */
  isSaving: boolean;
  /** Флаг ошибки сохранения */
  isError: boolean;
}

/**
 * Хук для сохранения проекта
 *
 * @param getBotData - Функция получения текущих данных
 * @param botDataWithSheets - Данные с листами
 * @param activeProject - Активный проект
 * @returns Методы и состояние сохранения
 */
export function useProjectSave(
  getBotData: () => BotData,
  botDataWithSheets: BotDataWithSheets | null,
  activeProject: BotProject | undefined
): UseProjectSaveResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveProjectMutation = useMutation({
    mutationFn: async ({ restartOnUpdate = false }: { restartOnUpdate?: boolean } = {}) => {
      if (!activeProject?.id) {
        throw new Error('Project ID is required for save');
      }

      const projectData = botDataWithSheets || getBotData();

      return apiRequest('PUT', `/api/projects/${activeProject.id}`, {
        data: projectData,
        restartOnUpdate
      });
    },
    onMutate: async () => {
      if (!activeProject?.id) return;

      await queryClient.cancelQueries({ queryKey: ['/api/projects'] });
      await queryClient.cancelQueries({ queryKey: [`/api/projects/${activeProject.id}`] });

      const previousProject = queryClient.getQueryData<BotProject>([`/api/projects/${activeProject.id}`]);

      const optimisticProject: BotProject = {
        ...activeProject,
        data: botDataWithSheets || getBotData(),
        updatedAt: new Date()
      };

      queryClient.setQueryData([`/api/projects/${activeProject.id}`], optimisticProject);

      return { previousProject };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousProject && activeProject?.id) {
        queryClient.setQueryData([`/api/projects/${activeProject.id}`], context.previousProject);
      }

      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить проект",
        variant: "destructive",
      });
    }
  });

  return {
    saveProject: (options?: { restartOnUpdate?: boolean }) => saveProjectMutation.mutate(options ?? {}),
    isSaving: saveProjectMutation.isPending,
    isError: saveProjectMutation.isError
  };
}
