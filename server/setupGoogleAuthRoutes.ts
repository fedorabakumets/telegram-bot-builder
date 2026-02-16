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
                // Возвращаем HTML с ошибкой
                return res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Ошибка аутентификации</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 2rem; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .error { 
            color: #d32f2f; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="error">Ошибка аутентификации</h2>
        <p>Код авторизации не предоставлен или недействителен</p>
        <button onclick="window.close()">Закрыть вкладку</button>
    </div>
    <script>
        // Пытаемся сообщить родительскому окну об ошибке
        if (window.opener) {
            window.opener.postMessage({ type: 'auth-error', message: 'Authorization code is required' }, '*');
        }
    </script>
</body>
</html>`);
            }

            const token = await getToken(code);
            
            // Возвращаем HTML-страницу с успехом и автоматическим закрытием
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Аутентификация успешна</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 2rem; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .success { 
            color: #388e3c; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="success">Аутентификация успешна!</h2>
        <p>Вы успешно вошли в систему через Google</p>
        <p>Эта вкладка закроется автоматически</p>
        <button onclick="window.close()">Закрыть вкладку</button>
    </div>
    <script>
        // Сообщаем родительскому окну об успешной аутентификации
        if (window.opener) {
            window.opener.postMessage({ type: 'auth-success', token: ${JSON.stringify(token)} }, '*');
        }
        
        // Автоматически закрываем вкладку через 2 секунды
        setTimeout(function() {
            window.close();
        }, 2000);
    </script>
</body>
</html>`);
        } catch (error) {
            // Возвращаем HTML с ошибкой
            console.error("Ошибка обработки callback Google:", error);
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Ошибка аутентификации</title>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
            background-color: #f5f5f5; 
        }
        .container { 
            text-align: center; 
            background: white; 
            padding: 2rem; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .error { 
            color: #d32f2f; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="error">Ошибка аутентификации</h2>
        <p>Произошла ошибка при обработке аутентификации</p>
        <p>${error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
        <button onclick="window.close()">Закрыть вкладку</button>
    </div>
    <script>
        // Пытаемся сообщить родительскому окну об ошибке
        if (window.opener) {
            window.opener.postMessage({ type: 'auth-error', message: '${error instanceof Error ? error.message.replace(/'/g, "\\'") : 'Неизвестная ошибка'}' }, '*');
        }
    </script>
</body>
</html>`);
        }
    });
}