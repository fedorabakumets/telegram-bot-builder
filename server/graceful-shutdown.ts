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
    const psCommand = process.platform === 'win32'
      ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV 2>nul | findstr bot_`
      : `ps aux | grep python | grep bot_ | grep -v grep | awk '{print $2}'`;
    
    const botProcessesOutput = execSync(psCommand, { encoding: 'utf8' }).trim();
    
    if (botProcessesOutput) {
      const lines = botProcessesOutput.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (process.platform === 'win32') {
          // В Windows строка выглядит как "python.exe","PID",...
          const match = line.match(/"[^"]*","(\d+)"/);
          if (match) {
            const pid = parseInt(match[1]);
            if (pid && !isNaN(pid)) {
              try {
                console.log(`Убиваем Python-процесс бота с PID: ${pid}`);
                if (process.platform === 'win32') {
                  execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
                } else {
                  execSync(`kill -9 ${pid}`, { encoding: 'utf8' });
                }
              } catch (killError) {
                console.log(`Процесс ${pid} уже завершен или недоступен`);
              }
            }
          }
        } else {
          // В Unix-подобных системах выводится просто PID
          const pid = parseInt(line.trim());
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
    }
  } catch (error) {
    console.log('Не удалось найти или убить дополнительные процессы ботов:', error);
  }

  // Очищаем коллекцию процессов
  botProcesses.clear();

  // Обновляем статус всех экземпляров ботов в базе данных
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

  console.log('✅ Все боты корректно завершены');
}