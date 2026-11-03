/**
 * @fileoverview Хендлер экспорта проекта в Python
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на экспорт проекта в Python код.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/exportProjectHandler
 */

import type { Request, Response } from "express";
import { URL } from "node:url";
import { storage } from "../../../storages/storage";
import { isPsqlBuiltinEnabled } from "../../../utils/isPsqlBuiltinEnabled";
import { isPsqlPanelDsnDenied } from "../../../utils/isPsqlPanelDsnDenied";
import { isBotRuntimeActive } from "../../../bots/resolveBotDatabaseUrl";
import { exportProjectArchive, prepareArchiveMedia } from "./exportProjectArchive";

/**
 * Обрабатывает запрос на экспорт проекта
 *
 * @function exportProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function exportProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);

        const project = await storage.getBotProject(id);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        const modUrl = new URL("../../../../lib/bot-generator.ts", import.meta.url);
        modUrl.searchParams.set("t", Date.now().toString());
        const { generatePythonCode } = await import(modUrl.href);

        const userDatabaseEnabled = project.userDatabaseEnabled === 1;

        let archiveData: Awaited<ReturnType<typeof prepareArchiveMedia>> | undefined;
        if (req.query.format === "zip") {
            try { archiveData = await prepareArchiveMedia(id, project.data); }
            catch {
                res.status(422).json({ message: "Не удалось собрать полный архив: проверьте доступность медиафайлов проекта и их общий размер." });
                return;
            }
        }
        const pythonCode = generatePythonCode((archiveData?.data ?? project.data) as any, {
            botName: project.name,
            projectId: id,
            userDatabaseEnabled,
            psqlBuiltinEnabled: isPsqlBuiltinEnabled(),
            psqlPanelDsnDenied: isPsqlPanelDsnDenied(),
            botRuntimeRole: isBotRuntimeActive(),
        });

        if (req.query.format === "zip") {
            let archive: Uint8Array;
            try {
                archive = await exportProjectArchive(id, archiveData!.data, pythonCode, archiveData!.sources);
            } catch {
                res.status(422).json({ message: "Не удалось собрать полный архив: проверьте доступность медиафайлов проекта и их общий размер." });
                return;
            }
            res.setHeader("Content-Type", "application/zip");
            res.setHeader("Content-Disposition", `attachment; filename="bot-${id}.zip"`);
            res.send(Buffer.from(archive));
            return;
        }
        res.json({ code: pythonCode });
    } catch (error) {
        console.error("❌ Ошибка генерации кода:", error);
        res.status(500).json({ message: "Не удалось сгенерировать код", error: String(error) });
    }
}
