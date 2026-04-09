/**
 * @fileoverview Модуль для корректного завершения работы всех запущенных ботов
 *
 * Этот модуль предоставляет функции для безопасного завершения всех запущенных
 * экземпляров ботов, включая остановку процессов, освобождение ресурсов и
 * обновление статусов в базе данных.
 *
 * @module graceful-shutdown
 */

/**
 * Глобальная коллекция активных процессов ботов
 * @external botProcesses
 * @see {@link ./routes}
 */
import { botProcesses } from "../routes/routes";

/**
 * Модуль для взаимодействия с хранилищем данных
 * @external storage
 * @see {@link ./storage}
 */
import { storage } from "../storages/storage";

/**
 * Модуль для выполнения системных команд
 * @external child_process
 */
import { execSync } from "node:child_process";

/**
 * Асинхронная функция для корректного завершения всех запущенных экземпляров ботов
 *
 * Функция выполняет следующие действия:
 * 1. Останавливает все активные процессы ботов из глобальной коллекции
 * 2. Убивает все Python-процессы, связанные с ботами (включая зависшие)
 * 3. Очищает коллекцию активных процессов ботов
 * 4. Обновляет статусы всех запущенных экземпляров ботов в базе данных (при наличии активного пула соединений)
 *
 * @async
 * @function shutdownAllBots
 * @returns {Promise<void>} Промис, который разрешается после завершения всех операций
 *
 * @description
 * Алгоритм работы функции:
 * - Перебирает все процессы из коллекции botProcesses
 * - Отправляет каждому процессу сигнал SIGTERM для мягкого завершения
 * - Ждет 2 секунды для корректного завершения
 * - При необходимости отправляет сигнал SIGKILL для принудительного завершения
 * - Выполняет поиск и уничтожение всех Python-процессов, содержащих 'bot_' в имени файла
 * - Очищает коллекцию botProcesses
 * - Обновляет статусы ботов в базе данных, если пул соединений все еще активен
 *
 * @example
 * ```typescript
 * import { shutdownAllBots } from './graceful-shutdown';
 *
 * // Корректное завершение всех ботов перед остановкой сервера
 * await shutdownAllBots();
 * console.log('Все боты корректно завершены');
 * ```
 *
 * @throws {Error} Может выбросить ошибку при проблемах с завершением процессов
 *
 * @author Telegram Bot Builder
 * @since 1.0.0
 */
export async function shutdownAllBots(): Promise<void> {
  if (globalThis.__dbPoolActive !== false) {
    try {
      const allInstances = await storage.getAllBotInstances();
      for (const instance of allInstances) {
        if (instance.status === 'running') {
          /**
           * Записываем маркер ДО убийства процессов — иначе обработчик exit
           * в startBot.ts перезапишет errorMessage своим кодом ошибки.
           * Используем специальный маркер вместо обычного сообщения об остановке,
           * чтобы `restoreRunningBots` мог отличить "остановлен сервером" от
           * "остановлен пользователем вручную" и восстановить бота после рестарта.
           */
          await storage.updateBotInstance(instance.id, {
            status: 'stopped',
            stoppedAt: new Date(),
            errorMessage: '__server_restart__'
          });
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса экземпляров ботов:', error);
    }
  } else {
    console.log('⚠️ Пропускаем обновление статуса ботов - пул соединений закрыт');
  }

  console.log('🛑 Начинаем корректное завершение всех ботов...');

  /**
   * Этап 1: Завершение процессов ботов из глобальной коллекции
   *
   * Перебираем все процессы из коллекции botProcesses и отправляем им сигналы
   * для корректного завершения: сначала SIGTERM (мягкая остановка), затем
   * через 2 секунды SIGKILL (принудительная остановка), если процесс все еще активен.
   */
  for (const [key, process] of botProcesses.entries()) {
    try {
      console.log(`Убиваем процесс бота с ключом: ${key}, PID: ${process.pid}`);

      // Мягкая остановка процесса
      process.kill('SIGTERM');

      // Ждем 2 секунды для корректного завершения
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Если процесс все еще жив, принудительно завершаем
      try {
        process.kill('SIGKILL');
      } catch (e) {
        // Процесс уже завершен
      }
    } catch (error) {
      console.log(`Процесс ${key} уже завершен или не может быть остановлен:`, error);
    }
  }

  /**
   * Этап 2: Уничтожение всех Python-процессов, связанных с ботами
   *
   * Выполняем системные команды для поиска и уничтожения всех процессов Python,
   * которые могут быть связаны с ботами (имена файлов содержат 'bot_').
   * Обработка различается для Windows и Unix-подобных систем.
   */
  try {
    if (process.platform === 'win32') {
      // В Windows используем команду tasklist для получения списка процессов
      try {
        const tasklistOutput = execSync(`tasklist /FI "IMAGENAME eq python.exe" /FO CSV 2>nul`, { encoding: 'utf8' }).trim();

        if (tasklistOutput && tasklistOutput.includes('bot_')) {
          const lines = tasklistOutput.split('\n').filter(line => line.trim() && line.includes('bot_'));

          for (const line of lines) {
            // Вывод tasklist в формате CSV: "Image Name","PID",...
            const match = line.match(/"([^"]*)","(\d+)"/);
            if (match) {
              const imageName = match[1];
              const pid = parseInt(match[2]);

              if (imageName && imageName.includes('bot_') && pid && !isNaN(pid)) {
                try {
                  console.log(`Убиваем Python-процесс бота ${imageName} с PID: ${pid}`);
                  execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
                } catch (killError) {
                  console.log(`Процесс ${pid} уже завершен или недоступен`);
                }
              }
            }
          }
        }
      } catch (tasklistError) {
        console.log('Ошибка при выполнении tasklist:', tasklistError);
      }
    } else {
      // В Unix-подобных системах используем команду ps для получения списка процессов
      try {
        const psOutput = execSync(`ps aux | grep python | grep bot_ | grep -v grep`, { encoding: 'utf8' }).trim();

        if (psOutput) {
          const lines = psOutput.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);

            if (pid && !isNaN(pid)) {
              try {
                console.log(`Убиваем Python-процесс бота с PID: ${pid}`);
                execSync(`kill -9 ${pid}`, { encoding: 'utf8' });
              } catch (killError) {
                console.log(`Процесс ${pid} уже завершен или недоступен`);
              }
            }
          }
        }
      } catch (psError) {
        console.log('Не удалось выполнить ps для поиска процессов ботов:', psError);
      }
    }
  } catch (error) {
    console.log('Не удалось найти или убить дополнительные процессы ботов:', error);
  }

  /**
   * Этап 3: Очистка глобальной коллекции процессов ботов
   *
   * Удаляем все записи из коллекции botProcesses, чтобы освободить память
   * и избежать попыток взаимодействия с уже завершенными процессами.
   */
  botProcesses.clear();

  console.log('✅ Все боты корректно завершены');
}