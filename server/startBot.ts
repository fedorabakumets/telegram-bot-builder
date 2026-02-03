/**
 * Модуль для запуска дочерних процессов
 * @external child_process
 */
import { spawn } from "node:child_process";

/**
 * Модуль для работы с URL
 * @external url
 */
import { URL } from "node:url";

/**
 * Модуль для работы с путями к файлам
 * @external path
 */
import { dirname } from "node:path";

/**
 * Глобальная коллекция активных процессов ботов
 * @external botProcesses
 * @see {@link ./routes}
 */
import { botProcesses } from "./routes";

/**
 * Функция для создания полного комплекта файлов бота
 * @external createCompleteBotFiles
 * @see {@link ./createBotFile}
 */
import { createCompleteBotFiles } from "./createBotFile";

/**
 * Модуль для взаимодействия с хранилищем данных
 * @external storage
 * @see {@link ./storage}
 */
import { storage } from "./storage";

/**
 * Запускает новый экземпляр Telegram-бота по идентификатору проекта и токену
 *
 * @param {number} projectId - Идентификатор проекта, к которому относится бот
 * @param {string} token - Токен Telegram-бота, используемый для аутентификации
 * @param {number} tokenId - Идентификатор токена в системе
 *
 * @returns {Promise<{ success: boolean; error?: string; processId?: string; }>} Объект с результатом операции:
 *   - success: true если бот успешно запущен, false в случае ошибки
 *   - error: строка с описанием ошибки, если она произошла
 *   - processId: идентификатор процесса запущенного бота (если успешно запущен)
 *
 * @description
 * Функция выполняет следующие действия:
 * 1. Проверяет наличие старых процессов для данного токена и убивает их
 * 2. Удаляет старый процесс из памяти, если он существует
 * 3. Сбрасывает webhook в Telegram для избежания конфликтов
 * 4. Получает данные проекта из хранилища
 * 5. Преобразует многолистовую структуру данных в простую
 * 6. Генерирует Python-код бота с использованием генератора
 * 7. Создает необходимые файлы бота
 * 8. Запускает процесс бота с нужными параметрами
 * 9. Регистрирует процесс в системе управления процессами
 * 10. Обновляет статус бота в базе данных
 * 11. Устанавливает обработчики событий процесса (ошибки, завершение)
 *
 * @example
 * ```typescript
 * const result = await startBot(123, "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", 456);
 * if (result.success) {
 *   console.log('Бот успешно запущен с PID:', result.processId);
 * } else {
 *   console.error('Ошибка при запуске бота:', result.error);
 * }
 * ```
 */
export async function startBot(projectId: number, token: string, tokenId: number): Promise<{ success: boolean; error?: string; processId?: string; }> {
  try {
    const processKey = `${projectId}_${tokenId}`;

    // КРИТИЧЕСКИ ВАЖНО: Сначала убиваем ВСЕ старые процессы с этим токеном
    console.log(`🔍 Проверяем наличие старых процессов для бота ${projectId} (токен ${tokenId})...`);
    try {
      const { execSync } = await import('child_process');
      const botFileName = `bot_${projectId}_${tokenId}.py`;

      // Находим все Python процессы с этим файлом
      try {
        const psCommand = process.platform === 'win32'
          ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV | findstr "${botFileName}"`
          : `ps aux | grep python | grep "${botFileName}" | grep -v grep`;
        const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();

        if (allPythonProcesses) {
          const lines = allPythonProcesses.split('\n').filter((line: string) => line.trim());
          console.log(`⚠️ Найдено ${lines.length} старых процессов для токена ${tokenId}. Останавливаем...`);

          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);
            if (pid && !isNaN(pid)) {
              try {
                console.log(`💀 Убиваем старый процесс ${pid} для токена ${tokenId}`);
                execSync(`kill -9 ${pid}`, { encoding: 'utf8' });
                await new Promise(resolve => setTimeout(resolve, 100)); // Даем время процессу завершиться
              } catch (killError) {
                console.log(`Процесс ${pid} уже завершен`);
              }
            }
          }

          // Ждем немного чтобы процессы точно завершились
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.log(`✅ Старых процессов для токена ${tokenId} не найдено`);
        }
      } catch (grepError) {
        // Процессы не найдены - это хорошо
        console.log(`✅ Старых процессов для токена ${tokenId} не найдено`);
      }
    } catch (error) {
      console.log(`Ошибка при поиске старых процессов:`, error);
    }

    // Удаляем процесс из памяти если он там есть
    if (botProcesses.has(processKey)) {
      const oldProcess = botProcesses.get(processKey);
      try {
        oldProcess?.kill('SIGKILL');
      } catch (e) {
        // Игнорируем ошибки
      }
      botProcesses.delete(processKey);
      console.log(`🗑️ Удалили старый процесс из памяти для токена ${tokenId}`);
    }

    // Сбрасываем webhook в Telegram чтобы избежать конфликтов
    try {
      const webhookUrl = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
      await fetch(webhookUrl);
      console.log(`🧹 Webhook сброшен для токена ${tokenId}`);
    } catch (webhookError) {
      console.log(`Не удалось сбросить webhook:`, webhookError);
    }

    const project = await storage.getBotProject(projectId);
    if (!project) {
      return { success: false, error: "Проект не найден" };
    }

    // Преобразуем многолистовую структуру в простую для генератора
    const convertSheetsToSimpleBotData = (data: any) => {
      // Если уже простая структура - возвращаем как есть
      if (data.nodes && data.connections) {
        return data;
      }

      // Если многолистовая структура - собираем все узлы и связи
      if (data.sheets && Array.isArray(data.sheets)) {
        let allNodes: any[] = [];
        let allConnections: any[] = [];

        data.sheets.forEach((sheet: any) => {
          if (sheet.nodes) allNodes.push(...sheet.nodes);
          if (sheet.connections) allConnections.push(...sheet.connections);
        });

        // Добавляем межлистовые связи
        if (data.interSheetConnections) {
          allConnections.push(...data.interSheetConnections);
        }

        return {
          nodes: allNodes,
          connections: allConnections
        };
      }

      // Если нет узлов вообще - возвращаем пустую структуру
      return {
        nodes: [],
        connections: []
      };
    };

    // Генерируем код бота через клиентский генератор (с cache busting)
    const modUrl = new URL("../client/src/lib/bot-generator.ts", import.meta.url);
    modUrl.searchParams.set("t", Date.now().toString());
    const { generatePythonCode } = await import(modUrl.href);
    const simpleBotData = convertSheetsToSimpleBotData(project.data);
    const userDatabaseEnabled = project.userDatabaseEnabled === 1;
    const botCode = generatePythonCode(simpleBotData as any, project.name, [], userDatabaseEnabled, projectId, false).replace('YOUR_BOT_TOKEN_HERE', token);

    // Создаем все файлы бота (основной файл + сопутствующие)
    const { mainFile, assets } = await createCompleteBotFiles(botCode, project.name, project.data, projectId, tokenId);

    console.log(`📁 Созданы файлы бота:`);
    console.log(`   - Основной файл: ${mainFile}`);
    console.log(`   - Дополнительные файлы: ${assets.length} шт.`);
    assets.forEach(asset => console.log(`     * ${asset}`));

    // Запускаем бота
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    const botProcess = spawn(pythonPath, [mainFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      cwd: dirname(mainFile), // Устанавливаем рабочую директорию в папку бота
      env: {
        ...process.env,
        PROJECT_ID: projectId.toString(),
        BOT_TOKEN: token,
        API_BASE_URL: process.env.NODE_ENV === 'production'
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`
          : 'http://localhost:5000'
      }
    });

    // Логируем вывод процесса
    botProcess.stdout?.on('data', (data) => {
      console.log(`Бот ${projectId} stdout:`, data.toString());
    });

    botProcess.stderr?.on('data', (data) => {
      console.error(`Бот ${projectId} stderr:`, data.toString());
    });

    const processId = botProcess.pid?.toString();

    // Сохраняем процесс
    botProcesses.set(processKey, botProcess);

    // Создаем или обновляем запись в базе данных
    const existingBotInstance = await storage.getBotInstance(projectId);
    if (existingBotInstance) {
      await storage.updateBotInstance(existingBotInstance.id, {
        status: 'running',
        token,
        processId,
        errorMessage: null,
        startedAt: new Date()
      });
    } else {
      await storage.createBotInstance({
        projectId,
        tokenId,
        status: 'running',
        token,
        processId,
      });
    }

    // Обрабатываем события процесса
    botProcess.on('error', async (error) => {
      console.error(`Ошибка запуска бота ${projectId} (токен ${tokenId}):`, error);
      try {
        // Проверяем, что пул соединений все еще активен перед обращением к базе данных
        if ((globalThis as any).__dbPoolActive !== false) {
          const instance = await storage.getBotInstance(projectId);
          if (instance) {
            await storage.updateBotInstance(instance.id, {
              status: 'error',
              errorMessage: error.message
            });
          }
        } else {
          console.log(`⚠️ Пропускаем обновление статуса бота в базе данных - пул соединений закрыт`);
        }
      } catch (dbError) {
        console.error(`Ошибка обновления статуса бота в базе данных:`, dbError);
      }
      botProcesses.delete(processKey);
    });

    botProcess.on('exit', async (code, signal) => {
      console.log(`Бот ${projectId} (токен ${tokenId}) завершен с кодом ${code}, сигнал: ${signal}`);
      try {
        // Проверяем, что пул соединений все еще активен перед обращением к базе данных
        if ((globalThis as any).__dbPoolActive !== false) {
          const instance = await storage.getBotInstance(projectId);
          if (instance) {
            await storage.updateBotInstance(instance.id, {
              status: 'stopped',
              errorMessage: code !== 0 ? `Процесс завершен с кодом ${code}` : null
            });
          }
        } else {
          console.log(`⚠️ Пропускаем обновление статуса бота в базе данных - пул соединений закрыт`);
        }
      } catch (dbError) {
        console.error(`Ошибка обновления статуса бота в базе данных:`, dbError);
      }
      botProcesses.delete(processKey);
    });

    return { success: true, processId };
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
