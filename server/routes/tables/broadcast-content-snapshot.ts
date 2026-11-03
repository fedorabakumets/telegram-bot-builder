/** @fileoverview Передаёт холсту сохранённый сценарий после изменения таблицы контента. */
import { storage } from '../../storages/storage';
import { parseAgentCanvasData } from '../../canvas/parse-agent-canvas-data';
import { broadcastAgentCanvasUpdate } from '../../canvas/broadcastAgentCanvasUpdate';

/**
 * Читает актуальную строку после записи, чтобы не рассылать устаревший входной снимок.
 * @param projectId - Проект с изменённым контентом
 * @returns Завершение попытки; отсутствие проекта не создаёт фиктивного снимка
 */
export async function broadcastContentSnapshot(projectId: number): Promise<void> {
  const project = await storage.getBotProject(projectId);
  if (!project || !Number.isSafeInteger(project.revision)) return;
  broadcastAgentCanvasUpdate(projectId, parseAgentCanvasData(project.data), {
    sessionId: 'table-content', displayName: 'Таблица контента', revision: project.revision,
  });
}
