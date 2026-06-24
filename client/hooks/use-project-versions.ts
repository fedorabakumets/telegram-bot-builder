/**
 * @fileoverview Хук для работы с историей версий проекта
 *
 * Предоставляет загрузку списка версий и мутацию восстановления (откат).
 *
 * @module client/hooks/use-project-versions
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import type { ProjectVersion } from "@shared/schema";
import { apiRequest, queryClient } from "../queryClient";

/** Метаданные версии проекта (без тяжёлого snapshot) */
export type ProjectVersionMeta = Pick<ProjectVersion, "id" | "projectId" | "label" | "authorId" | "createdAt"> & {
  /** Человекочитаемое имя автора снимка (имя + username), если доступно */
  authorName?: string;
  /** Тип версии: "auto" — авто-снимок, "manual" — ручной коммит-чекпоинт */
  kind?: 'auto' | 'manual';
};

/**
 * Хук получения списка версий проекта
 * @param projectId - ID проекта
 * @returns Результат useQuery со списком версий
 */
export function useProjectVersions(projectId: number) {
  return useQuery<ProjectVersionMeta[]>({
    queryKey: ["/api/projects", projectId, "versions"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/versions`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Ошибка получения версий проекта");
      }
      return res.json() as Promise<ProjectVersionMeta[]>;
    },
    enabled: !!projectId,
    staleTime: 10000,
  });
}

/**
 * Хук мутации восстановления проекта из версии (откат)
 * @param projectId - ID проекта
 * @returns Мутация восстановления версии
 */
export function useRestoreProjectVersion(projectId: number) {
  return useMutation({
    mutationFn: async (versionId: number) => {
      return apiRequest("POST", `/api/projects/${projectId}/versions/${versionId}/restore`);
    },
    onSuccess: (restoredProject) => {
      // Сразу кладём восстановленный проект в кэш — чтобы откат холста
      // (discardLocalChanges) прочитал уже свежие данные, а не устаревшие
      if (restoredProject) {
        queryClient.setQueryData([`/api/projects/${projectId}`], restoredProject);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "versions"] });
    },
  });
}

/**
 * Хук мутации создания ручного коммита-чекпоинта проекта
 * @param projectId - ID проекта
 * @returns Мутация создания коммита (принимает { message })
 */
export function useCreateProjectCommit(projectId: number) {
  return useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      return apiRequest("POST", `/api/projects/${projectId}/versions/commit`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "versions"] });
    },
  });
}

/**
 * Хук загрузки полной версии проекта со снимком (для diff)
 * @param projectId - ID проекта
 * @param versionId - ID версии (null — запрос отключён)
 * @returns Результат useQuery с полной версией (включая snapshot)
 */
export function useProjectVersionSnapshot(projectId: number, versionId: number | null) {
  return useQuery<ProjectVersion>({
    queryKey: ["/api/projects", projectId, "versions", versionId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Ошибка получения снимка версии");
      }
      return res.json() as Promise<ProjectVersion>;
    },
    enabled: !!projectId && !!versionId,
    staleTime: 60000,
  });
}
