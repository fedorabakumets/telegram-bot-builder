import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BotProject } from '@shared/schema';

interface UpdateProjectNameParams {
  projectId: number;
  name: string;
}

export function useUpdateProjectName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, name }: UpdateProjectNameParams) => {
      if (!projectId) {
        throw new Error('Project ID is required for update');
      }

      return apiRequest('PUT', `/api/projects/${projectId}`, {
        name: name,
        // Добавляем флаг для пересоздания файлов
        recreateFiles: true
      });
    },
    onSuccess: (updatedProject: BotProject) => {
      // Обновляем кэш после успешного обновления
      queryClient.setQueryData<BotProject>([`/api/projects/${updatedProject.id}`], updatedProject);
      
      // Обновляем список проектов в кэше
      queryClient.setQueryData<BotProject[]>(['/api/projects'], (old) => {
        if (!old) return [updatedProject];
        return old.map(p => p.id === updatedProject.id ? updatedProject : p);
      });
    },
  });
}