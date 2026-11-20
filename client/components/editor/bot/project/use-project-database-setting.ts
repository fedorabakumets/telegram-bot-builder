/** @fileoverview Изменение общей для проекта настройки базы данных пользователей. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/queryClient';
import type { BotProject } from '@shared/schema';

/** Настройка, обновляемая в кэше без перезаписи остальных полей проекта. */
type ProjectDatabaseField = Pick<BotProject, 'id' | 'userDatabaseEnabled'>;

/** Идентификатор сохраняется вместе с запросом при переключении между проектами. */
interface DatabaseChange {
  /** Проект, на котором был нажат переключатель. */
  projectId: number;
  /** Новое состояние базы данных. */
  enabled: boolean;
}

/**
 * Сохраняет настройку, показывает ожидаемое состояние и возвращает старое при отказе.
 * @param projectId - Идентификатор проекта.
 * @param current - Подтверждённая настройка проекта.
 * @param canManage - Может ли пользователь изменять настройки проекта.
 * @returns Состояние переключателя и действие записи.
 */
export function useProjectDatabaseSetting(projectId: number, current: number | null, canManage: boolean) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (change: DatabaseChange): Promise<ProjectDatabaseField> =>
      apiRequest('PUT', `/api/projects/${change.projectId}`, { userDatabaseEnabled: change.enabled ? 1 : 0 }),
    onSuccess: (saved, change) => {
      const url = `/api/projects/${change.projectId}`;
      /** Сохраняет только значение переключателя, оставляя прочие черновики и поля проекта. */
      const update = <T extends ProjectDatabaseField>(project: T): T => project.id === change.projectId
        ? { ...project, userDatabaseEnabled: saved.userDatabaseEnabled } : project;
      queryClient.setQueryData<ProjectDatabaseField>([url], (project) => project && update(project));
      const updateList = (projects?: ProjectDatabaseField[]) => Array.isArray(projects) ? projects.map(update) : projects;
      /** Списки проектов имеют не больше двух сегментов ключа, в отличие от истории версий. */
      const projectLists = { queryKey: ['/api/projects'], predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey.length <= 2 };
      queryClient.setQueriesData<ProjectDatabaseField[]>(projectLists, updateList);
      queryClient.setQueriesData<ProjectDatabaseField[]>({ queryKey: ['/api/projects/list'], exact: true }, updateList);
      toast({ title: change.enabled ? 'База данных включена' : 'База данных выключена',
        description: 'Изменение применяется при следующем запуске ботов.' });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [url] }),
        queryClient.invalidateQueries(projectLists),
        queryClient.invalidateQueries({ queryKey: ['/api/projects/list'], exact: true }),
      ]);
    },
    onError: (error: Error) => toast({
      title: 'Не удалось сохранить настройку базы данных', description: error.message, variant: 'destructive',
    }),
  });
  const isPending = mutation.isPending && mutation.variables?.projectId === projectId;
  const enabled = isPending ? mutation.variables?.enabled === true : current === 1;
  /** Отклоняет действие из недоступной или уже сохраняемой формы. */
  const setEnabled = (next: boolean) => {
    if (canManage && !isPending && next !== enabled) mutation.mutate({ projectId, enabled: next });
  };
  return { enabled, disabled: !canManage || isPending, setEnabled };
}
