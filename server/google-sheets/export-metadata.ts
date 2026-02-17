/**
 * @fileoverview Модуль для управления метаданными экспорта в Google Таблицы
 *
 * Предоставляет функции для сохранения и получения информации о последнем экспорте:
 * - ID таблицы
 * - URL таблицы
 * - Время последнего экспорта
 *
 * Поддерживает два типа экспорта:
 * - Экспорт данных пользователей (userDatabase)
 * - Экспорт структуры проекта (structure)
 *
 * @version 1.0.0
 */

import { db } from '../database/db';
import { botProjects } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { dbCache } from '../database/db-cache';

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
 * Тип экспорта для метаданных
 */
export type ExportType = 'userDatabase' | 'structure';

/**
 * Сохранить метаданные экспорта в базу данных
 *
 * @function saveExportMetadata
 * @param {number} projectId - ID проекта бота
 * @param {string} spreadsheetId - ID созданной Google Таблицы
 * @param {ExportType} type - Тип экспорта ('userDatabase' или 'structure')
 * @returns {Promise<void>}
 *
 * @description
 * Обновляет поля bot_projects в зависимости от типа экспорта:
 * - userDatabase: lastExportedGoogleSheetId, lastExportedGoogleSheetUrl, lastExportedAt
 * - structure: lastExportedStructureSheetId, lastExportedStructureSheetUrl, lastExportedStructureAt
 *
 * @example
 * await saveExportMetadata(123, "abc123xyz", 'userDatabase');
 * await saveExportMetadata(123, "abc456xyz", 'structure');
 */
export async function saveExportMetadata(
  projectId: number,
  spreadsheetId: string,
  type: ExportType = 'userDatabase'
): Promise<void> {
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  const now = new Date();

  if (type === 'structure') {
    console.log(`🔍 Сохранение метаданных экспорта структуры:`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   URL: ${spreadsheetUrl}`);
    console.log(`   Time: ${now.toISOString()}`);
    
    await db
      .update(botProjects)
      .set({
        lastExportedStructureSheetId: spreadsheetId,
        lastExportedStructureSheetUrl: spreadsheetUrl,
        lastExportedStructureAt: now,
      })
      .where(eq(botProjects.id, projectId));

    // Инвалидация кэша проекта чтобы новые данные сразу были доступны
    dbCache.clearByPattern(`project:${projectId}:.*`);
    console.log(`✅ Методанные экспорта структуры сохранены в БД (кэш инвалидирован)`);
  } else {
    await db
      .update(botProjects)
      .set({
        lastExportedGoogleSheetId: spreadsheetId,
        lastExportedGoogleSheetUrl: spreadsheetUrl,
        lastExportedAt: now,
      })
      .where(eq(botProjects.id, projectId));

    // Инвалидация кэша проекта
    dbCache.clearByPattern(`project:${projectId}:.*`);
    console.log(`💾 Сохранены метаданные экспорта пользователей для проекта ${projectId}: ${spreadsheetUrl} (кэш инвалидирован)`);
  }
}

/**
 * Получить метаданные последнего экспорта
 *
 * @function getExportMetadata
 * @param {number} projectId - ID проекта бота
 * @param {ExportType} type - Тип экспорта ('userDatabase' или 'structure')
 * @returns {Promise<GoogleSheetExportMetadata | null>} Метаданные экспорта или null, если экспорт не выполнялся
 *
 * @example
 * const metadata = await getExportMetadata(123, 'userDatabase');
 * const structureMetadata = await getExportMetadata(123, 'structure');
 */
export async function getExportMetadata(
  projectId: number,
  type: ExportType = 'userDatabase'
): Promise<GoogleSheetExportMetadata | null> {
  const [project] = await db
    .select({
      lastExportedGoogleSheetId: botProjects.lastExportedGoogleSheetId,
      lastExportedGoogleSheetUrl: botProjects.lastExportedGoogleSheetUrl,
      lastExportedAt: botProjects.lastExportedAt,
      lastExportedStructureSheetId: botProjects.lastExportedStructureSheetId,
      lastExportedStructureSheetUrl: botProjects.lastExportedStructureSheetUrl,
      lastExportedStructureAt: botProjects.lastExportedStructureAt,
    })
    .from(botProjects)
    .where(eq(botProjects.id, projectId));

  if (!project) {
    return null;
  }

  if (type === 'structure') {
    if (!project.lastExportedStructureSheetId) {
      return null;
    }

    return {
      spreadsheetId: project.lastExportedStructureSheetId,
      spreadsheetUrl: project.lastExportedStructureSheetUrl!,
      exportedAt: project.lastExportedStructureAt!,
    };
  } else {
    if (!project.lastExportedGoogleSheetId) {
      return null;
    }

    return {
      spreadsheetId: project.lastExportedGoogleSheetId,
      spreadsheetUrl: project.lastExportedGoogleSheetUrl!,
      exportedAt: project.lastExportedAt!,
    };
  }
}
