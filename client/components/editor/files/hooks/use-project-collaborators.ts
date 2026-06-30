/**
 * @fileoverview React Query хук для получения коллабораторов проекта.
 * Запрашивает GET /api/projects/:projectId/collaborators и отдаёт массив
 * CollaboratorInfo[] (владелец + участники с именем и аватаркой) для фильтра
 * «Сотрудник» (Req 6.5) и столбца-аватара в таблице файлов (Req 9.3).
 * Повторяет паттерн use-storage-quota / use-project-files.
 * @module components/editor/files/hooks/use-project-collaborators
 */

import { useQuery } from '@tanstack/react-query';

/** Информация о коллабораторе для аватара/селектора «Сотрудник» */
export interface CollaboratorInfo {
  /** ID пользователя (telegram_users.id) */
  userId: number;
  /** Отображаемое имя коллаборатора */
  name: string;
  /** URL аватарки либо null, если отсутствует */
  photoUrl?: string | null;
}

/** Результат хука коллабораторов проекта */
export interface UseProjectCollaboratorsResult {
  /** Список коллабораторов проекта */
  collaborators: CollaboratorInfo[];
  /** Идёт ли загрузка данных */
  isLoading: boolean;
}

/**
 * Хук для получения коллабораторов проекта (владелец + участники).
 * @param projectId - Идентификатор проекта
 * @returns Список коллабораторов и состояние загрузки
 */
export function useProjectCollaborators(projectId: number): UseProjectCollaboratorsResult {
  const { data, isLoading } = useQuery<CollaboratorInfo[]>({
    queryKey: ['/api/projects', projectId, 'collaborators'],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (!res.ok) throw new Error('Ошибка загрузки коллабораторов');
      return res.json();
    },
    enabled: !!projectId,
    staleTime: 15000,
  });

  return {
    collaborators: data ?? [],
    isLoading,
  };
}
