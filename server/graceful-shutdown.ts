import { botProcesses } from "./routes";
import { storage } from "./storage";
import { execSync } from "node:child_process";

/**
 * Функция для корректного завершения всех запущенных ботов
 * @returns {Promise<void>}
 */
export async function shutdownAllBots(): Promise<void> {
  console.log('🛑 Начинаем корректное завершение всех ботов...');

  // Останавливаем все активные процессы ботов
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

  // Также убиваем все Python-процессы, связанные с ботами
  try {
    if (process.platform === 'win32') {
      // В Windows используем отдельные команды
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
      // В Unix-подобных системах
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

  // Очищаем коллекцию процессов
  botProcesses.clear();

  // Обновляем статус всех экземпляров ботов в базе данных ТОЛЬКО если пул соединений активен
  if (globalThis.__dbPoolActive !== false) {
    try {
      const allInstances = await storage.getAllBotInstances();
      for (const instance of allInstances) {
        if (instance.status === 'running') {
          await storage.updateBotInstance(instance.id, {
            status: 'stopped',
            stoppedAt: new Date(),
            errorMessage: 'Сервер остановлен'
          });
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса экземпляров ботов:', error);
    }
  } else {
    console.log('⚠️ Пропускаем обновление статуса ботов - пул соединений закрыт');
  }

  console.log('✅ Все боты корректно завершены');
}