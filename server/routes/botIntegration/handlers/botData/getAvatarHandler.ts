/**
 * @fileoverview Хендлер получения аватарки пользователя или бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение аватарки через прокси.
 *
 * @module botIntegration/handlers/botData/getAvatarHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import { getRequestTokenId, resolveProjectBotToken } from "../../../utils/resolve-request-token";

/**
 * Обрабатывает запрос на получение аватарки пользователя или бота
 *
 * @function getAvatarHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getAvatarHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;
        const tokenId = getRequestTokenId(req);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        let avatarUrl: string | null = null;

        // Проверяем, это аватарка бота — ищем по userId среди всех токенов проекта
        const allTokens = await storage.getBotTokensByProject(projectId);
        const botToken = allTokens.find(t => t.token.split(':')[0] === userId);
        const isBotAvatar = userId === 'bot' || !!botToken;

        if (isBotAvatar) {
            const tokenToUse = botToken || await resolveProjectBotToken(projectId, tokenId);
            if (tokenToUse) {
                const botResult = await pool.query(
                    'SELECT bot_photo_url FROM bot_tokens WHERE id = $1',
                    [tokenToUse.id]
                );
                avatarUrl = botResult.rows[0]?.bot_photo_url || null;

                /**
                 * Вспомогательная функция: получает свежий file_id аватарки бота
                 * через getMyProfilePhotos и сохраняет в bot_tokens.bot_photo_url
                 * @returns file_id или null
                 */
                const fetchFreshBotFileId = async (): Promise<string | null> => {
                    try {
                        const photoResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getMyProfilePhotos`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 1 }) }
                        );
                        const photoData = await photoResp.json();
                        if (photoResp.ok && photoData.result?.total_count > 0) {
                            const freshFileId = photoData.result.photos[0].at(-1).file_id;
                            await pool.query('UPDATE bot_tokens SET bot_photo_url = $1 WHERE id = $2', [freshFileId, tokenToUse.id]);
                            return freshFileId;
                        }
                        // Аватарки нет — очищаем
                        await pool.query('UPDATE bot_tokens SET bot_photo_url = NULL WHERE id = $1', [tokenToUse.id]);
                        return null;
                    } catch (e) {
                        console.warn('[avatar] failed to fetch bot profile photos:', e);
                        return null;
                    }
                };

                // Если фото нет в базе — получаем из Telegram
                if (!avatarUrl) {
                    const freshFileId = await fetchFreshBotFileId();
                    if (freshFileId) {
                        // Резолвим file_id → URL для текущего запроса
                        const fileResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: freshFileId }) }
                        );
                        const fileData = await fileResp.json();
                        if (fileResp.ok && fileData.result?.file_path) {
                            avatarUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`;
                        }
                    }
                } else {
                    // file_id есть — резолвим в свежий URL
                    if (!avatarUrl.startsWith('http')) {
                        const fileResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: avatarUrl }) }
                        );
                        const fileData = await fileResp.json();
                        if (fileResp.ok && fileData.result?.file_path) {
                            avatarUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`;
                        } else {
                            // file_id устарел — обновляем
                            const freshFileId = await fetchFreshBotFileId();
                            if (freshFileId) {
                                const freshFileResp = await fetchWithProxy(
                                    `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: freshFileId }) }
                                );
                                const freshFileData = await freshFileResp.json();
                                if (freshFileResp.ok && freshFileData.result?.file_path) {
                                    avatarUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${freshFileData.result.file_path}`;
                                }
                            }
                        }
                    }
                    // avatarUrl уже https:// — оставляем как есть, протухание обработается ниже
                }
            }
        } else {
            // Ищем аватарку пользователя в bot_users
            let userResult = await pool.query(
                tokenId
                    ? 'SELECT avatar_url FROM bot_users WHERE user_id = $1 AND project_id = $2 AND token_id = $3'
                    : 'SELECT avatar_url FROM bot_users WHERE user_id = $1 AND project_id = $2',
                tokenId ? [userId, projectId, tokenId] : [userId, projectId]
            );
            avatarUrl = userResult.rows[0]?.avatar_url || null;
            console.log(`[avatar] bot_users lookup: user_id=${userId}, project_id=${projectId}, found=${avatarUrl ? 'yes' : 'no'}`);

            // Если не найдено, пробуем user_bot_data
            if (!avatarUrl) {
                userResult = await pool.query(
                    tokenId
                        ? 'SELECT avatar_url FROM user_bot_data WHERE user_id = $1 AND project_id = $2 AND token_id = $3'
                        : 'SELECT avatar_url FROM user_bot_data WHERE user_id = $1 AND project_id = $2',
                    tokenId ? [userId, projectId, tokenId] : [userId, projectId]
                );
                avatarUrl = userResult.rows[0]?.avatar_url || null;
                console.log(`[avatar] user_bot_data lookup: found=${avatarUrl ? 'yes' : 'no'}`);
            }
        }

        await pool.end();

        if (!avatarUrl) {
            console.log(`[avatar] avatarUrl is null for user_id=${userId}, project_id=${projectId}`);
            res.status(404).json({ message: "Аватарка не найдена" });
            return;
        }

        // Если avatarUrl — это file_id пользователя (не начинается с http), резолвим в URL
        let fetchUrl = avatarUrl;
        if (!avatarUrl.startsWith('http') && !isBotAvatar) {
            const tokenToUse = await resolveProjectBotToken(projectId, tokenId);
            if (!tokenToUse) {
                res.status(404).json({ message: "Токен бота не найден" });
                return;
            }
            try {
                const fileResp = await fetchWithProxy(
                    `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: avatarUrl }) }
                );
                const fileData = await fileResp.json();
                if (fileResp.ok && fileData.result?.file_path) {
                    fetchUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`;
                }
                // Если file_id устарел — нижний блок обновления поймает 404 и обновит
            } catch (e) {
                console.warn('[avatar] failed to resolve file_id to URL:', e);
                res.status(404).json({ message: "Не удалось получить аватарку" });
                return;
            }
        }

        // Проксируем файл скрывая токен бота от клиента
        console.log(`[avatar] fetching avatar for user_id=${userId}`);
        let response = await fetchWithProxy(fetchUrl);

        // URL протух (Telegram file-URL живут ограниченное время) — обновляем
        if (!response.ok) {
            console.log(`[avatar] URL expired (${response.status}), refreshing...`);
            try {
                const tokenToUse = await resolveProjectBotToken(projectId, tokenId);
                if (tokenToUse) {
                    if (isBotAvatar) {
                        // Для бота: сначала пробуем getMyProfilePhotos → свежий file_id
                        const photoResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getMyProfilePhotos`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 1 }) }
                        );
                        const photoData = await photoResp.json();
                        if (photoResp.ok && photoData.result?.total_count > 0) {
                            const freshFileId = photoData.result.photos[0].at(-1).file_id;
                            const { Pool } = await import('pg');
                            const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
                            const allTokens2 = await storage.getBotTokensByProject(projectId);
                            const tokenRec = allTokens2.find(t => t.id === tokenToUse.id);
                            if (tokenRec) {
                                await pool2.query('UPDATE bot_tokens SET bot_photo_url = $1 WHERE id = $2', [freshFileId, tokenRec.id]);
                            }
                            await pool2.end();
                            const fileResp = await fetchWithProxy(
                                `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: freshFileId }) }
                            );
                            const fileData = await fileResp.json();
                            if (fileResp.ok && fileData.result?.file_path) {
                                response = await fetchWithProxy(`https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`);
                            }
                        }

                        // Fallback: если getMyProfilePhotos не помог — пробуем file_id из БД напрямую
                        if (!response.ok) {
                            const { Pool } = await import('pg');
                            const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
                            const botResult2 = await pool2.query(
                                'SELECT bot_photo_url FROM bot_tokens WHERE id = $1',
                                [tokenToUse.id]
                            );
                            await pool2.end();
                            const storedFileId = botResult2.rows[0]?.bot_photo_url;
                            if (storedFileId && !storedFileId.startsWith('http')) {
                                // Это file_id — резолвим в свежий URL
                                const fileResp = await fetchWithProxy(
                                    `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                                    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: storedFileId }) }
                                );
                                const fileData = await fileResp.json();
                                if (fileResp.ok && fileData.result?.file_path) {
                                    response = await fetchWithProxy(`https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`);
                                }
                            }
                        }
                    } else {
                        // Для пользователя: getUserProfilePhotos
                        const photoResp = await fetchWithProxy(
                            `https://api.telegram.org/bot${tokenToUse.token}/getUserProfilePhotos`,
                            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, limit: 1 }) }
                        );
                        const photoData = await photoResp.json();
                        if (photoResp.ok && photoData.result?.total_count > 0) {
                            const freshFileId = photoData.result.photos[0].at(-1).file_id;
                            const fileResp = await fetchWithProxy(
                                `https://api.telegram.org/bot${tokenToUse.token}/getFile`,
                                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: freshFileId }) }
                            );
                            const fileData = await fileResp.json();
                            if (fileResp.ok && fileData.result?.file_path) {
                                const freshUrl = `https://api.telegram.org/file/bot${tokenToUse.token}/${fileData.result.file_path}`;
                                // Сохраняем свежий file_id в БД
                                const { Pool } = await import('pg');
                                const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
                                await pool2.query(
                                    'UPDATE bot_users SET avatar_url = $1 WHERE user_id = $2 AND project_id = $3',
                                    [freshFileId, userId, projectId]
                                );
                                await pool2.end();
                                response = await fetchWithProxy(freshUrl);
                            }
                        } else {
                            // Аватарки больше нет — очищаем протухший URL
                            const { Pool } = await import('pg');
                            const pool2 = new Pool({ connectionString: process.env.DATABASE_URL });
                            await pool2.query(
                                'UPDATE bot_users SET avatar_url = NULL WHERE user_id = $1 AND project_id = $2',
                                [userId, projectId]
                            );
                            await pool2.end();
                        }
                    }
                }
            } catch (e) {
                console.warn('[avatar] failed to refresh expired URL:', e);
            }
        }

        if (!response.ok) {
            res.status(404).json({ message: "Не удалось получить аватарку" });
            return;
        }

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Ошибка получения аватарки:", error);
        res.status(500).json({ message: "Не удалось получить аватарку" });
    }
}
