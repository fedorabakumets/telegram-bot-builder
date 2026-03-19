/**
 * @fileoverview Hook для управления проектами в sidebar
 * Предоставляет логику для создания, удаления, переименования и переупорядочивания проектов
 * @module components/editor/sidebar/hooks/useProjectManagement
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BotProject } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';

/**
 * Результат работы hook для управления проектами
 */
export interface UseProjectManagementResult {
  /** Список всех проектов */
  projects: BotProject[];
  /** Активный проект */
  activeProject: BotProject | null;
  /** Загрузка проектов */
  isLoading: boolean;
  /** Ошибка загрузки */
  error: Error | null;
  /** Создать новый проект */
  createProject: (name: string) => Promise<void>;
  /** Удалить проект */
  deleteProject: (project: BotProject) => Promise<void>;
  /** Переименовать проект */
  renameProject: (project: BotProject, newName: string) => Promise<void>;
  /** Обновить активный проект */
  refreshActiveProject: () => void;
}

/**
 * Hook для управления проектами в sidebar
 * @returns Объект с проектами и методами управления
 */
export function useProjectManagement(): UseProjectManagementResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Получение списка проектов
  const { data: projects = [], isLoading, error } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    staleTime: 0,
  });

  // Активный проект (первый в списке или null)
  const activeProject = projects.length > 0 ? projects[0] : null;

  // Мутация для создания проекта
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/projects', { name });
      return response.json() as Promise<BotProject>;
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<BotProject[]>(
        ['/api/projects'],
        (old = []) => [...old, newProject]
      );
      toast({
        title: '✅ Проект создан',
        description: `Проект "${newProject.name}" успешно создан`,
      });
    },
    onError: () => {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось создать проект',
        variant: 'destructive',
      });
    },
  });

  // Мутация для удаления проекта
  const deleteMutation = useMutation({
    mutationFn: async (project: BotProject) => {
      await apiRequest('DELETE', `/api/projects/${project.id}`);
      return project;
    },
    onSuccess: (deletedProject) => {
      queryClient.setQueryData<BotProject[]>(
        ['/api/projects'],
        (old = []) => old.filter(p => p.id !== deletedProject.id)
      );
      toast({
        title: '✅ Проект удалён',
        description: `Проект "${deletedProject.name}" удалён`,
      });
    },
    onError: () => {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось удалить проект',
        variant: 'destructive',
      });
    },
  });

  // Мутация для переименования проекта
  const renameMutation = useMutation({
    mutationFn: async ({ project, newName }: { project: BotProject; newName: string }) => {
      const response = await apiRequest('PUT', `/api/projects/${project.id}`, {
        name: newName,
      });
      return response.json() as Promise<BotProject>;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData<BotProject[]>(
        ['/api/projects'],
        (old = []) => old.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      toast({
        title: '✅ Проект переименован',
        description: `Проект переименован в "${updatedProject.name}"`,
      });
    },
    onError: () => {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось переименовать проект',
        variant: 'destructive',
      });
    },
  });

  // Создание проекта
  const createProject = useCallback(async (name: string) => {
    await createMutation.mutateAsync(name);
  }, [createMutation]);

  // Удаление проекта
  const deleteProject = useCallback(async (project: BotProject) => {
    await deleteMutation.mutateAsync(project);
  }, [deleteMutation]);

  // Переименование проекта
  const renameProject = useCallback(async (project: BotProject, newName: string) => {
    await renameMutation.mutateAsync({ project, newName });
  }, [renameMutation]);

  // Обновление активного проекта
  const refreshActiveProject = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
  }, [queryClient]);

  return {
    projects,
    activeProject,
    isLoading,
    error: error as Error | null,
    createProject,
    deleteProject,
    renameProject,
    refreshActiveProject,
  };
}
