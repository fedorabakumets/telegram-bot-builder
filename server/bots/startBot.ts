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
import { dirname, join } from "node:path";
import { fetchWithProxy } from "../utils/telegram-proxy";
import { generatePythonCode } from "../../lib/bot-generator";

/**
 * Глобальная коллекция активных процессов ботов
 * @external botProcesses
 * @see {@link ./routes}
 */
import { botProcesses } from "../routes/routes";

/**
 * Хранилище cleanup-функций для удаления слушателей stdout/stderr
 * @external processCleanups
 * @see {@link ../terminal/setupBotProcessListeners}
 */
import { processCleanups } from "../terminal/setupBotProcessListeners";

/**
 * Функция для создания полного комплекта файлов бота
 * @external createCompleteBotFiles
 * @see {@link ./createBotFile}
 */
import { createCompleteBotFiles } from "../files/createBotFile";
import { normalizeProjectNameToFile } from "../files/normalizeFileName";

/**
 * Модуль для взаимодействия с хранилищем данных
 * @external storage
 * @see {@link ./storage}
 */
import { storage } from "../storages/storage";
import { broadcastProjectEvent } from '../terminal/broadcastProjectEvent';
import { pendingLaunchIds } from '../terminal/setupBotProcessListeners';



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
export async function startBot(projectId: number, token: string, tokenId: number): Promise<{ success: boolean; error?: string; processId?: string | undefined; }> {
  try {
    const processKey = `${projectId}_${tokenId}`;

    // КРИТИЧЕСКИ ВАЖНО: Сначала убиваем ВСЕ старые процессы с этим токеном
    console.log(`🔍 Проверяем наличие старых процессов для бота ${projectId} (токен ${tokenId})...`);
    try {
      const { execSync } = await import('child_process');

      // Находим все Python процессы, содержащие идентификаторы проекта и токена
      // Это позволяет находить процессы даже с кастомными именами файлов
      try {
        // Ищем процесс с конкретным projectId и tokenId
        const searchPattern = `PROJECT_ID=${projectId}`;
        const tokenIdPattern = `TOKEN_ID=${tokenId}`;
        const psCommand = process.platform === 'win32'
          ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV`
          : `ps aux | grep python`;
        const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();

        if (allPythonProcesses) {
          // Фильтруем только процессы с этим projectId И tokenId
          const lines = allPythonProcesses.split('\n').filter((line: string) => {
            const hasProjectId = line.trim().includes(searchPattern);
            const hasTokenId = line.trim().includes(tokenIdPattern);
            return line.trim() && hasProjectId && hasTokenId;
          });

          if (lines.length > 0) {
            console.log(`⚠️ Найдено ${lines.length} старых процессов для проекта ${projectId}. Останавливаем...`);

            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              // На разных платформах PID может быть на разных позициях
              let pid: number | null = null;

              if (process.platform === 'win32') {
                // В Windows PID обычно во втором столбце
                pid = parseInt(parts[1]);
              } else {
                // В Unix-подобных системах PID обычно во втором столбце (после USER)
                pid = parseInt(parts[1]);
              }

              if (pid && !isNaN(pid)) {
                try {
                  console.log(`💀 Убиваем старый процесс ${pid} для проекта ${projectId}`);
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
            console.log(`✅ Старых процессов для проекта ${projectId} не найдено`);
          }
        } else {
          console.log(`✅ Старых процессов для проекта ${projectId} не найдено`);
        }
      } catch (grepError) {
        // Процессы не найдены - это хорошо
        console.log(`✅ Старых процессов для проекта ${projectId} не найдено`);
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
      // Удаляем слушатели старого процесса перед удалением из памяти
      const cleanup = processCleanups.get(processKey);
      if (cleanup) {
        cleanup();
        processCleanups.delete(processKey);
      }
      botProcesses.delete(processKey);
      console.log(`🗑️ Удалили старый процесс из памяти для токена ${tokenId}`);
    }

    // Сбрасываем webhook в Telegram чтобы избежать конфликтов
    try {
      const webhookUrl = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
      await fetchWithProxy(webhookUrl);
      console.log(`🧹 Webhook сброшен для токена ${tokenId}`);
    } catch (webhookError) {
      console.log(`Не удалось сбросить webhook:`, webhookError);
    }

    const project = await storage.getBotProject(projectId);
    if (!project) {
      return { success: false, error: "Проект не найден" };
    }

    console.log(`📊 Проект ${projectId} загружен из БД:`);
    console.log(`   project.userDatabaseEnabled:`, project.userDatabaseEnabled);
    console.log(`   typeof project.userDatabaseEnabled:`, typeof project.userDatabaseEnabled);

    const userDatabaseEnabled = project.userDatabaseEnabled === 1;
    // Получаем настройки генерации комментариев из переменной окружения (по умолчанию выключено)
    const enableComments = process.env.BOTCRAFT_COMMENTS_GENERATION === 'true';
    
    console.log(`🔧 Генерация кода бота:`);
    console.log(`   userDatabaseEnabled:`, userDatabaseEnabled);
    
    const botCode = generatePythonCode(project.data as any, {
      botName: project.name,
      userDatabaseEnabled,
      projectId,
      enableComments,
      enableLogging: false,
      enableGroupHandlers: false,
      groups: [],
    });
    
    // Проверяем, содержит ли код функции БД
    const hasDbInit = botCode.includes('async def init_database()');
    const hasDbPool = botCode.includes('db_pool');
    console.log(`📝 Проверка сгенерированного кода:`);
    console.log(`   init_database присутствует:`, hasDbInit);
    console.log(`   db_pool присутствует:`, hasDbPool);

    // Нормализуем имя проекта для использования в качестве имени файла
    const customFileName = normalizeProjectNameToFile(project.name);

    // Создаем все файлы бота (основной файл + сопутствующие)
    const { mainFile, assets } = await createCompleteBotFiles(botCode, project.name, project.data, projectId, tokenId, customFileName);

    console.log(`📁 Созданы файлы бота:`);
    console.log(`   - Основной файл: ${mainFile}`);
    console.log(`   - Дополнительные файлы: ${assets.length} шт.`);
    assets.forEach((asset: string) => console.log(`     * ${asset}`));

    // Устанавливаем зависимости из requirements.txt перед запуском бота
    const skipPipInstall = process.env.SKIP_PIP_INSTALL === 'true';
    if (!skipPipInstall) {
    try {
      const { execSync } = await import('child_process');
      const botsDir = dirname(mainFile);
      const requirementsFile = join(botsDir, 'requirements.txt');
      
      // Проверяем существование requirements.txt
      const { existsSync } = await import('fs');
      if (existsSync(requirementsFile)) {
        console.log('📦 Установка зависимостей из requirements.txt...');
        const pipCommand = process.platform === 'win32'
          ? `pip install -r "${requirementsFile}" --quiet`
          : `pip3 install -r "${requirementsFile}" --quiet`;
        execSync(pipCommand, { stdio: 'ignore' });
        console.log('✅ Зависимости установлены');
      }
    } catch (pipError) {
      console.log('⚠️ Не удалось установить зависимости (продолжаем запуск):', pipError instanceof Error ? pipError.message : pipError);
    }
    }

    // Запускаем бота
    const pythonPath = process.platform === 'win32'
      ? 'C:\\Users\\1\\AppData\\Local\\Programs\\Python\\Python313\\python.exe'
      : 'python3';
    const botProcess = spawn(pythonPath, [mainFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      cwd: dirname(mainFile), // Устанавливаем рабочую директорию в папку бота
      env: {
        ...process.env,
        PROJECT_ID: projectId.toString(),
        TOKEN_ID: tokenId.toString(),
        BOT_TOKEN: token,
        API_BASE_URL: process.env.NODE_ENV === 'production'
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`
          : 'http://localhost:5000'
      }
    });

    // Используем глобальную функцию для отправки вывода в терминал

    const processId = botProcess.pid?.toString();

    // Создаём запись в истории запусков
    let launchId: number | undefined;
    try {
      const launchRecord = await storage.createLaunchHistory({
        projectId,
        tokenId,
        status: 'running',
        processId,
      });
      launchId = launchRecord.id;
    } catch (historyError) {
      console.error('Ошибка создания записи истории запуска:', historyError);
    }

    // Регистрируем launchId до сохранения процесса, чтобы слушатель его подхватил
    if (launchId !== undefined) {
      pendingLaunchIds.set(processKey, launchId);
    }

    // Сохраняем процесс
    botProcesses.set(processKey, botProcess);

    // Рассылаем событие о запуске бота всем клиентам проекта
    broadcastProjectEvent(projectId, {
      type: 'bot-started',
      projectId,
      tokenId,
      timestamp: new Date().toISOString(),
    });

    // Создаем или обновляем запись в базе данных для конкретного токена
    const existingBotInstance = await storage.getBotInstanceByToken(tokenId);
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
        if ((globalThis as any).__dbPoolActive !== false) {
          if (launchId !== undefined) {
            await storage.updateLaunchHistory(launchId, {
              status: 'error',
              stoppedAt: new Date(),
              errorMessage: error.message,
            });
          }
          const instance = await storage.getBotInstanceByToken(tokenId);
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
      // Рассылаем событие об ошибке бота всем клиентам проекта
      broadcastProjectEvent(projectId, {
        type: 'bot-error',
        projectId,
        tokenId,
        timestamp: new Date().toISOString(),
      });
      botProcesses.delete(processKey);
    });

    botProcess.on('exit', async (code, signal) => {
      console.log(`Бот ${projectId} (токен ${tokenId}) завершен с кодом ${code}, сигнал: ${signal}`);
      try {
        if ((globalThis as any).__dbPoolActive !== false) {
          if (launchId !== undefined) {
            await storage.updateLaunchHistory(launchId, {
              status: code === 0 ? 'stopped' : 'error',
              stoppedAt: new Date(),
              errorMessage: code !== 0 ? `Процесс завершен с кодом ${code}` : null,
            });
          }
          const instance = await storage.getBotInstanceByToken(tokenId);
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
      // Рассылаем событие об остановке бота всем клиентам проекта
      broadcastProjectEvent(projectId, {
        type: 'bot-stopped',
        projectId,
        tokenId,
        timestamp: new Date().toISOString(),
      });
      botProcesses.delete(processKey);
    });

    return { success: true, processId };
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
