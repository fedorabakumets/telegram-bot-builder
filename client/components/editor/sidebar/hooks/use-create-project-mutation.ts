/**
 * @fileoverview Хук для создания нового проекта
 * Предоставляет мутацию для создания проекта со стартовым `message`
 * и отдельным `command_trigger` для `/start`
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
  /** Количество существующих проектов для генерации имени (устарело, используется existingNames) */
  projectCount?: number;
  /** Существующие имена проектов для генерации уникального имени */
  existingNames?: string[];
  /** Колбэк при выборе проекта после создания */
  onProjectSelect?: (projectId: number) => void;
}

/**
 * Генерирует уникальное имя проекта, не совпадающее с существующими
 */
function generateUniqueName(existingNames: string[]): string {
  const namesSet = new Set(existingNames);
  let i = 1;
  while (namesSet.has(`Новый бот ${i}`)) {
    i++;
  }
  return `Новый бот ${i}`;
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
  nodes: [
    {
      id: 'start-message',
      type: 'message' as const,
      position: { x: 400, y: 300 },
      data: {
        messageText: 'Привет! Я ваш новый бот. Нажмите /help для получения помощи.',
        keyboardType: 'none' as const,
        buttons: [],
        showInMenu: true
      }
    },
    {
      id: 'start-command-trigger',
      type: 'command_trigger' as const,
      position: { x: 100, y: 300 },
      data: {
        command: '/start',
        description: 'Запустить бота',
        showInMenu: true,
        autoTransitionTo: 'start-message',
        sourceNodeId: 'start-message'
      }
    }
  ],
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
    mutationFn: (name: string) => {
      return apiRequest('POST', '/api/projects', {
        name,
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
    const existingNames = params?.existingNames ?? [];
    const name = generateUniqueName(existingNames);
    const onProjectSelect = params?.onProjectSelect;

    mutation.mutate(name, {
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
