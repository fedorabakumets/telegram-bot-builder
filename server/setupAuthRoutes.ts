/**
 * @fileoverview Модуль для настройки маршрутов аутентификации через Telegram
 *
 * Этот модуль предоставляет функции для настройки маршрутов аутентификации,
 * позволяющие пользователям входить в систему с помощью аккаунта Telegram.
 *
 * Включает в себя:
 * - Страницу входа с виджетом авторизации Telegram
 * - Обработку данных авторизации от Telegram
 * - Получение информации о пользователе по ID
 *
 * @module setupAuthRoutes
 */

import type { Express } from "express";
import { storage } from "./storage";

/**
 * Настраивает маршруты аутентификации через Telegram
 *
 * @function setupAuthRoutes
 * @param {Express} app - Экземпляр приложения Express
 * @returns {void}
 *
 * @description
 * Функция устанавливает следующие маршруты:
 * - GET /api/auth/login - отображает страницу входа с виджетом Telegram
 * - POST /api/auth/telegram - обрабатывает данные авторизации от Telegram
 * - GET /api/auth/telegram/user/:id - возвращает информацию о пользователе по ID
 */
export function setupAuthRoutes(app: Express) {
    /**
     * Обработчик маршрута GET /api/auth/login
     *
     * Отображает HTML-страницу с виджетом авторизации Telegram для входа пользователя
     *
     * @route GET /api/auth/login
     * @param {_req} _req - Объект запроса (не используется)
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Генерирует HTML-страницу с виджетом авторизации Telegram, который позволяет
     * пользователю войти в систему с помощью своего аккаунта Telegram.
     * Использует переменную окружения VITE_TELEGRAM_BOT_USERNAME для указания
     * имени бота, через который будет происходить авторизация.
     */
    app.get("/api/auth/login", (_req, res) => {
        const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || 'botcraft_studio_bot';
        const cleanBotUsername = botUsername.replace('@', '');

        const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход - BotCraft Studio</title>
  <script async src="https://telegram.org/js/telegram-widget.js?22"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    h1 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }
    p {
      margin: 0 0 30px 0;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Вход в BotCraft Studio</h1>
    <p>Используйте свой аккаунт Telegram для входа</p>
    <script
      async
      src="https://telegram.org/js/telegram-widget.js?22"
      data-telegram-login="${cleanBotUsername}"
      data-size="large"
      data-onauth="onTelegramAuth(user)"
      data-request-access="write">
    </script>
  </div>

  <script>
    function onTelegramAuth(user) {
      // Отправляем данные в основное окно
      if (window.opener) {
        window.opener.postMessage({
          type: 'telegram-auth',
          user: user
        }, window.location.origin);

        // Закрываем окно авторизации через 2 секунды
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    }
  </script>
</body>
</html>
    `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    });

    /**
     * Обработчик маршрута POST /api/auth/telegram
     *
     * Обрабатывает данные авторизации, полученные от виджета Telegram Login
     *
     * @route POST /api/auth/telegram
     * @param {Object} req - Объект запроса, содержащий данные пользователя от Telegram
     * @param {Object} req.body - Данные пользователя
     * @param {number} req.body.id - Уникальный идентификатор пользователя Telegram
     * @param {string} req.body.first_name - Имя пользователя
     * @param {string} req.body.last_name - Фамилия пользователя (может отсутствовать)
     * @param {string} req.body.username - Имя пользователя в Telegram (может отсутствовать)
     * @param {string} req.body.photo_url - URL фото пользователя (может отсутствовать)
     * @param {number} req.body.auth_date - Временная метка аутентификации
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Сохраняет или обновляет информацию о пользователе в базе данных,
     * регенерирует сессию и сохраняет данные пользователя в сессии.
     * Отправляет успешный ответ при успешной аутентификации или
     * ошибку при проблемах с сессией или отсутствии ID пользователя.
     */
    app.post("/api/auth/telegram", async (req, res) => {
        try {
            const { id, first_name, last_name, username, photo_url, auth_date } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID обязателен"
                });
            }

            // TODO: Verify hash signature using bot token for security
            // For now, just save to database - authentication is handled by Telegram widget
            // Сохраняем или обновляем пользователя в БД
            const userData = await storage.getTelegramUserOrCreate({
                id,
                firstName: first_name,
                lastName: last_name,
                username,
                photoUrl: photo_url,
                authDate: auth_date ? parseInt(auth_date.toString()) : undefined
            });

            // КРИТИЧНО: Регенерируем сессию и сохраняем в БД ПЕРЕД отправкой response
            if (req.session) {
                // Промисифицируем методы сессии
                const regenerateSession = () => {
                    return new Promise<void>((resolve, reject) => {
                        req.session!.regenerate((err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                };

                const saveSession = () => {
                    return new Promise<void>((resolve, reject) => {
                        req.session!.save((err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                };

                try {
                    await regenerateSession();
                    req.session!.telegramUser = userData;
                    await saveSession();

                    console.log(`✅ Telegram auth successful for user: ${first_name} (@${username}) - Session SAVED with ID: ${userData.id}`);

                    return res.json({
                        success: true,
                        message: "Авторизация успешна",
                        user: userData
                    });
                } catch (sessionError: any) {
                    console.error("❌ Session operation error:", sessionError);
                    return res.status(500).json({
                        success: false,
                        error: "Ошибка работы с сессией"
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    error: "Сессия не инициализирована"
                });
            }
        } catch (error: any) {
            console.error("Telegram auth error:", error);
            return res.status(500).json({
                success: false,
                error: "Ошибка авторизации"
            });
        }
    });

    /**
     * Обработчик маршрута GET /api/auth/telegram/user/:id
     *
     * Возвращает информацию о пользователе Telegram по его уникальному идентификатору
     *
     * @route GET /api/auth/telegram/user/:id
     * @param {Object} req - Объект запроса
     * @param {Object} req.params - Параметры запроса
     * @param {string} req.params.id - Уникальный идентификатор пользователя Telegram
     * @param {Object} res - Объект ответа
     * @returns {void}
     *
     * @description
     * Получает информацию о пользователе из базы данных по его ID.
     * Возвращает успешный ответ с данными пользователя или ошибку,
     * если пользователь не найден или ID некорректен.
     */
    app.get("/api/auth/telegram/user/:id", async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: "User ID required"
                });
            }

            const user = await storage.getTelegramUser(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            return res.json({
                success: true,
                user
            });
        } catch (error: any) {
            console.error("Get telegram user error:", error);
            return res.status(500).json({
                success: false,
                error: "Error getting user"
            });
        }
    });
}
