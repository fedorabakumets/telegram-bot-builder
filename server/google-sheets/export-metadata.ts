/**
 * @fileoverview Модуль для управления метаданными экспорта в Google Таблицы
 * 
 * Предоставляет функции для сохранения и получения информации о последнем экспорте:
 * - ID таблицы
 * - URL таблицы
 * - Время последнего экспорта
 * 
 * @version 1.0.0
 */

import { db } from '../database/db';
import { botProjects } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * @interface GoogleSheetExportMetadata
 * @description Интерфейс метаданных экспорта в Google Таблицу
 * @property {string} spreadsheetId - ID Google Таблицы
 * @property {string} spreadsheetUrl - Полный URL Google Таблицы
 * @property {Date} exportedAt - Дата и время последнего экспорта
 */
export interface GoogleSheetExportMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  exportedAt: Date;
}

/**
 * Сохранить метаданные экспорта в базу данных
 * 
 * @function saveExportMetadata
 * @param {number} projectId - ID проекта бота
 * @param {string} spreadsheetId - ID созданной Google Таблицы
 * @returns {Promise<void>}
 * 
 * @description
 * Обновляет поля bot_projects таблицей:
 * - lastExportedGoogleSheetId
 * - lastExportedGoogleSheetUrl
 * - lastExportedAt
 * 
 * @example
 * await saveExportMetadata(123, "abc123xyz");
 */
export async function saveExportMetadata(
  projectId: number,
  spreadsheetId: string
): Promise<void> {
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  
  await db
    .update(botProjects)
    .set({
      lastExportedGoogleSheetId: spreadsheetId,
      lastExportedGoogleSheetUrl: spreadsheetUrl,
      lastExportedAt: new Date(),
    })
    .where(eq(botProjects.id, projectId));
  
  console.log(`💾 Сохранены метаданные экспорта для проекта ${projectId}: ${spreadsheetUrl}`);
}

/**
 * Получить метаданные последнего экспорта
 * 
 * @function getExportMetadata
 * @param {number} projectId - ID проекта бота
 * @returns {Promise<GoogleSheetExportMetadata | null>} Метаданные экспорта или null, если экспорт не выполнялся
 * 
 * @example
 * const metadata = await getExportMetadata(123);
 * if (metadata) {
 *   console.log(`Последний экспорт: ${metadata.exportedAt}`);
 * }
 */
export async function getExportMetadata(
  projectId: number
): Promise<GoogleSheetExportMetadata | null> {
  const projects = await db
    .select({
      lastExportedGoogleSheetId: botProjects.lastExportedGoogleSheetId,
      lastExportedGoogleSheetUrl: botProjects.lastExportedGoogleSheetUrl,
      lastExportedAt: botProjects.lastExportedAt,
    })
    .from(botProjects)
    .where(eq(botProjects.id, projectId));

  const [project] = projects;

  if (!project || !project.lastExportedGoogleSheetId) {
    return null;
  }

  return {
    spreadsheetId: project.lastExportedGoogleSheetId,
    spreadsheetUrl: project.lastExportedGoogleSheetUrl!,
    exportedAt: project.lastExportedAt!,
  };
}
