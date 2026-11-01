/** @fileoverview Клиент атомарного сохранения диапазона ячеек. */
import { apiRequest } from '@/queryClient';
import type { TableCellEdit } from '@shared/table-cell-edit';
/**
 * Сохраняет диапазон только при совпадении всех исходных значений.
 * @param projectId - Проект пользователя.
 * @param tableId - Таблица проекта.
 * @param edits - Ячейки операции.
 * @returns Подтверждение сохранения.
 */
export async function saveCellEdits(projectId: number, tableId: string, edits: TableCellEdit[]): Promise<void> {
  await apiRequest('POST', `/api/projects/${projectId}/tables/${tableId}/cells/edit`, { edits });
}
