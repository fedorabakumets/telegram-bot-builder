/**
 * @fileoverview Выполняет сопутствующие действия после подтверждённой записи проекта.
 */
import type { Request } from "express";
import type { BotProject } from "@shared/schema";
import type { StorageBotProjectUpdate } from "../../../storages/storageTypes";
import { storage } from "../../../storages/storage";
import { restartAllRunningBots } from "../../../bots/restartAllRunningBots";
import { syncContentToTable } from "../../../services/content-table";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { broadcastAgentCanvasUpdate } from "../../../canvas/broadcastAgentCanvasUpdate";
import { parseAgentCanvasData } from "../../../canvas/parse-agent-canvas-data";
import { broadcastProjectsChangedToUsers } from "../../../terminal/broadcastProjectsChanged";
import { getProjectMemberIds } from "../../../terminal/resolveProjectMembers";
import { snapshotDigest } from '../../../database/version-object-codec';
/**
 * Возвращает статусы попыток побочных эффектов без отмены уже выполненного сохранения.
 * @param req - Контекст запроса
 * @param project - Записанная строка проекта
 * @param validatedData - Применённые поля
 * @param commitMessage - Заметка версии
 * @returns Машиночитаемые статусы эффектов
 */
export async function runProjectUpdateEffects(req: Request, project: BotProject, validatedData: StorageBotProjectUpdate, commitMessage: string) {
 const projectId = project.id;
 const sideEffects: Record<string, unknown> = { contentSync: 'not_requested', version: 'not_requested', liveBroadcast: 'not_requested', runtimeApply: 'not_requested', projectList: 'not_requested', runtimeContentReload: 'not_requested' };
        // Синхронизация контента в таблицу _content
        if (validatedData.data) {
            try {
                const contentRevision = await syncContentToTable(projectId, validatedData.data);
                sideEffects.contentRevision = contentRevision ?? null;
                sideEffects.contentSync = "synced";
                // Уведомляем бота о обновлении контента через Redis
                try {
                    const { getRedisPublisher } = await import("../../../redis/redisClient");
                    const pub = getRedisPublisher();
                    if (pub) {
                        await pub.publish(`bot:table_updated:${projectId}`, "reload");
                        sideEffects.runtimeContentReload = "published";
                    } else sideEffects.runtimeContentReload = "unavailable";
                } catch { sideEffects.runtimeContentReload = "failed"; }
            } catch (err) {
                sideEffects.contentSync = "failed";
                console.error(`[updateProjectHandler] Ошибка синхронизации _content для проекта ${projectId}:`, err);
            }

            // Создание снимка версии проекта (история + откат)
            try {
                // Признак авторства MCP-агента: при agentEdit=true у запроса нет
                // сессии (authorId=null), поэтому помечаем снимок author_kind='agent',
                // чтобы в истории версий отобразить автора «ИИ-агент».
                const authorKind = req.isAdminRequest ? 'admin' : req.body?.agentEdit === true ? 'agent' : undefined;
                if (commitMessage) {
                    // Ручной чекпоинт: создаётся всегда по явному намерению
                    // пользователя — без дедупликации и без очистки истории.
                    await storage.createProjectVersion(projectId, validatedData.data, commitMessage, getOwnerIdFromRequest(req), 'manual', authorKind);
                } else {
                    // Авто-снимок: дедупликация + ограничение истории до 30 версий.
                    // Дедупликация: не создаём новый снимок, если самая свежая
                    // версия проекта идентична текущим данным (по JSON-представлению)
                    const latest = await storage.getLatestProjectVersion(projectId);
                    const isDuplicate = latest != null && latest.snapshotSha256 === snapshotDigest(validatedData.data).sha256;
                    if (!isDuplicate) {
                        await storage.createProjectVersion(projectId, validatedData.data, project.name, project.ownerId ?? null, 'auto', authorKind);
                        await storage.pruneProjectVersions(projectId, 30);
                    }
                }
                sideEffects.version = "created_or_unchanged";
            } catch (err) {
                sideEffects.version = "failed";
                console.error(`[updateProjectHandler] Ошибка создания снимка версии для проекта ${projectId}:`, err);
            }

            // Live-редактирование: правка от MCP-агента вещается на открытый холст
            // с actor.kind='agent' (без пометки «несохранённые изменения» на клиенте).
            if (req.body?.agentEdit === true) {
                try {
                    const canvasData = parseAgentCanvasData(validatedData.data);
                    broadcastAgentCanvasUpdate(projectId, canvasData, {
                        sessionId: req.body.agentSessionId,
                        displayName: req.body.agentDisplayName,
                        /** Позволяет интерфейсу отвергнуть запоздавший снимок. */
                        revision: project.revision,
                    });
                    sideEffects.liveBroadcast = "broadcast_attempted";
                } catch (err) {
                    sideEffects.liveBroadcast = "failed";
                    console.error(`[updateProjectHandler] Ошибка broadcast canvas-sync для проекта ${projectId}:`, err);
                }
            }
        }

        if (validatedData.data && validatedData.restartOnUpdate) {
            console.log(`Проект ${projectId} обновлён, перезапуск всех запущенных ботов...`);
            try {
            const restartResult = await restartAllRunningBots(projectId);
            sideEffects.runtimeApply = restartResult.ok && restartResult.failed === 0 ? "restarted" : "failed";
            if (!restartResult.ok) {
                console.error(`Проект ${projectId}: ${restartResult.message}`);
            } else if (restartResult.failed > 0) {
                console.error(
                    `Проект ${projectId}: перезапущено ${restartResult.restarted}, ошибок ${restartResult.failed}`,
                );
            }
            } catch { sideEffects.runtimeApply = "failed"; }
        }

        // Live-обновление списка проектов: имя в списке могло измениться (rename).
        // Эмитим только при изменении имени, чтобы не дублировать canvas-broadcast
        // при правках сценария (data). Для общих проектов уведомляем владельца и
        // всех коллабораторов, чтобы их список обновился без перезагрузки.
        if (validatedData.name !== undefined) {
            try {
                const ownerId = project.ownerId ?? getOwnerIdFromRequest(req);
                const members = await getProjectMemberIds(projectId, ownerId);
                broadcastProjectsChangedToUsers(members, 'renamed');
                sideEffects.projectList = 'broadcast_attempted';
            } catch (err) {
                sideEffects.projectList = "failed";
                console.error(`[updateProjectHandler] Ошибка broadcast projects-changed для проекта ${projectId}:`, err);
            }
        }

 return sideEffects;
}
