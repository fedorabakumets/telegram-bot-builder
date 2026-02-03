import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { LocalStorageService } from "@/lib/storage/local-storage";

/**
 * Режим работы с пользовательскими данными
 * @typedef {'local' | 'server'} UserDataMode
 * - 'local' - данные хранятся в localStorage
 * - 'server' - данные хранятся на сервере
 */
type UserDataMode = 'local' | 'server';

/**
 * Опции для хуков управления пользовательскими данными
 * @interface UseUserDataOptions
 * @property {boolean} isAuthenticated - Флаг аутентификации пользователя
 * @property {number} [userId] - Идентификатор пользователя (опционально)
 */
interface UseUserDataOptions {
  isAuthenticated: boolean;
  userId?: number;
}

/**
 * Хук для управления проектами пользователя
 * Автоматически выбирает источник данных (localStorage или сервер) в зависимости от статуса аутентификации
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификатор пользователя
 * @returns {UseQueryResult} Результат запроса с данными проектов
 * 
 * @example
 * ```typescript
 * const { data: projects, isLoading, error } = useProjects({
 *   isAuthenticated: true,
 *   userId: 123
 * });
 * ```
 */
export function useProjects(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/projects', mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getProjects();
      }
      const res = await fetch('/api/user/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });
}

/**
 * Хук для управления токенами пользователя
 * Поддерживает фильтрацию по проекту и автоматический выбор источника данных
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификатор пользователя
 * @param {number} [projectId] - Идентификатор проекта для фильтрации токенов
 * @returns {UseQueryResult} Результат запроса с данными токенов
 * 
 * @example
 * ```typescript
 * // Получить все токены пользователя
 * const { data: allTokens } = useTokens({ isAuthenticated: true, userId: 123 });
 * 
 * // Получить токены конкретного проекта
 * const { data: projectTokens } = useTokens({ isAuthenticated: true, userId: 123 }, 456);
 * ```
 */
export function useTokens(options: UseUserDataOptions, projectId?: number) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/tokens', projectId, mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getTokens(projectId);
      }
      const url = projectId 
        ? `/api/user/tokens?projectId=${projectId}` 
        : '/api/user/tokens';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tokens');
      return res.json();
    },
  });
}

/**
 * Хук для управления шаблонами пользователя
 * Автоматически выбирает источник данных в зависимости от статуса аутентификации
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификатор пользователя
 * @returns {UseQueryResult} Результат запроса с данными шаблонов
 * 
 * @example
 * ```typescript
 * const { data: templates, isLoading, error } = useTemplates({
 *   isAuthenticated: false
 * });
 * ```
 */
export function useTemplates(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useQuery({
    queryKey: ['/api/templates', mode],
    queryFn: async () => {
      if (mode === 'local') {
        return LocalStorageService.getTemplates();
      }
      const res = await fetch('/api/user/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });
}

/**
 * Хук для создания нового проекта
 * Автоматически инвалидирует кэш проектов после успешного создания
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификателя
 * @returns {UseMutationResult} Мутация для создания проекта
 * 
 * @example
 * ```typescript
 * const createProject = useCreateProject({ isAuthenticated: true, userId: 123 });
 * 
 * const handleCreate = async () => {
 *   try {
 *     await createProject.mutateAsync({
 *       name: 'Новый проект',
 *       description: 'Описание проекта'
 *     });
 *   } catch (error) {
 *     console.error('Ошибка создания проекта:', error);
 *   }
 * };
 * ```
 */
export function useCreateProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveProject>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveProject(data);
      }
      const res = await fetch('/api/user/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

/**
 * Хук для обновления существующего проекта
 * Автоматически инвалидирует кэш проектов после успешного обновления
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификатор пользователя
 * @returns {UseMutationResult} Мутация для обновления проекта
 * 
 * @example
 * ```typescript
 * const updateProject = useUpdateProject({ isAuthenticated: true, userId: 123 });
 * 
 * const handleUpdate = async (projectId: number) => {
 *   try {
 *     await updateProject.mutateAsync({
 *       id: projectId,
 *       data: { name: 'Обновленное название' }
 *     });
 *   } catch (error) {
 *     console.error('Ошибка обновления проекта:', error);
 *   }
 * };
 * ```
 */
export function useUpdateProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateProject>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateProject(id, data);
      }
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

/**
 * Хук для удаления проекта
 * Автоматически инвалидирует кэш проектов после успешного удаления
 * 
 * @param {UseUserDataOptions} options - Опции конфигурации хука
 * @param {boolean} options.isAuthenticated - Флаг аутентификации пользователя
 * @param {number} [options.userId] - Идентификатор пользователя
 * @returns {UseMutationResult} Мутация для удаления проекта
 * 
 * @example
 * ```typescript
 * const deleteProject = useDeleteProject({ isAuthenticated: true, userId: 123 });
 * 
 * const handleDelete = async (projectId: number) => {
 *   if (confirm('Вы уверены, что хотите удалить проект?')) {
 *     try {
 *       await deleteProject.mutateAsync(projectId);
 *     } catch (error) {
 *       console.error('Ошибка удаления проекта:', error);
 *     }
 *   }
 * };
 * ```
 */
export function useDeleteProject(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteProject(id);
      }
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });
}

// Hook для создания токена
export function useCreateToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveToken>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveToken(data);
      }
      const res = await fetch('/api/user/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для обновления токена
export function useUpdateToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateToken>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateToken(id, data);
      }
      const res = await fetch(`/api/user/tokens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для удаления токена
export function useDeleteToken(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteToken(id);
      }
      const res = await fetch(`/api/user/tokens/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete token');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tokens'] });
    },
  });
}

// Hook для создания шаблона
export function useCreateTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof LocalStorageService.saveTemplate>[0]) => {
      if (mode === 'local') {
        return LocalStorageService.saveTemplate(data);
      }
      const res = await fetch('/api/user/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}

// Hook для обновления шаблона
export function useUpdateTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: Parameters<typeof LocalStorageService.updateTemplate>[1];
    }) => {
      if (mode === 'local') {
        return LocalStorageService.updateTemplate(id, data);
      }
      const res = await fetch(`/api/user/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}

// Hook для удаления шаблона
export function useDeleteTemplate(options: UseUserDataOptions) {
  const mode: UserDataMode = options.isAuthenticated && options.userId ? 'server' : 'local';
  
  return useMutation({
    mutationFn: async (id: number) => {
      if (mode === 'local') {
        return LocalStorageService.deleteTemplate(id);
      }
      const res = await fetch(`/api/user/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    },
  });
}
