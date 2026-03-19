/**
 * @fileoverview Хук для создания нового проекта
 * Предоставляет мутацию для создания проекта с базовым /start узлом
 * @module components/editor/sidebar/hooks/use-create-project-mutation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { BotProject } from '@shared/schema';

/**
 * Параметры для создания проекта
 */
export interface CreateProjectParams {
  /** Количество существующих проектов для генерации имени */
  projectCount?: number;
  /** Колбэк при выборе проекта после создания */
  onProjectSelect?: (projectId: number) => void;
}

/**
 * Результат работы хука создания проекта
 */
export interface UseCreateProjectMutationResult {
  /** Функция для создания проекта */
  createProject: (params?: CreateProjectParams) => void;
  /** Индикатор выполнения операции */
  isPending: boolean;
}

/**
 * Данные для нового проекта по умолчанию
 */
const DEFAULT_PROJECT_DATA = {
  nodes: [{
    id: 'start',
    type: 'start' as const,
    position: { x: 400, y: 300 },
    data: {
      messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
      keyboardType: 'none' as const,
      buttons: [],
      command: '/start',
      description: 'Запустить бота',
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  }],
  connections: []
};

/**
 * Хук для создания нового проекта
 * @returns Объект с функцией создания и состоянием
 */
export function useCreateProjectMutation(): UseCreateProjectMutationResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (projectCount: number) => {
      return apiRequest('POST', '/api/projects', {
        name: `Новый бот ${projectCount + 1}`,
        description: '',
        data: DEFAULT_PROJECT_DATA,
      });
    },
    onSuccess: async (newProject: BotProject) => {
      // Обновляем кэш проектов
      const currentProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']) || [];
      queryClient.setQueryData(['/api/projects'], [...currentProjects, newProject]);

      // Обновляем кэш списка проектов
      const currentList = queryClient.getQueryData<Array<Omit<BotProject, 'data'>>>(['/api/projects/list']) || [];
      const { data, ...projectWithoutData } = newProject;
      queryClient.setQueryData(['/api/projects/list'], [...currentList, projectWithoutData]);

      toast({
        title: "Проект создан",
        description: `Проект "${newProject.name}" успешно создан`,
      });
    }
  });

  const createProject = (params?: CreateProjectParams) => {
    const projectCount = params?.projectCount ?? 0;
    const onProjectSelect = params?.onProjectSelect;
    
    // Создаём новую мутацию с onProjectSelect
    mutation.mutate(projectCount, {
      onSuccess: (newProject) => {
        // Вызываем оригинальный onSuccess через замыкание
        if (onProjectSelect) {
          onProjectSelect(newProject.id);
        }
      }
    });
  };

  return {
    createProject,
    isPending: mutation.isPending,
  };
}
