/**
 * @fileoverview Хендлеры экспорта в Google Таблицы
 *
 * Этот модуль предоставляет функции для обработки запросов
 * на экспорт данных пользователей и структуры проекта в Google Таблицы.
 *
 * @module projectRoutes/handlers/googleSheetsHandlers
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает запрос на экспорт данных пользователей в Google Таблицы
 *
 * @function exportToGoogleSheetsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function exportToGoogleSheetsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const ownerId = getOwnerIdFromRequest(req);
        if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
            res.status(403).json({ message: "Нет прав доступа к проекту" });
            return;
        }

        const { data: exportData, projectName } = req.body;

        if (!exportData || !Array.isArray(exportData)) {
            res.status(400).json({ message: "Неверные данные для экспорта" });
            return;
        }

        const { exportToGoogleSheets } = await import("../../../google-sheets");
        const { saveExportMetadata } = await import("../../../google-sheets/export-metadata");

        console.log('\n📊 Экспорт в Google Таблицы');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Проект:', projectName);
        console.log('ID проекта:', projectId);
        console.log('Записей на экспорт:', exportData.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const spreadsheetId = await exportToGoogleSheets(exportData, projectName, projectId);
        await saveExportMetadata(projectId, spreadsheetId, 'userDatabase');

        console.log('✅ Экспорт завершён успешно!');
        console.log('📋 URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            message: "Данные успешно экспортированы в Google Таблицы",
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        });
    } catch (error) {
        const errorObj = error as Error;
        const errorAsAny = error as any;

        if (errorObj.message.includes('OAuth token not found') ||
            errorObj.message.includes('invalid or expired') ||
            errorAsAny.requiresAuth === true) {

            console.warn('\n⚠️ Требуется аутентификация Google');
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.warn('Необходимо пройти аутентификацию для доступа к Google Таблицам');
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            res.status(401).json({
                message: "Требуется аутентификация",
                error: errorObj.message,
                requiresAuth: true
            });
            return;
        }

        console.error('\n❌ Ошибка экспорта в Google Таблицы');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Проект:', req.body.projectName, '(ID:', req.params.id + ')');
        console.error('Ошибка:', errorObj.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(500).json({
            message: "Не удалось экспортировать данные в Google Таблицы",
            error: errorObj.message
        });
    }
}

/**
 * Обрабатывает запрос на экспорт структуры проекта в Google Таблицы
 *
 * @function exportStructureToGoogleSheetsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function exportStructureToGoogleSheetsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const ownerId = getOwnerIdFromRequest(req);
        if (ownerId !== null && project.ownerId !== null && project.ownerId !== ownerId) {
            res.status(403).json({ message: "Нет прав доступа к проекту" });
            return;
        }

        const { exportStructureToGoogleSheets } = await import("../../../google-sheets/export-structure");
        const { saveExportMetadata } = await import("../../../google-sheets/export-metadata");

        console.log('\n📊 Экспорт структуры проекта');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Проект:', project.name);
        console.log('ID проекта:', projectId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        const spreadsheetId = await exportStructureToGoogleSheets(project.data, project.name, projectId);
        await saveExportMetadata(projectId, spreadsheetId, 'structure');

        console.log('✅ Экспорт структуры завершён!');
        console.log('📋 URL:', `https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            spreadsheetId,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        });
    } catch (error) {
        const errorObj = error as Error;
        const errorAsAny = error as any;

        if (errorObj.message.includes('OAuth token not found') ||
            errorObj.message.includes('invalid or expired') ||
            errorAsAny.requiresAuth === true) {

            res.status(401).json({
                message: "Требуется аутентификация",
                error: "Пройдите аутентификацию Google OAuth",
                requiresAuth: true
            });
            return;
        }

        console.error('\n❌ Ошибка экспорта структуры');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Проект:', req.body.projectName || req.params.id, '(ID:', req.params.id + ')');
        console.error('Ошибка:', errorObj.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.status(500).json({
            message: "Не удалось экспортировать структуру в Google Таблицы",
            error: errorObj.message
        });
    }
}
