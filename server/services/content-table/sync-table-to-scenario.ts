/** @fileoverview Обратная синхронизация строки контента в исходную ноду сценария. */
import { storage } from '../../storages/storage';
import { applyContentValue, type ContentScenario } from './apply-content-value';
/**
 * Обновляет сценарий по значениям столбцов строки контента.
 * @param projectId - Проект пользователя.
 * @param tableId - Таблица контента.
 * @param rowData - Значения по идентификаторам столбцов.
 * @returns Завершение синхронизации.
 */
export async function syncTableToScenario(projectId: number, tableId: number, rowData: Record<string, string>): Promise<void> {
  const project = await storage.getBotProject(projectId);
  if (!project?.data) return;
  const columns = await storage.getBotTableColumns(tableId);
  const normalized = Object.fromEntries(Object.entries(rowData).map(([id, value]) => [columns.find((column) => String(column.id) === id)?.name ?? id, value]));
  if (!normalized.key || !normalized.type) return;
  const scenario = project.data as ContentScenario;
  if (applyContentValue(scenario, normalized.key, normalized.type, normalized.value ?? '')) await storage.updateBotProject(projectId, { data: scenario });
}
