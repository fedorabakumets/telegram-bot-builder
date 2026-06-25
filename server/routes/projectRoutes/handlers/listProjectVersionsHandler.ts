/**
 * @fileoverview Хендлер получения списка версий проекта
 *
 * Возвращает метаданные версий (без тяжёлого snapshot) для экономии трафика.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/listProjectVersionsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на получение списка версий проекта
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function listProjectVersionsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        if (isNaN(projectId) || !projectId) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const versions = await storage.listProjectVersions(projectId);

        // Собираем имена авторов по уникальным authorId (один проход)
        const uniqueAuthorIds = Array.from(
            new Set(versions.map((v) => v.authorId).filter((id): id is number => id != null)),
        );
        const authorNames = new Map<number, string>();
        await Promise.all(uniqueAuthorIds.map(async (authorId) => {
            const user = await storage.getTelegramUser(authorId);
            if (!user) return;
            const name = [user.firstName, user.username ? `@${user.username}` : null]
                .filter(Boolean)
                .join(" ");
            if (name) authorNames.set(authorId, name);
        }));

        // Возвращаем только метаданные без snapshot для экономии трафика
        const meta = versions.map((v) => {
            // Имя автора: сначала реальное имя пользователя по authorId; если его
            // нет, но снимок создан MCP-агентом (authorKind='agent') — «ИИ-агент».
            const realName = v.authorId != null ? authorNames.get(v.authorId) : undefined;
            const authorName = realName ?? (v.authorKind === "agent" ? "ИИ-агент" : undefined);
            return {
                id: v.id,
                projectId: v.projectId,
                label: v.label,
                authorId: v.authorId,
                authorName,
                authorKind: v.authorKind,
                kind: v.kind,
                createdAt: v.createdAt,
            };
        });
        res.json(meta);
    } catch (error) {
        console.error("Ошибка получения версий проекта:", error);
        res.status(500).json({ message: "Не удалось получить версии проекта", error: (error as Error).message });
    }
}
