/**
 * @fileoverview Модуль для настройки маршрутов OAuth аутентификации Google
 *
 * Этот модуль предоставляет функции для настройки маршрутов,
 * необходимых для OAuth аутентификации с Google API.
 *
 * @module setupGoogleAuthRoutes
 */

import { Express } from "express";
import { getAuthUrl, getToken } from "./google-sheets";

/**
 * Настраивает маршруты для OAuth аутентификации Google
 *
 * @function setupGoogleAuthRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/google-auth/start - инициирует процесс аутентификации
 * - GET /api/google-auth/callback - обрабатывает callback от Google
 */
export function setupGoogleAuthRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/google-auth/start
     *
     * Инициирует процесс аутентификации с Google
     *
     * @route GET /api/google-auth/start
     * @param {Object} req - Объект запроса
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Возвращает URL для аутентификации с Google. Клиент должен
     * перенаправить пользователя по этому URL для предоставления
     * доступа к Google Sheets API.
     */
    app.get("/api/google-auth/start", async (req, res) => {
        try {
            const authUrl = await getAuthUrl();
            res.json({ authUrl });
        } catch (error) {
            console.error("Ошибка запуска аутентификации Google:", error);
            res.status(500).json({ message: "Failed to initiate Google authentication", error: (error as Error).message });
        }
    });

    /**
     * Обработчик маршрута GET /api/google-auth/callback
     *
     * Обрабатывает callback от Google после аутентификации
     *
     * @route GET /api/google-auth/callback
     * @param {Object} req - Объект запроса
     * @param {Object} req.query - Параметры запроса
     * @param {string} req.query.code - Код авторизации от Google
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Обрабатывает код авторизации, полученный от Google,
     * и обменивает его на токен доступа.
     */
    app.get("/api/google-auth/callback", async (req, res) => {
        try {
            const { code } = req.query;

            if (!code || typeof code !== 'string') {
                return res.status(400).json({ message: "Authorization code is required" });
            }

            const token = await getToken(code);
            res.json({ 
                success: true, 
                message: "Authentication successful", 
                token 
            });
        } catch (error) {
            console.error("Ошибка обработки callback Google:", error);
            res.status(500).json({ message: "Failed to handle Google authentication callback", error: (error as Error).message });
        }
    });
}