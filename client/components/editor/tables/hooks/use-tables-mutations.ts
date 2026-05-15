/**
 * @fileoverview React-query мутации для управления таблицами
 * @module editor/tables/hooks/use-tables-mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/tables-api';
import { tableKeys } from './use-tables-query';

/**
 * Мутация создания таблицы
 * @param projectId - ID проекта
 */
export function useCreateTable(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createTable(projectId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.tables(projectId) }),
  });
}

/**
 * Мутация удаления таблицы
 * @param projectId - ID проекта
 */
export function useDeleteTable(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: number) => api.deleteTable(projectId, tableId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.tables(projectId) }),
  });
}

/**
 * Мутация переименования таблицы
 * @param projectId - ID проекта
 */
export function useRenameTable(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, name }: { tableId: number; name: string }) =>
      api.renameTable(projectId, tableId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: tableKeys.tables(projectId) }),
  });
}

/**
 * Мутация создания колонки
 * @param projectId - ID проекта
 */
export function useCreateColumn(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, name, position }: { tableId: number; name: string; position: number }) =>
      api.createColumn(projectId, tableId, name, position),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.columns(projectId, vars.tableId) }),
  });
}

/**
 * Мутация удаления колонки
 * @param projectId - ID проекта
 */
export function useDeleteColumn(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, columnId }: { tableId: number; columnId: number }) =>
      api.deleteColumn(projectId, tableId, columnId),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.columns(projectId, vars.tableId) }),
  });
}

/**
 * Мутация переименования колонки
 * @param projectId - ID проекта
 */
export function useRenameColumn(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, columnId, name }: { tableId: number; columnId: number; name: string }) =>
      api.renameColumn(projectId, tableId, columnId, name),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.columns(projectId, vars.tableId) }),
  });
}

/**
 * Мутация создания строк (батч)
 * @param projectId - ID проекта
 */
export function useCreateRows(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, rows }: {
      tableId: number;
      rows: Array<{ rowIndex: number; data: Record<string, string> }>;
    }) => api.createRows(projectId, tableId, rows),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.rows(projectId, vars.tableId) }),
  });
}

/**
 * Мутация обновления строки
 * @param projectId - ID проекта
 */
export function useUpdateRow(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, rowId, data }: {
      tableId: number;
      rowId: number;
      data: Record<string, string>;
    }) => api.updateRow(projectId, tableId, rowId, data),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.rows(projectId, vars.tableId) }),
  });
}

/**
 * Мутация удаления строки
 * @param projectId - ID проекта
 */
export function useDeleteRow(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, rowId }: { tableId: number; rowId: number }) =>
      api.deleteRow(projectId, tableId, rowId),
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: tableKeys.rows(projectId, vars.tableId) }),
  });
}

/**
 * Мутация перенумерации строк
 * @param projectId - ID проекта
 */
export function useReindexRows(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: number) => api.reindexRows(projectId, tableId),
    onSuccess: (_, tableId) =>
      qc.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) }),
  });
}
