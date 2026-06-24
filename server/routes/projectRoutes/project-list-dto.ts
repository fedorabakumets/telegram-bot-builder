/**
 * @fileoverview DTO элемента списка проектов: явный whitelist безопасных полей
 *
 * Вырезает секреты (botToken, sessionId) у источника, чтобы они не попадали
 * в ответ GET /api/projects/list ни браузеру, ни MCP. Используется явное
 * перечисление полей (без spread), чтобы новые секретные колонки не утекали
 * автоматически в будущем.
 *
 * @module projectRoutes/project-list-dto
 */

import type { BotProject } from "@shared/schema";

/**
 * Безопасный элемент списка проектов (без секретов botToken и sessionId)
 */
export interface ProjectListItem {
    /** Уникальный идентификатор проекта */
    id: number;
    /** Идентификатор владельца проекта (null = общий проект) */
    ownerId: number | null;
    /** Название проекта */
    name: string;
    /** Описание проекта */
    description: string | null;
    /** Флаг включения пользовательской базы данных (0 = выключена, 1 = включена) */
    userDatabaseEnabled: number | null;
    /** Порядок сортировки проекта в списке */
    sortOrder: number | null;
    /** ID администраторов бота (через запятую) */
    adminIds: string | null;
    /** Дата создания проекта */
    createdAt: Date | null;
    /** Дата последнего обновления проекта */
    updatedAt: Date | null;
    /** ID последней экспортированной Google Таблицы пользователей */
    lastExportedGoogleSheetId: string | null;
    /** URL последней экспортированной Google Таблицы пользователей */
    lastExportedGoogleSheetUrl: string | null;
    /** Дата последнего экспорта пользователей в Google Таблицы */
    lastExportedAt: Date | null;
    /** ID последней экспортированной Google Таблицы структуры проекта */
    lastExportedStructureSheetId: string | null;
    /** URL последней экспортированной Google Таблицы структуры проекта */
    lastExportedStructureSheetUrl: string | null;
    /** Дата последнего экспорта структуры проекта в Google Таблицы */
    lastExportedStructureAt: Date | null;
    /** Количество узлов во всех листах проекта */
    nodeCount: number;
    /** Количество листов проекта */
    sheetsCount: number;
}

/**
 * Преобразует запись проекта в безопасный элемент списка (явный whitelist)
 * @param project - Запись проекта из хранилища
 * @param nodeCount - Количество узлов, вычисленное из data
 * @param sheetsCount - Количество листов, вычисленное из data
 * @returns Объект только с безопасными полями (без botToken и sessionId)
 */
export function toProjectListItem(
    project: BotProject,
    nodeCount: number,
    sheetsCount: number,
): ProjectListItem {
    return {
        id: project.id,
        ownerId: project.ownerId,
        name: project.name,
        description: project.description,
        userDatabaseEnabled: project.userDatabaseEnabled,
        sortOrder: project.sortOrder,
        adminIds: project.adminIds,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lastExportedGoogleSheetId: project.lastExportedGoogleSheetId,
        lastExportedGoogleSheetUrl: project.lastExportedGoogleSheetUrl,
        lastExportedAt: project.lastExportedAt,
        lastExportedStructureSheetId: project.lastExportedStructureSheetId,
        lastExportedStructureSheetUrl: project.lastExportedStructureSheetUrl,
        lastExportedStructureAt: project.lastExportedStructureAt,
        nodeCount,
        sheetsCount,
    };
}
