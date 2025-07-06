import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn, ChildProcess } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { insertBotProjectSchema, botDataSchema, insertBotInstanceSchema, insertBotTemplateSchema, insertBotTokenSchema } from "@shared/schema";
import { seedDefaultTemplates } from "./seed-templates";
import { createTemplateExport, validateTemplateImport, createTemplateFileName } from "@shared/template-format";
import { generateKeyboardCode } from './keyboard-generator';
import { generateUnifiedKeyboardCode } from './unified-keyboard-generator';
import { z } from "zod";

// Глобальное хранилище активных процессов ботов
const botProcesses = new Map<number, ChildProcess>();

// Функция для безопасной обработки ошибок
function createSafeErrorResponse(error: unknown, defaultMessage: string): { message: string } {
  let errorMessage = defaultMessage;
  
  if (error instanceof Error) {
    // Очищаем сообщение от потенциально проблемных символов
    errorMessage = error.message
      .replace(/[^\w\s\-.,!?():/]/g, '') // Удаляем специальные символы
      .substring(0, 200) // Ограничиваем длину
      .trim();
    
    // Если после очистки сообщение пустое, используем дефолтное
    if (!errorMessage) {
      errorMessage = defaultMessage;
    }
  }
  
  return { message: errorMessage };
}

// Функция для создания Python файла бота
function createBotFile(botCode: string, projectId: number): string {
  const botsDir = join(process.cwd(), 'bots');
  if (!existsSync(botsDir)) {
    mkdirSync(botsDir, { recursive: true });
  }
  
  const filePath = join(botsDir, `bot_${projectId}.py`);
  writeFileSync(filePath, botCode);
  return filePath;
}

// Функция для запуска бота
async function startBot(projectId: number, token: string): Promise<{ success: boolean; error?: string; processId?: string }> {
  try {
    // Проверяем, не запущен ли уже бот в базе данных
    const currentInstance = await storage.getBotInstance(projectId);
    if (currentInstance && currentInstance.status === 'running') {
      return { success: false, error: "Бот уже запущен" };
    }

    // Проверяем, нет ли уже активного процесса в памяти
    if (botProcesses.has(projectId)) {
      console.log(`Найден существующий процесс для бота ${projectId}, останавливаем его`);
      const oldProcess = botProcesses.get(projectId);
      if (oldProcess && !oldProcess.killed) {
        oldProcess.kill('SIGTERM');
      }
      botProcesses.delete(projectId);
      // Ждем немного для завершения старого процесса
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const project = await storage.getBotProject(projectId);
    if (!project) {
      return { success: false, error: "Проект не найден" };
    }

    // Генерируем код бота
    const botCode = generatePythonCode(project.data).replace('YOUR_BOT_TOKEN_HERE', token);
    
    // Создаем файл бота
    const filePath = createBotFile(botCode, projectId);
    
    // Запускаем бота с правильной обработкой кодировки
    const botProcess = spawn('python', [filePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    // Устанавливаем кодировку для предотвращения проблем с выводом
    botProcess.stdout?.setEncoding('utf8');
    botProcess.stderr?.setEncoding('utf8');

    // Логируем вывод процесса с защитой от некорректных символов
    botProcess.stdout?.on('data', (data) => {
      try {
        const output = data.toString().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        console.log(`Бот ${projectId} stdout:`, output);
      } catch (err) {
        console.log(`Бот ${projectId} stdout (binary):`, data);
      }
    });

    botProcess.stderr?.on('data', (data) => {
      try {
        const output = data.toString().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        console.error(`Бот ${projectId} stderr:`, output);
      } catch (err) {
        console.error(`Бот ${projectId} stderr (binary):`, data);
      }
    });

    const processId = botProcess.pid?.toString();
    
    // Сохраняем процесс
    botProcesses.set(projectId, botProcess);
    
    // Создаем или обновляем запись в базе данных
    const existingBotInstance = await storage.getBotInstance(projectId);
    if (existingBotInstance) {
      await storage.updateBotInstance(existingBotInstance.id, {
        status: 'running',
        token,
        processId,
        errorMessage: null
      });
    } else {
      await storage.createBotInstance({
        projectId,
        status: 'running',
        token,
        processId,
      });
    }

    // Обрабатываем события процесса
    botProcess.on('error', async (error) => {
      console.error(`Ошибка запуска бота ${projectId}:`, error);
      const instance = await storage.getBotInstance(projectId);
      if (instance) {
        await storage.updateBotInstance(instance.id, { 
          status: 'error', 
          errorMessage: error.message 
        });
      }
      botProcesses.delete(projectId);
    });

    botProcess.on('exit', async (code) => {
      console.log(`Бот ${projectId} завершен с кодом ${code}`);
      const instance = await storage.getBotInstance(projectId);
      if (instance) {
        await storage.updateBotInstance(instance.id, { 
          status: 'stopped',
          errorMessage: code !== 0 ? `Процесс завершен с кодом ${code}` : null
        });
      }
      botProcesses.delete(projectId);
    });

    return { success: true, processId };
  } catch (error) {
    console.error('Ошибка запуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}

// Функция для остановки бота
async function stopBot(projectId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const botProcess = botProcesses.get(projectId);
    
    // Если процесс не найден в памяти, но в базе есть запись - исправляем несоответствие
    if (!botProcess) {
      const instance = await storage.getBotInstance(projectId);
      if (instance && instance.status === 'running') {
        console.log(`Bot process ${projectId} not found in memory but marked as running in database. Fixing state.`);
        await storage.stopBotInstance(projectId);
        return { success: true };
      }
      return { success: false, error: "Bot process not found" };
    }

    // Безопасно завершаем процесс бота
    try {
      // Проверяем, существует ли еще процесс
      if (botProcess.exitCode === null && !botProcess.killed) {
        // Пытаемся мягко завершить процесс
        try {
          botProcess.kill('SIGTERM');
          console.log(`Sent SIGTERM to bot process ${projectId}`);
        } catch (termError) {
          console.warn(`Warning when sending SIGTERM to bot ${projectId}:`, termError);
        }
        
        // Ждем некоторое время для мягкого завершения
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Если процесс все еще активен, принудительно завершаем
        if (botProcess.exitCode === null && !botProcess.killed) {
          try {
            botProcess.kill('SIGKILL');
            console.log(`Sent SIGKILL to bot process ${projectId}`);
          } catch (killError) {
            console.warn(`Warning when sending SIGKILL to bot ${projectId}:`, killError);
          }
        }
      }
    } catch (processError) {
      console.warn(`Warning when stopping bot process ${projectId}:`, processError);
    }
    
    // Удаляем из памяти и обновляем базу данных
    botProcesses.delete(projectId);
    await storage.stopBotInstance(projectId);
    
    console.log(`Bot ${projectId} stopped successfully`);
    return { success: true };
  } catch (error) {
    console.error('Error stopping bot:', error);
    const errorResponse = createSafeErrorResponse(error, 'Failed to stop bot');
    return { success: false, error: errorResponse.message };
  }
}

// Функция для очистки несоответствий состояний ботов при запуске сервера
async function cleanupBotStates(): Promise<void> {
  try {
    console.log('Проверяем состояние ботов при запуске сервера...');
    const allInstances = await storage.getAllBotInstances();
    
    for (const instance of allInstances) {
      if (instance.status === 'running') {
        // Если в базе бот помечен как запущенный, но процесса нет в памяти
        if (!botProcesses.has(instance.projectId)) {
          console.log(`Найден бот ${instance.projectId} в статусе "running" без активного процесса. Исправляем состояние.`);
          await storage.updateBotInstance(instance.id, { status: 'stopped' });
        }
      }
    }
    console.log('Проверка состояния ботов завершена.');
  } catch (error) {
    console.error('Ошибка при проверке состояния ботов:', error);
  }
}

// Функция для перезапуска бота (если он запущен)
async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const instance = await storage.getBotInstance(projectId);
    if (!instance || instance.status !== 'running') {
      return { success: true }; // Бот не запущен, ничего не делаем
    }

    console.log(`Перезапускаем бота ${projectId} из-за обновления кода...`);
    
    // Останавливаем текущий бот
    const stopResult = await stopBot(projectId);
    if (!stopResult.success) {
      console.error(`Ошибка перезапуска бота ${projectId}:`, stopResult.error);
      return { success: true }; // Возвращаем true, чтобы не блокировать сохранение проекта
    }

    // Ждем дольше для полного завершения процесса и избежания конфликтов Telegram
    await new Promise(resolve => setTimeout(resolve, 7000));

    // Проверяем, что процесс действительно завершен
    const processExists = botProcesses.has(projectId);
    if (processExists) {
      console.log(`Процесс бота ${projectId} еще не завершен, принудительно удаляем из памяти`);
      botProcesses.delete(projectId);
    }

    // Получаем актуальный токен (может измениться)
    let tokenToUse = instance.token;
    
    // Проверяем, есть ли токен по умолчанию
    const defaultToken = await storage.getDefaultBotToken(projectId);
    if (defaultToken) {
      tokenToUse = defaultToken.token;
      console.log(`Используем токен по умолчанию для перезапуска бота ${projectId}`);
    } else {
      // Если нет токена по умолчанию, используем токен из проекта
      const project = await storage.getBotProject(projectId);
      if (project?.botToken) {
        tokenToUse = project.botToken;
        console.log(`Используем сохраненный токен проекта для перезапуска бота ${projectId}`);
      }
    }

    // Запускаем заново с актуальным токеном
    const startResult = await startBot(projectId, tokenToUse);
    if (startResult.success) {
      console.log(`Бот ${projectId} успешно перезапущен после обновления структуры`);
    } else {
      console.error(`Ошибка при перезапуске бота ${projectId}:`, startResult.error);
    }
    return startResult;
  } catch (error) {
    console.error('Ошибка перезапуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}

