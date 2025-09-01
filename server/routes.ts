import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn, ChildProcess } from "child_process";
import { writeFileSync, existsSync, mkdirSync, unlinkSync, createWriteStream } from "fs";
import { join } from "path";
import multer from "multer";
import { storage } from "./storage";
import { insertBotProjectSchema, insertBotInstanceSchema, insertBotTemplateSchema, insertBotTokenSchema, insertMediaFileSchema, insertUserBotDataSchema, insertBotGroupSchema, nodeSchema, connectionSchema, botDataSchema } from "@shared/schema";
import { seedDefaultTemplates } from "./seed-templates";
import { z } from "zod";
import https from "https";
import http from "http";
import { pipeline } from "stream/promises";
import { URL } from "url";
import dbRoutes from "./db-routes";
import { Pool } from "pg";
import { generatePythonCode } from "../client/src/lib/bot-generator";
import { initializeDatabaseTables } from "./init-db";
import { telegramClientManager } from "./telegram-client";

// Глобальное хранилище активных процессов ботов
const botProcesses = new Map<number, ChildProcess>();

// Расширенная настройка multer для загрузки файлов
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.projectId;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uploadDir = join(process.cwd(), 'uploads', projectId, date);
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла с временной меткой и безопасным именем
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
    const baseName = file.originalname
      .split('.')[0] // Убираем расширение
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Заменяем небезопасные символы
      .substring(0, 50); // Ограничиваем длину
    
    cb(null, `${uniqueSuffix}-${baseName}.${extension}`);
  }
});

// Получение расширения файла
const getFileExtension = (filename: string): string => {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
};

// Расширенная валидация файлов с детальными ограничениями
const validateFileDetailed = (file: Express.Multer.File) => {
  const fileValidation = new Map([
    // Изображения
    ['image/jpeg', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'JPEG изображение' }],
    ['image/jpg', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'JPG изображение' }],
    ['image/png', { maxSize: 25 * 1024 * 1024, category: 'photo', description: 'PNG изображение' }],
    ['image/gif', { maxSize: 15 * 1024 * 1024, category: 'photo', description: 'GIF анимация' }],
    ['image/webp', { maxSize: 20 * 1024 * 1024, category: 'photo', description: 'WebP изображение' }],
    ['image/svg+xml', { maxSize: 5 * 1024 * 1024, category: 'photo', description: 'SVG векторное изображение' }],
    ['image/bmp', { maxSize: 30 * 1024 * 1024, category: 'photo', description: 'BMP изображение' }],
    
    // Видео
    ['video/mp4', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'MP4 видео' }],
    ['video/webm', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'WebM видео' }],
    ['video/avi', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'AVI видео' }],
    ['video/mov', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'QuickTime видео' }],
    ['video/mkv', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'MKV видео' }],
    ['video/quicktime', { maxSize: 200 * 1024 * 1024, category: 'video', description: 'QuickTime видео' }],
    
    // Аудио
    ['audio/mp3', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'MP3 аудио' }],
    ['audio/mpeg', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'MPEG аудио' }],
    ['audio/wav', { maxSize: 100 * 1024 * 1024, category: 'audio', description: 'WAV аудио' }],
    ['audio/ogg', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'OGG аудио' }],
    ['audio/aac', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'AAC аудио' }],
    ['audio/flac', { maxSize: 100 * 1024 * 1024, category: 'audio', description: 'FLAC аудио' }],
    ['audio/m4a', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'M4A аудио' }],
    ['audio/webm', { maxSize: 50 * 1024 * 1024, category: 'audio', description: 'WebM аудио' }],
    
    // Документы
    ['application/pdf', { maxSize: 50 * 1024 * 1024, category: 'document', description: 'PDF документ' }],
    ['application/msword', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ' }],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ (DOCX)' }],
    ['application/vnd.ms-excel', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица' }],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица (XLSX)' }],
    ['text/plain', { maxSize: 10 * 1024 * 1024, category: 'document', description: 'Текстовый файл' }],
    ['text/csv', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'CSV файл' }],
    
    // Дополнительные форматы документов по расширению файла
    ['.pdf', { maxSize: 50 * 1024 * 1024, category: 'document', description: 'PDF документ' }],
    ['.doc', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ' }],
    ['.docx', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Word документ (DOCX)' }],
    ['.txt', { maxSize: 10 * 1024 * 1024, category: 'document', description: 'Текстовый файл' }],
    ['.xls', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица' }],
    ['.xlsx', { maxSize: 25 * 1024 * 1024, category: 'document', description: 'Excel таблица (XLSX)' }],
    
    // Архивы
    ['application/zip', { maxSize: 100 * 1024 * 1024, category: 'document', description: 'ZIP архив' }],
    ['application/x-rar-compressed', { maxSize: 100 * 1024 * 1024, category: 'document', description: 'RAR архив' }],
  ]);
  
  // Сначала проверяем по MIME типу
  let validation = fileValidation.get(file.mimetype);
  
  // Если не найдено по MIME типу, проверяем по расширению файла
  if (!validation) {
    const extension = getFileExtension(file.originalname);
    validation = fileValidation.get(extension);
  }
  
  if (!validation) {
    const extension = getFileExtension(file.originalname);
    return { 
      valid: false, 
      error: `Неподдерживаемый тип файла: ${file.mimetype} (${extension}). Поддерживаются изображения (jpg, png, gif), видео (mp4, webm), аудио (mp3, wav, ogg), документы (pdf, doc, txt).` 
    };
  }
  
  if (file.size > validation.maxSize) {
    const maxSizeMB = Math.round(validation.maxSize / (1024 * 1024));
    return { 
      valid: false, 
      error: `Файл "${file.originalname}" слишком большой. Максимальный размер для ${validation.description}: ${maxSizeMB}МБ` 
    };
  }
  
  // Проверка имени файла
  if (file.originalname.length > 255) {
    return { 
      valid: false, 
      error: 'Имя файла слишком длинное (максимум 255 символов)' 
    };
  }
  
  // Проверка на безопасность имени файла
  const dangerousPatterns = [/\.\./g, /[<>:"|?*]/g, /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i];
  if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
    return { 
      valid: false, 
      error: 'Небезопасное имя файла' 
    };
  }
  
  return { valid: true, category: validation.category };
};

// Упрощенный фильтр для multer
const fileFilter = (req: any, file: any, cb: any) => {
  const validation = validateFileDetailed(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

const upload = multer({ 
  storage: storage_multer,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB максимальный размер файла (для больших видео)
    files: 20, // Максимум 20 файлов за раз
    fieldSize: 10 * 1024 * 1024, // 10MB для полей формы
    fieldNameSize: 300, // Максимальная длина имени поля
    fields: 50 // Максимальное количество полей формы
  }
});

// Определение типа файла по MIME типу
function getFileType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Функция для загрузки файла по URL с улучшенной обработкой ошибок
async function downloadFileFromUrl(url: string, destination: string): Promise<{
  success: boolean;
  filePath?: string;
  size?: number;
  mimeType?: string;
  fileName?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      // Проверяем корректность URL
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return resolve({ success: false, error: 'Поддерживаются только HTTP и HTTPS ссылки' });
      }

      // Выбираем модуль для загрузки в зависимости от протокола
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      // Создаем запрос с заголовками для эмуляции браузера
      const request = client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        },
        timeout: 30000 // 30 секунд таймаут
      }, (response) => {
        // Обрабатываем редиректы
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = response.headers.location;
          console.log(`Редирект с ${url} на ${redirectUrl}`);
          return downloadFileFromUrl(redirectUrl, destination).then(resolve);
        }

        // Проверяем статус код
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
          return resolve({ 
            success: false, 
            error: `Ошибка сервера: ${response.statusCode} ${response.statusMessage}` 
          });
        }

        // Получаем информацию о файле из заголовков
        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = response.headers['content-disposition'];
        
        // Извлекаем имя файла из заголовков или URL
        let fileName = '';
        if (contentDisposition && contentDisposition.includes('filename=')) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }
        
        if (!fileName) {
          fileName = parsedUrl.pathname.split('/').pop() || 'downloaded-file';
          if (!fileName.includes('.')) {
            // Добавляем расширение на основе MIME типа
            const extensions = {
              'image/jpeg': '.jpg',
              'image/png': '.png',
              'image/gif': '.gif',
              'image/webp': '.webp',
              'video/mp4': '.mp4',
              'video/webm': '.webm',
              'audio/mpeg': '.mp3',
              'audio/wav': '.wav',
              'application/pdf': '.pdf',
              'text/plain': '.txt'
            };
            fileName += extensions[contentType as keyof typeof extensions] || '.bin';
          }
        }

        // Проверяем размер файла
        if (contentLength) {
          const fileSizeBytes = parseInt(contentLength);
          const maxSize = contentType.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
          if (fileSizeBytes > maxSize) {
            return resolve({ 
              success: false, 
              error: `Файл слишком большой: ${Math.round(fileSizeBytes / (1024 * 1024))}МБ. Максимальный размер: ${Math.round(maxSize / (1024 * 1024))}МБ` 
            });
          }
        }

        // Создаем поток для записи файла
        const fileStream = createWriteStream(destination);
        let downloadedBytes = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          // Проверяем размер во время загрузки
          const maxSize = contentType.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
          if (downloadedBytes > maxSize) {
            response.destroy();
            fileStream.destroy();
            if (existsSync(destination)) {
              unlinkSync(destination);
            }
            return resolve({ 
              success: false, 
              error: `Файл слишком большой: превышен лимит ${Math.round(maxSize / (1024 * 1024))}МБ` 
            });
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          resolve({
            success: true,
            filePath: destination,
            size: downloadedBytes,
            mimeType: contentType,
            fileName: fileName
          });
        });

        fileStream.on('error', (error) => {
          if (existsSync(destination)) {
            unlinkSync(destination);
          }
          resolve({ success: false, error: `Ошибка записи файла: ${error.message}` });
        });
      });

      request.on('error', (error) => {
        resolve({ success: false, error: `Ошибка сети: ${error.message}` });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ success: false, error: 'Превышено время ожидания (30 секунд)' });
      });

    } catch (error) {
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      });
    }
  });
}

// Функция для проверки доступности URL
async function checkUrlAccessibility(url: string): Promise<{
  accessible: boolean;
  mimeType?: string;
  size?: number;
  fileName?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return resolve({ accessible: false, error: 'Поддерживаются только HTTP и HTTPS ссылки' });
      }

      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const request = client.request(url, { method: 'HEAD', timeout: 10000 }, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return checkUrlAccessibility(response.headers.location).then(resolve);
        }

        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 400) {
          return resolve({ 
            accessible: false, 
            error: `Ошибка сервера: ${response.statusCode} ${response.statusMessage}` 
          });
        }

        const contentLength = response.headers['content-length'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = response.headers['content-disposition'];
        
        let fileName = '';
        if (contentDisposition && contentDisposition.includes('filename=')) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '');
          }
        }
        
        if (!fileName) {
          fileName = parsedUrl.pathname.split('/').pop() || 'file';
        }

        resolve({
          accessible: true,
          mimeType: contentType,
          size: contentLength ? parseInt(contentLength) : undefined,
          fileName: fileName
        });
      });

      request.on('error', (error) => {
        resolve({ accessible: false, error: `Ошибка сети: ${error.message}` });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve({ accessible: false, error: 'Превышено время ожидания' });
      });

      request.end();

    } catch (error) {
      resolve({ 
        accessible: false, 
        error: error instanceof Error ? error.message : 'Неверный URL' 
      });
    }
  });
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
    }

    // Генерируем код бота через клиентский генератор
    const { generatePythonCode } = await import("../client/src/lib/bot-generator.js");
    const simpleBotData = convertSheetsToSimpleBotData(project.data);
    const botCode = generatePythonCode(simpleBotData as any, project.name).replace('YOUR_BOT_TOKEN_HERE', token);
    
    // Создаем файл бота
    const filePath = createBotFile(botCode, projectId);
    
    // Запускаем бота
    const process = spawn('python', [filePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    // Логируем вывод процесса
    process.stdout?.on('data', (data) => {
      console.log(`Бот ${projectId} stdout:`, data.toString());
    });

    process.stderr?.on('data', (data) => {
      console.error(`Бот ${projectId} stderr:`, data.toString());
    });

    const processId = process.pid?.toString();
    
    // Сохраняем процесс
    botProcesses.set(projectId, process);
    
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
    process.on('error', async (error) => {
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

    process.on('exit', async (code) => {
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
    const process = botProcesses.get(projectId);
    
    // Если процесс не найден в памяти, но в базе есть запись - исправляем несоответствие
    if (!process) {
      const instance = await storage.getBotInstance(projectId);
      if (instance && instance.status === 'running') {
        console.log(`Процесс бота ${projectId} не найден в памяти, но помечен как запущенный в базе. Исправляем состояние.`);
        await storage.stopBotInstance(projectId);
        return { success: true };
      }
      return { success: false, error: "Процесс бота не найден" };
    }

    process.kill('SIGTERM');
    botProcesses.delete(projectId);
    
    await storage.stopBotInstance(projectId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
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

    // Ждем дольше для полного завершения процесса и избежания конфликтов
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Проверяем, что процесс действительно завершен
    const processExists = botProcesses.has(projectId);
    if (processExists) {
      console.log(`Процесс бота ${projectId} еще не завершен, принудительно удаляем из памяти`);
      botProcesses.delete(projectId);
    }

    // Запускаем заново с тем же токеном
    const startResult = await startBot(projectId, instance.token);
    return startResult;
  } catch (error) {
    console.error('Ошибка перезапуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}

async function generatePythonCodeOld(botData: any): Promise<string> {
  const { nodes } = botData;
  
  let code = `import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

`;

  // Generate handlers for each node
  nodes.forEach((node: any) => {
    if (node.type === "start") {
      const messageText = node.data.messageText || "Привет! Добро пожаловать!";
      const textAssignment = messageText.includes('\n') 
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;
      
      code += `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    ${textAssignment}
`;
      
      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });
        
        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });
        
        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    } else if (node.type === "command") {
      const command = node.data.command || "/help";
      const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
      const messageText = node.data.messageText || "Команда выполнена";
      const textAssignment = messageText.includes('\n') 
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;
      
      code += `
@dp.message(Command("${command.replace('/', '')}"))
async def ${functionName}_handler(message: types.Message):
    ${textAssignment}
`;
      
      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });
        
        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });
        
        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    } else if (node.type === "message") {
      const functionName = `message_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const messageText = node.data.messageText || "Сообщение получено";
      const textAssignment = messageText.includes('\n') 
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;
      
      code += `
@dp.message()
async def ${functionName}_handler(message: types.Message):
    ${textAssignment}
`;
      
      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });
        
        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });
        
        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    }
  });

  // Generate synonym handlers for commands
  const nodesWithSynonyms = nodes.filter((node: any) => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.synonyms && 
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += `

# Обработчики синонимов команд`;
    nodesWithSynonyms.forEach((node: any) => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
          const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
          const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
          
          code += `
@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")
async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):
    # Синоним для команды ${originalCommand}
`;
          
          if (node.type === 'start') {
            code += '    await start_handler(message)';
          } else {
            code += `    await ${functionName}_handler(message)`;
          }
        });
      }
    });
  }

  code += `

# Запуск бота
async def main():
    try:
        print("Запускаем бота...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"Ошибка запуска бота: {e}")
        raise

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        exit(1)
`;

  return code;
}

// Function to ensure at least one default project exists
async function ensureDefaultProject() {
  try {
    const projects = await storage.getAllBotProjects();
    if (projects.length === 0) {
      // Create a default project if none exists
      const defaultProject = {
        name: "Мой первый бот",
        description: "Базовый бот с приветствием",
        data: {
          nodes: [
            {
              id: "start",
              type: "start",
              position: { x: 100, y: 100 },
              data: {
                messageText: "Привет! Я ваш новый бот. Нажмите /help для получения помощи.",
                keyboardType: "none",
                buttons: [],
                resizeKeyboard: true,
                oneTimeKeyboard: false
              }
            }
          ],
          connections: []
        }
      };
      await storage.createBotProject(defaultProject);
      console.log("✅ Создан проект по умолчанию");
    }
  } catch (error) {
    console.error("❌ Ошибка создания проекта по умолчанию:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database tables first
  console.log('🔧 Initializing database...');
  const dbInitSuccess = await initializeDatabaseTables();
  if (!dbInitSuccess) {
    console.error('❌ Failed to initialize database tables');
    throw new Error('Database initialization failed');
  }
  
  // Initialize default templates on startup
  await seedDefaultTemplates(true);
  
  // Ensure at least one default project exists
  await ensureDefaultProject();
  
  // Clean up inconsistent bot states
  await cleanupBotStates();
  
  // Register database management routes
  app.use("/api/database", dbRoutes);
  
  // Get all bot projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllBotProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get single bot project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create new bot project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertBotProjectSchema.parse(req.body);
      const project = await storage.createBotProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update bot project
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBotProjectSchema.partial().parse(req.body);
      const project = await storage.updateBotProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Если обновляется data (структура бота), перезапускаем бота если он запущен
      if (validatedData.data) {
        console.log(`Проект ${id} обновлен, проверяем необходимость перезапуска бота...`);
        const restartResult = await restartBotIfRunning(id);
        if (!restartResult.success) {
          console.error(`Ошибка перезапуска бота ${id}:`, restartResult.error);
        }
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete bot project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ Начинаем удаление проекта ${id}`);
      
      // Сначала проверяем, существует ли проект
      const project = await storage.getBotProject(id);
      if (!project) {
        console.log(`❌ Проект ${id} не найден`);
        return res.status(404).json({ message: "Project not found" });
      }
      console.log(`✅ Проект ${id} найден: ${project.name}`);

      // Останавливаем бота, если он запущен
      try {
        const botInstance = await storage.getBotInstance(id);
        console.log(`🤖 Экземпляр бота для проекта ${id}:`, botInstance ? `ID: ${botInstance.id}, статус: ${botInstance.status}` : 'не найден');
        
        if (botInstance && botInstance.status === 'running') {
          console.log(`🛑 Останавливаем бота ${id} перед удалением проекта...`);
          await stopBot(id);
          console.log(`✅ Бот ${id} остановлен`);
        }
      } catch (stopError) {
        console.error(`❌ Ошибка остановки бота ${id}:`, stopError);
        // Продолжаем удаление даже если остановка не удалась
      }

      // Удаляем связанные данные в правильном порядке
      try {
        // 1. Удаляем экземпляр бота из базы (если он существует)
        const botInstance = await storage.getBotInstance(id);
        if (botInstance) {
          console.log(`🗑️ Удаляем экземпляр бота ${botInstance.id} для проекта ${id}`);
          const instanceDeleted = await storage.deleteBotInstance(botInstance.id);
          console.log(`${instanceDeleted ? '✅' : '❌'} Экземпляр бота ${instanceDeleted ? 'удален' : 'не удален'}`);
        }

        // 2. Удаляем все токены проекта (CASCADE должен сработать автоматически)
        try {
          console.log(`🗑️ Удаляем токены проекта ${id}`);
          const tokens = await storage.getBotTokensByProject(id);
          for (const token of tokens) {
            await storage.deleteBotToken(token.id);
          }
          console.log(`✅ Токены проекта ${id} удалены`);
        } catch (tokenError) {
          console.error(`❌ Ошибка удаления токенов:`, tokenError);
        }

        // 3. Удаляем медиафайлы
        try {
          console.log(`🗑️ Удаляем медиафайлы проекта ${id}`);
          const mediaFiles = await storage.getMediaFilesByProject(id);
          for (const mediaFile of mediaFiles) {
            await storage.deleteMediaFile(mediaFile.id);
          }
          console.log(`✅ Медиафайлы проекта ${id} удалены`);
        } catch (mediaError) {
          console.error(`❌ Ошибка удаления медиафайлов:`, mediaError);
        }

        // 4. Удаляем пользовательские данные
        try {
          console.log(`🗑️ Удаляем пользовательские данные проекта ${id}`);
          const userData = await storage.getUserBotDataByProject(id);
          for (const data of userData) {
            await storage.deleteUserBotData(data.id);
          }
          console.log(`✅ Пользовательские данные проекта ${id} удалены`);
        } catch (userDataError) {
          console.error(`❌ Ошибка удаления пользовательских данных:`, userDataError);
        }
        
        // 5. Удаляем файл бота
        const filePath = join(process.cwd(), 'bots', `bot_${id}.py`);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          console.log(`✅ Файл бота ${id} удален`);
        } else {
          console.log(`📄 Файл бота ${id} не существует`);
        }
      } catch (cleanupError) {
        console.error(`❌ Ошибка очистки данных бота ${id}:`, cleanupError);
        // Продолжаем удаление проекта
      }

      // Удаляем проект
      console.log(`🗑️ Удаляем проект ${id} из базы данных`);
      const deleted = await storage.deleteBotProject(id);
      console.log(`${deleted ? '✅' : '❌'} Проект ${deleted ? 'удален' : 'не удален'} из базы данных`);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete project from database" });
      }
      
      console.log(`🎉 Проект ${id} успешно удален`);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("❌ Критическая ошибка удаления проекта:", error);
      console.error("❌ Стек ошибки:", error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({ message: "Failed to delete project", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Generate Python code
  app.post("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
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
      }

      // Generate Python code using the imported function
      const simpleBotData = convertSheetsToSimpleBotData(project.data);
      const pythonCode = generatePythonCode(simpleBotData as any, project.name);
      res.json({ code: pythonCode });
    } catch (error) {
      console.error("❌ Ошибка генерации кода:", error);
      res.status(500).json({ message: "Failed to generate code", error: String(error) });
    }
  });

  // Bot management endpoints
  
  // Get bot instance status
  app.get("/api/projects/:id/bot", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const instance = await storage.getBotInstance(projectId);
      if (!instance) {
        return res.json({ status: 'stopped', instance: null });
      }
      
      // Проверяем соответствие состояния в базе и в памяти
      const hasActiveProcess = botProcesses.has(projectId);
      let actualStatus = 'stopped';
      
      // Если есть процесс в памяти, проверяем что он действительно активен
      if (hasActiveProcess) {
        const process = botProcesses.get(projectId);
        if (process && !process.killed && process.exitCode === null) {
          actualStatus = 'running';
        } else {
          // Процесс завершен, но не удален из памяти - очищаем
          console.log(`Процесс бота ${projectId} завершен, удаляем из памяти`);
          botProcesses.delete(projectId);
          actualStatus = 'stopped';
        }
      } else {
        // Процесса нет в памяти, проверяем PID независимо от статуса в базе
        console.log(`Бот ${projectId} в базе показан как ${instance.status}, проверяем процесс по PID ${instance.processId}`);
      }
      
      // Проверяем существует ли процесс по PID (независимо от статуса в базе)
      if (!hasActiveProcess && instance.processId) {
        try {
          // Проверяем существование процесса (не убиваем, только проверяем)
          process.kill(parseInt(instance.processId), 0);
          console.log(`Процесс ${instance.processId} для бота ${projectId} найден в системе, восстанавливаем отслеживание`);
          
          // Создаем фиктивный объект процесса для отслеживания
          const mockProcess = {
            pid: parseInt(instance.processId),
            killed: false,
            exitCode: null,
            kill: (signal: any) => {
              try {
                process.kill(parseInt(instance.processId!), signal);
                return true;
              } catch {
                return false;
              }
            }
          } as any;
          
          // Восстанавливаем отслеживание процесса
          botProcesses.set(projectId, mockProcess);
          actualStatus = 'running';
        } catch (error) {
          console.log(`Процесс ${instance.processId} для бота ${projectId} не найден в системе`);
          actualStatus = 'stopped';
        }
      }
      
      // Дополнительная проверка через ps для более точного определения
      if (!hasActiveProcess && instance.processId && actualStatus === 'stopped') {
        try {
          const { execSync } = require('child_process');
          const psOutput = execSync(`ps -p ${instance.processId} -o pid,ppid,cmd --no-headers`, { encoding: 'utf8' }).trim();
          
          if (psOutput && psOutput.includes('python')) {
            console.log(`Процесс ${instance.processId} для бота ${projectId} найден через ps, восстанавливаем отслеживание`);
            
            // Создаем фиктивный объект процесса для отслеживания
            const mockProcess = {
              pid: parseInt(instance.processId),
              killed: false,
              exitCode: null,
              kill: (signal: any) => {
                try {
                  process.kill(parseInt(instance.processId!), signal);
                  return true;
                } catch {
                  return false;
                }
              }
            } as any;
            
            // Восстанавливаем отслеживание процесса
            botProcesses.set(projectId, mockProcess);
            actualStatus = 'running';
          }
        } catch (error) {
          // ps команда не сработала, процесс точно не существует
          console.log(`Процесс ${instance.processId} для бота ${projectId} не найден через ps`);
        }
      }
      
      // Дополнительная проверка через поиск процесса с нужным файлом бота
      if (!hasActiveProcess && actualStatus === 'stopped') {
        try {
          const { execSync } = require('child_process');
          // Ищем процесс который запускает файл этого бота
          const botFileName = `bot_${projectId}.py`;
          const allPythonProcesses = execSync(`ps aux | grep python | grep -v grep`, { encoding: 'utf8' }).trim();
          
          // Проверяем есть ли процесс с файлом этого бота
          if (allPythonProcesses.includes(botFileName)) {
            console.log(`Найден активный процесс для бота ${projectId} (файл: ${botFileName}), восстанавливаем отслеживание`);
            
            // Извлекаем PID из вывода ps
            const lines = allPythonProcesses.split('\n');
            for (const line of lines) {
              if (line.includes(botFileName)) {
                const parts = line.trim().split(/\s+/);
                const realPid = parseInt(parts[1]);
                
                console.log(`Обнаружен реальный PID ${realPid} для бота ${projectId}, обновляем в базе`);
                
                // Обновляем PID в базе данных
                await storage.updateBotInstance(instance.id, { processId: realPid.toString() });
                
                // Создаем фиктивный объект процесса для отслеживания
                const mockProcess = {
                  pid: realPid,
                  killed: false,
                  exitCode: null,
                  kill: (signal: any) => {
                    try {
                      process.kill(realPid, signal);
                      return true;
                    } catch {
                      return false;
                    }
                  }
                } as any;
                
                // Восстанавливаем отслеживание процесса
                botProcesses.set(projectId, mockProcess);
                actualStatus = 'running';
                break;
              }
            }
          }
        } catch (error) {
          // Команда не сработала, процесс не найден
          console.log(`Процесс для бота ${projectId} не найден среди Python процессов`);
        }
      }
      
      // Если статус в базе не соответствует реальному состоянию - исправляем
      if (instance.status !== actualStatus) {
        console.log(`Обнаружено несоответствие состояния для бота ${projectId}. База: ${instance.status}, Реальность: ${actualStatus}. Исправляем.`);
        await storage.updateBotInstance(instance.id, { 
          status: actualStatus,
          errorMessage: actualStatus === 'stopped' ? 'Процесс завершен' : null
        });
        const updatedInstance = { ...instance, status: actualStatus };
        return res.json({ status: actualStatus, instance: updatedInstance });
      }
      
      res.json({ status: instance.status, instance });
    } catch (error) {
      console.error('Ошибка получения статуса бота:', error);
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  // Start bot
  app.post("/api/projects/:id/bot/start", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { token, tokenId } = req.body;
      
      // Проверяем проект
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      let botToken = token;
      let tokenToMarkAsUsed = null;

      // Если не передан токен напрямую, используем токен по ID или по умолчанию
      if (!botToken) {
        if (tokenId) {
          const selectedToken = await storage.getBotToken(tokenId);
          if (selectedToken && selectedToken.projectId === projectId) {
            botToken = selectedToken.token;
            tokenToMarkAsUsed = selectedToken.id;
          }
        } else {
          // Используем токен по умолчанию
          const defaultToken = await storage.getDefaultBotToken(projectId);
          if (defaultToken) {
            botToken = defaultToken.token;
            tokenToMarkAsUsed = defaultToken.id;
          } else {
            // Fallback к старому способу - токен в проекте
            botToken = project.botToken;
          }
        }
      }

      if (!botToken) {
        return res.status(400).json({ message: "Bot token is required" });
      }

      // Проверяем, не запущен ли уже бот
      const existingInstance = await storage.getBotInstance(projectId);
      if (existingInstance && existingInstance.status === 'running') {
        return res.status(400).json({ message: "Bot is already running" });
      }

      const result = await startBot(projectId, botToken);
      if (result.success) {
        // Отмечаем токен как использованный
        if (tokenToMarkAsUsed) {
          await storage.markTokenAsUsed(tokenToMarkAsUsed);
        }
        
        res.json({ 
          message: "Bot started successfully", 
          processId: result.processId,
          tokenUsed: tokenToMarkAsUsed ? true : false
        });
      } else {
        res.status(500).json({ message: result.error || "Failed to start bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to start bot" });
    }
  });

  // Stop bot
  app.post("/api/projects/:id/bot/stop", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      const result = await stopBot(projectId);
      if (result.success) {
        res.json({ message: "Bot stopped successfully" });
      } else {
        res.status(500).json({ message: result.error || "Failed to stop bot" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to stop bot" });
    }
  });

  // Get saved bot token
  app.get("/api/projects/:id/token", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ 
        hasToken: !!project.botToken, 
        tokenPreview: project.botToken ? `${project.botToken.substring(0, 10)}...` : null 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get token info" });
    }
  });

  // Clear saved bot token
  app.delete("/api/projects/:id/token", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.updateBotProject(projectId, { botToken: null });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Token cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear token" });
    }
  });

  // Get all bot instances
  app.get("/api/bots", async (req, res) => {
    try {
      const instances = await storage.getAllBotInstances();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot instances" });
    }
  });

  // Template management endpoints
  
  // Force update templates
  app.post("/api/templates/refresh", async (req, res) => {
    try {
      console.log('🔄 Принудительное обновление шаблонов по API запросу');
      await seedDefaultTemplates(true);
      res.json({ message: "Templates refreshed successfully" });
    } catch (error) {
      console.error('❌ Ошибка обновления шаблонов:', error);
      res.status(500).json({ message: "Failed to refresh templates" });
    }
  });

  // Recreate templates with hierarchy
  app.post("/api/templates/recreate", async (req, res) => {
    try {
      console.log('🔄 Пересоздание шаблонов с иерархией по API запросу');
      await seedDefaultTemplates(true);
      res.json({ message: "Templates recreated with hierarchy successfully" });
    } catch (error) {
      console.error('❌ Ошибка пересоздания шаблонов:', error);
      res.status(500).json({ message: "Failed to recreate templates" });
    }
  });
  
  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllBotTemplates();
      // Маппинг data -> flow_data для совместимости с фронтендом
      const mappedTemplates = templates.map(template => ({
        ...template,
        flow_data: template.data
      }));
      res.json(mappedTemplates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Get featured templates (must be before /api/templates/:id)
  app.get("/api/templates/featured", async (req, res) => {
    try {
      const templates = await storage.getFeaturedTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured templates" });
    }
  });

  // Get templates by category (must be before /api/templates/:id)
  app.get("/api/templates/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const templates = await storage.getTemplatesByCategory(category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates by category" });
    }
  });

  // Search templates (must be before /api/templates/:id)
  app.get("/api/templates/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const templates = await storage.searchTemplates(q);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to search templates" });
    }
  });

  // Get single template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Create new template
  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertBotTemplateSchema.parse(req.body);
      const template = await storage.createBotTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update template
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBotTemplateSchema.partial().parse(req.body);
      const template = await storage.updateBotTemplate(id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBotTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Use template (increment use count)
  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementTemplateUseCount(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template use count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment use count" });
    }
  });

  // Rate template
  app.post("/api/templates/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const success = await storage.rateTemplate(id, rating);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template rated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to rate template" });
    }
  });

  // Increment template view count
  app.post("/api/templates/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementTemplateViewCount(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "View count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment view count" });
    }
  });

  // Increment template download count
  app.post("/api/templates/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementTemplateDownloadCount(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Download count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  // Toggle template like
  app.post("/api/templates/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { liked } = req.body;
      
      if (typeof liked !== 'boolean') {
        return res.status(400).json({ message: "liked must be a boolean" });
      }
      
      const success = await storage.toggleTemplateLike(id, liked);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: liked ? "Template liked" : "Template unliked" });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Toggle template bookmark
  app.post("/api/templates/:id/bookmark", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { bookmarked } = req.body;
      
      if (typeof bookmarked !== 'boolean') {
        return res.status(400).json({ message: "bookmarked must be a boolean" });
      }
      
      const success = await storage.toggleTemplateBookmark(id, bookmarked);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: bookmarked ? "Template bookmarked" : "Template unbookmarked" });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Token management endpoints
  
  // Get all tokens for a project
  app.get("/api/projects/:id/tokens", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokens = await storage.getBotTokensByProject(projectId);
      
      // Hide actual token values for security
      const safeTokens = tokens.map(token => ({
        ...token,
        token: `${token.token.substring(0, 10)}...`
      }));
      
      res.json(safeTokens);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tokens" });
    }
  });

  // Create a new token
  app.post("/api/projects/:id/tokens", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const tokenData = insertBotTokenSchema.parse({
        ...req.body,
        projectId
      });
      
      const token = await storage.createBotToken(tokenData);
      
      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };
      
      res.status(201).json(safeToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create token" });
    }
  });

  // Update a token
  app.put("/api/tokens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertBotTokenSchema.partial().parse(req.body);
      
      const token = await storage.updateBotToken(id, updateData);
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };
      
      res.json(safeToken);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update token" });
    }
  });

  // Delete a token
  app.delete("/api/tokens/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBotToken(id);
      
      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete token" });
    }
  });

  // Set default token
  app.post("/api/projects/:projectId/tokens/:tokenId/set-default", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tokenId = parseInt(req.params.tokenId);
      
      const success = await storage.setDefaultBotToken(projectId, tokenId);
      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      res.json({ message: "Default token set successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to set default token" });
    }
  });

  // Get default token for a project
  app.get("/api/projects/:id/tokens/default", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const token = await storage.getDefaultBotToken(projectId);
      
      if (!token) {
        return res.json({ hasDefault: false, token: null });
      }
      
      // Hide actual token value for security
      const safeToken = {
        ...token,
        token: `${token.token.substring(0, 10)}...`
      };
      
      res.json({ hasDefault: true, token: safeToken });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default token" });
    }
  });

  // === МЕДИАФАЙЛЫ ===
  
  // Загрузка медиафайла (одиночная) с улучшенной обработкой
  app.post("/api/media/upload/:projectId", upload.single('file'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const file = req.file;
      const { description, tags, isPublic } = req.body;
      
      if (!file) {
        return res.status(400).json({ 
          message: "Файл не выбран",
          code: "NO_FILE"
        });
      }
      
      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        // Удаляем загруженный файл если проект не найден
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
        return res.status(404).json({ 
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }
      
      // Дополнительная валидация файла
      const validation = validateFileDetailed(file);
      if (!validation.valid) {
        // Удаляем файл при ошибке валидации
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
        return res.status(400).json({ 
          message: validation.error,
          code: "VALIDATION_ERROR"
        });
      }
      
      // Создаем URL для доступа к файлу относительно проекта
      const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
      const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      
      // Обрабатываем теги
      const processedTags = tags ? 
        (Array.isArray(tags) ? tags : tags.split(','))
          .map((tag: string) => tag.trim().toLowerCase())
          .filter((tag: string) => tag.length > 0 && tag.length <= 50)
          .slice(0, 10) // Максимум 10 тегов
        : [];
      
      // Автоматически добавляем теги на основе типа файла
      const autoTags = [];
      if (validation.category) {
        autoTags.push(validation.category);
      }
      if (file.mimetype.includes('gif')) {
        autoTags.push('анимация');
      }
      if (file.size > 10 * 1024 * 1024) {
        autoTags.push('большой_файл');
      }
      
      const finalTags = Array.from(new Set([...processedTags, ...autoTags]));
      
      // Сохраняем информацию о файле в базе данных
      const mediaFile = await storage.createMediaFile({
        projectId,
        fileName: file.originalname,
        fileType: getFileType(file.mimetype),
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
        description: description || `${validation.category || 'Файл'} - ${file.originalname}`,
        tags: finalTags,
        isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
      });
      
      // Возвращаем подробную информацию о загруженном файле
      res.json({
        ...mediaFile,
        uploadInfo: {
          category: validation.category,
          sizeMB: Math.round(file.size / (1024 * 1024) * 100) / 100,
          autoTagsAdded: autoTags.length,
          uploadDate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);
      
      // Удаляем файл в случае ошибки
      if (req.file && existsSync(req.file.path)) {
        try {
          unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Ошибка при удалении файла:", unlinkError);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({ 
        message: "Ошибка при загрузке файла",
        error: errorMessage,
        code: "UPLOAD_ERROR"
      });
    }
  });

  // Загрузка множественных медиафайлов с улучшенной обработкой
  app.post("/api/media/upload-multiple/:projectId", upload.array('files', 20), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = req.files as Express.Multer.File[];
      
      const { isPublic, defaultDescription } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ 
          message: "Файлы не выбраны",
          code: "NO_FILES"
        });
      }
      
      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        // Удаляем все файлы если проект не найден
        files.forEach(file => {
          if (existsSync(file.path)) {
            unlinkSync(file.path);
          }
        });
        return res.status(404).json({ 
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }
      
      const uploadedFiles = [];
      const errors = [];
      const warnings: string[] = [];
      
      // Группируем файлы по типам для статистики
      const fileStats = {
        photo: 0,
        video: 0,
        audio: 0,
        document: 0
      };
      
      for (const file of files) {
        try {
          // Проверяем размер файла в зависимости от типа
          const maxSize = file.mimetype.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
          if (file.size > maxSize) {
            // Удаляем файл, если он превышает лимит
            unlinkSync(file.path);
            errors.push({
              fileName: file.originalname,
              error: `Файл слишком большой. Максимальный размер: ${file.mimetype.startsWith('video/') ? '100' : '50'}МБ`
            });
            continue;
          }
          
          // Создаем URL для доступа к файлу
          const fileUrl = `/uploads/${file.filename}`;
          
          // Сохраняем информацию о файле в базе данных
          const mediaFile = await storage.createMediaFile({
            projectId,
            fileName: file.originalname,
            fileType: getFileType(file.mimetype),
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            url: fileUrl,
            description: defaultDescription || '',
            tags: [],
            isPublic: isPublic ? 1 : 0
          });
          
          // Обновляем статистику по типам файлов
          const fileType = getFileType(file.mimetype);
          fileStats[fileType]++;
          
          uploadedFiles.push(mediaFile);
        } catch (fileError) {
          console.error(`Ошибка при обработке файла ${file.originalname}:`, fileError);
          
          // Удаляем файл в случае ошибки
          if (existsSync(file.path)) {
            try {
              unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Ошибка при удалении файла:", unlinkError);
            }
          }
          
          errors.push({
            fileName: file.originalname,
            error: "Ошибка при сохранении файла"
          });
        }
      }
      
      // Собираем дополнительную статистику
      const totalSize = uploadedFiles.reduce((sum, file) => sum + file.fileSize, 0);
      
      res.json({
        success: uploadedFiles.length,
        errors: errors.length,
        uploadedFiles,
        errorDetails: errors,
        statistics: {
          totalFiles: files.length,
          totalSize,
          fileTypes: fileStats,
          averageSize: uploadedFiles.length > 0 ? Math.round(totalSize / uploadedFiles.length) : 0
        },
        warnings: warnings.length > 0 ? warnings : undefined
      });
    } catch (error) {
      console.error("Ошибка при загрузке файлов:", error);
      
      // Удаляем все файлы в случае ошибки
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach(file => {
          if (existsSync(file.path)) {
            try {
              unlinkSync(file.path);
            } catch (unlinkError) {
              console.error("Ошибка при удалении файла:", unlinkError);
            }
          }
        });
      }
      
      res.status(500).json({ message: "Ошибка при загрузке файлов" });
    }
  });

  // Проверка доступности URL перед загрузкой
  app.post("/api/media/check-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          message: "URL не указан",
          code: "MISSING_URL"
        });
      }

      const result = await checkUrlAccessibility(url);
      
      if (!result.accessible) {
        return res.status(400).json({
          accessible: false,
          error: result.error,
          code: "URL_NOT_ACCESSIBLE"
        });
      }

      // Проверяем тип файла
      const validation = validateFileDetailed({
        mimetype: result.mimeType || 'application/octet-stream',
        size: result.size || 0,
        originalname: result.fileName || 'file'
      } as any);

      if (!validation.valid) {
        return res.status(400).json({
          accessible: false,
          error: validation.error,
          code: "UNSUPPORTED_FILE_TYPE"
        });
      }

      res.json({
        accessible: true,
        fileInfo: {
          mimeType: result.mimeType,
          size: result.size,
          fileName: result.fileName,
          fileType: result.mimeType ? getFileType(result.mimeType) : 'document',
          category: validation.category,
          sizeMB: result.size ? Math.round(result.size / (1024 * 1024) * 100) / 100 : 0
        }
      });

    } catch (error) {
      console.error('Ошибка проверки URL:', error);
      res.status(500).json({ 
        accessible: false,
        error: "Ошибка при проверке URL",
        code: "CHECK_ERROR"
      });
    }
  });

  // Загрузка файла по URL с расширенными возможностями
  app.post("/api/media/download-url/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { url, description, tags, isPublic, customFileName } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ 
          message: "URL не указан",
          code: "MISSING_URL"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({ 
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      // Сначала проверяем доступность файла
      const urlCheck = await checkUrlAccessibility(url);
      if (!urlCheck.accessible) {
        return res.status(400).json({
          message: "Файл недоступен по указанной ссылке",
          error: urlCheck.error,
          code: "URL_NOT_ACCESSIBLE"
        });
      }

      // Создаем путь для сохранения
      const date = new Date().toISOString().split('T')[0];
      const uploadDir = join(process.cwd(), 'uploads', projectId.toString(), date);
      
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Генерируем уникальное имя файла
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const originalFileName = customFileName || urlCheck.fileName || 'downloaded-file';
      const extension = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
      const baseName = originalFileName
        .split('.')[0]
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 50);
      
      const fileName = `${uniqueSuffix}-${baseName}.${extension}`;
      const filePath = join(uploadDir, fileName);

      // Загружаем файл
      const downloadResult = await downloadFileFromUrl(url, filePath);
      
      if (!downloadResult.success) {
        return res.status(400).json({
          message: "Ошибка загрузки файла",
          error: downloadResult.error,
          code: "DOWNLOAD_FAILED"
        });
      }

      // Проверяем загруженный файл
      const validation = validateFileDetailed({
        mimetype: downloadResult.mimeType || 'application/octet-stream',
        size: downloadResult.size || 0,
        originalname: originalFileName,
        path: filePath
      } as any);

      if (!validation.valid) {
        // Удаляем файл если он не прошел валидацию
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
        return res.status(400).json({
          message: validation.error,
          code: "VALIDATION_FAILED"
        });
      }

      // Создаем URL для доступа к файлу
      const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

      // Обрабатываем теги
      const processedTags = tags 
        ? tags
            .split(',')
            .map((tag: string) => tag.trim().toLowerCase())
            .filter((tag: string) => tag.length > 0 && tag.length <= 50)
            .slice(0, 10)
        : [];

      // Автоматически добавляем теги
      const autoTags = ['загружено_по_url'];
      if (validation.category) {
        autoTags.push(validation.category);
      }
      if (downloadResult.mimeType?.includes('gif')) {
        autoTags.push('анимация');
      }
      if (downloadResult.size && downloadResult.size > 10 * 1024 * 1024) {
        autoTags.push('большой_файл');
      }

      const finalTags = Array.from(new Set([...processedTags, ...autoTags]));

      // Сохраняем информацию о файле в базе данных
      const mediaFile = await storage.createMediaFile({
        projectId,
        fileName: originalFileName,
        fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
        filePath: filePath,
        fileSize: downloadResult.size || 0,
        mimeType: downloadResult.mimeType || 'application/octet-stream',
        url: fileUrl,
        description: description || `Файл загружен по ссылке: ${originalFileName}`,
        tags: finalTags,
        isPublic: isPublic === 'true' || isPublic === true ? 1 : 0
      });

      // Возвращаем подробную информацию о загруженном файле
      res.json({
        ...mediaFile,
        downloadInfo: {
          sourceUrl: url,
          category: validation.category,
          sizeMB: Math.round((downloadResult.size || 0) / (1024 * 1024) * 100) / 100,
          autoTagsAdded: autoTags.length,
          downloadDate: new Date().toISOString(),
          method: 'url_download'
        }
      });

    } catch (error) {
      console.error('Ошибка при загрузке файла по URL:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      res.status(500).json({ 
        message: "Ошибка при загрузке файла по URL",
        error: errorMessage,
        code: "DOWNLOAD_ERROR"
      });
    }
  });

  // Пакетная загрузка файлов по URL (множественная загрузка)
  app.post("/api/media/download-urls/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { urls, isPublic, defaultDescription } = req.body;
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ 
          message: "URLs не указаны",
          code: "MISSING_URLS"
        });
      }

      if (urls.length > 10) {
        return res.status(400).json({ 
          message: "Максимум 10 URL за раз",
          code: "TOO_MANY_URLS"
        });
      }

      // Проверяем, что проект существует
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({ 
          message: "Проект не найден",
          code: "PROJECT_NOT_FOUND"
        });
      }

      const downloadedFiles = [];
      const errors = [];
      
      // Создаем путь для сохранения
      const date = new Date().toISOString().split('T')[0];
      const uploadDir = join(process.cwd(), 'uploads', projectId.toString(), date);
      
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Обрабатываем каждый URL
      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        const url = typeof urlData === 'string' ? urlData : urlData.url;
        const customFileName = typeof urlData === 'object' ? urlData.fileName : undefined;
        const customDescription = typeof urlData === 'object' ? urlData.description : undefined;
        
        try {
          // Проверяем доступность
          const urlCheck = await checkUrlAccessibility(url);
          if (!urlCheck.accessible) {
            errors.push({
              url: url,
              error: `Файл недоступен: ${urlCheck.error}`
            });
            continue;
          }

          // Генерируем путь для файла
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const originalFileName = customFileName || urlCheck.fileName || `file-${i + 1}`;
          const extension = originalFileName.split('.').pop()?.toLowerCase() || 'bin';
          const baseName = originalFileName
            .split('.')[0]
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 50);
          
          const fileName = `${uniqueSuffix}-${baseName}.${extension}`;
          const filePath = join(uploadDir, fileName);

          // Загружаем файл
          const downloadResult = await downloadFileFromUrl(url, filePath);
          
          if (!downloadResult.success) {
            errors.push({
              url: url,
              error: `Ошибка загрузки: ${downloadResult.error}`
            });
            continue;
          }

          // Валидация
          const validation = validateFileDetailed({
            mimetype: downloadResult.mimeType || 'application/octet-stream',
            size: downloadResult.size || 0,
            originalname: originalFileName,
            path: filePath
          } as any);

          if (!validation.valid) {
            if (existsSync(filePath)) {
              unlinkSync(filePath);
            }
            errors.push({
              url: url,
              error: `Валидация не пройдена: ${validation.error}`
            });
            continue;
          }

          // Создаем URL для доступа
          const fileUrl = `/uploads/${projectId}/${date}/${fileName}`;

          // Сохраняем в базе данных
          const mediaFile = await storage.createMediaFile({
            projectId,
            fileName: originalFileName,
            fileType: getFileType(downloadResult.mimeType || 'application/octet-stream'),
            filePath: filePath,
            fileSize: downloadResult.size || 0,
            mimeType: downloadResult.mimeType || 'application/octet-stream',
            url: fileUrl,
            description: customDescription || defaultDescription || `Файл загружен по ссылке: ${originalFileName}`,
            tags: ['загружено_по_url', validation.category || 'файл'],
            isPublic: isPublic ? 1 : 0
          });

          downloadedFiles.push({
            ...mediaFile,
            sourceUrl: url
          });

        } catch (error) {
          console.error(`Ошибка обработки URL ${url}:`, error);
          errors.push({
            url: url,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
          });
        }
      }

      res.json({
        success: downloadedFiles.length,
        errors: errors.length,
        downloadedFiles,
        errorDetails: errors,
        summary: {
          total: urls.length,
          successful: downloadedFiles.length,
          failed: errors.length,
          totalSize: downloadedFiles.reduce((sum, file) => sum + file.fileSize, 0)
        }
      });

    } catch (error) {
      console.error('Ошибка пакетной загрузки по URL:', error);
      res.status(500).json({ 
        message: "Ошибка при пакетной загрузке файлов по URL",
        code: "BATCH_DOWNLOAD_ERROR"
      });
    }
  });
  
  // Получение всех медиафайлов проекта
  app.get("/api/media/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const fileType = req.query.type as string;
      
      let mediaFiles;
      if (fileType && ['photo', 'video', 'audio', 'document'].includes(fileType)) {
        mediaFiles = await storage.getMediaFilesByType(projectId, fileType);
      } else {
        mediaFiles = await storage.getMediaFilesByProject(projectId);
      }
      
      res.json(mediaFiles);
    } catch (error) {
      console.error("Ошибка при получении медиафайлов:", error);
      res.status(500).json({ message: "Ошибка при получении медиафайлов" });
    }
  });
  
  // Получение конкретного медиафайла
  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(id);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }
      
      res.json(mediaFile);
    } catch (error) {
      console.error("Ошибка при получении файла:", error);
      res.status(500).json({ message: "Ошибка при получении файла" });
    }
  });
  
  // Обновление медиафайла
  app.put("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const mediaFile = await storage.updateMediaFile(id, updates);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }
      
      res.json(mediaFile);
    } catch (error) {
      console.error("Ошибка при обновлении файла:", error);
      res.status(500).json({ message: "Ошибка при обновлении файла" });
    }
  });
  
  // Удаление медиафайла
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Получаем информацию о файле перед удалением
      const mediaFile = await storage.getMediaFile(id);
      if (!mediaFile) {
        return res.status(404).json({ message: "Файл не найден" });
      }
      
      // Удаляем файл с диска
      try {
        unlinkSync(mediaFile.filePath);
      } catch (error) {
        console.warn("Не удалось удалить файл с диска:", error);
      }
      
      // Удаляем запись из базы данных
      const success = await storage.deleteMediaFile(id);
      
      if (!success) {
        return res.status(404).json({ message: "Файл не найден в базе данных" });
      }
      
      res.json({ message: "Файл успешно удален" });
    } catch (error) {
      console.error("Ошибка при удалении файла:", error);
      res.status(500).json({ message: "Ошибка при удалении файла" });
    }
  });
  
  // Поиск медиафайлов
  app.get("/api/media/search/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Поисковый запрос не может быть пустым" });
      }
      
      const mediaFiles = await storage.searchMediaFiles(projectId, query);
      res.json(mediaFiles);
    } catch (error) {
      console.error("Ошибка при поиске файлов:", error);
      res.status(500).json({ message: "Ошибка при поиске файлов" });
    }
  });
  
  // Увеличение счетчика использования файла
  app.post("/api/media/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementMediaFileUsage(id);
      
      if (!success) {
        return res.status(404).json({ message: "Файл не найден" });
      }
      
      res.json({ message: "Использование файла отмечено" });
    } catch (error) {
      console.error("Ошибка при обновлении использования файла:", error);
      res.status(500).json({ message: "Ошибка при обновлении использования файла" });
    }
  });

  // User Bot Data Management endpoints
  
  // Get all user data for a project
  app.get("/api/projects/:id/users", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      console.log(`Fetching users for project ${projectId}`);
      
      // Connect directly to PostgreSQL to get data from bot_users table
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const result = await pool.query(`
        SELECT 
          user_id,
          username,
          first_name,
          last_name,
          registered_at,
          last_interaction,
          interaction_count,
          user_data,
          is_active
        FROM bot_users 
        ORDER BY last_interaction DESC
      `);
      
      await pool.end();
      
      console.log(`Found ${result.rows.length} users for project ${projectId}`);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to storage interface if bot_users table doesn't exist
      try {
        const users = await storage.getUserBotDataByProject(parseInt(req.params.id));
        const projectId = parseInt(req.params.id);
        console.log(`Found ${users.length} users for project ${projectId} from fallback`);
        res.json(users);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to fetch user data" });
      }
    }
  });

  // Get user data stats for a project
  app.get("/api/projects/:id/users/stats", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      console.log(`Fetching user stats for project ${projectId}`);
      
      // Use direct PostgreSQL query on bot_users table
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const result = await pool.query(`
        SELECT 
          COUNT(*) as "totalUsers",
          COUNT(*) FILTER (WHERE is_active = 1) as "activeUsers",
          COUNT(*) FILTER (WHERE is_active = 0) as "blockedUsers",
          0 as "premiumUsers",
          COUNT(*) FILTER (WHERE user_data IS NOT NULL AND user_data != '{}' AND (user_data::text LIKE '%response_%' OR user_data::text LIKE '%feedback%' OR user_data::text LIKE '%answer%' OR user_data::text LIKE '%input%' OR user_data::text LIKE '%user_%')) as "usersWithResponses",
          COALESCE(SUM(interaction_count), 0) as "totalInteractions",
          COALESCE(AVG(interaction_count), 0) as "avgInteractionsPerUser"
        FROM bot_users
      `);
      
      await pool.end();
      
      const stats = result.rows[0];
      // Convert strings to numbers
      Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
          stats[key] = parseInt(stats[key] as any);
        }
      });
      
      console.log(`User stats for project ${projectId}:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Fallback to user_bot_data table if bot_users doesn't exist
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL
        });
        
        const result = await pool.query(`
          SELECT 
            COUNT(*) as "totalUsers",
            COUNT(*) FILTER (WHERE is_active = 1) as "activeUsers",
            COUNT(*) FILTER (WHERE is_active = 0) as "blockedUsers",
            COUNT(*) FILTER (WHERE is_premium = 1) as "premiumUsers",
            COUNT(*) FILTER (WHERE user_data IS NOT NULL AND user_data != '{}' AND (user_data::text LIKE '%response_%' OR user_data::text LIKE '%feedback%' OR user_data::text LIKE '%answer%' OR user_data::text LIKE '%input%' OR user_data::text LIKE '%user_%')) as "usersWithResponses",
            COALESCE(SUM(interaction_count), 0) as "totalInteractions",
            COALESCE(AVG(interaction_count), 0) as "avgInteractionsPerUser"
          FROM user_bot_data
          WHERE project_id = $1
        `, [req.params.id]);
        
        await pool.end();
        
        const stats = result.rows[0];
        Object.keys(stats).forEach(key => {
          if (typeof stats[key] === 'string' && !isNaN(stats[key] as any)) {
            stats[key] = parseInt(stats[key] as any);
          }
        });
        
        res.json(stats);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to fetch user stats" });
      }
    }
  });

  // Get detailed user responses for a project
  app.get("/api/projects/:id/responses", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Подключаемся напрямую к PostgreSQL для получения ответов пользователей из bot_users
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const result = await pool.query(`
        SELECT 
          user_id,
          username,
          first_name,
          last_name,
          user_data,
          registered_at,
          last_interaction
        FROM bot_users 
        WHERE user_data IS NOT NULL 
          AND user_data != '{}'
        ORDER BY last_interaction DESC
      `);
      
      await pool.end();
      
      // Обрабатываем и структурируем ответы
      const processedResponses = result.rows.map(user => {
        const responses: any[] = [];
        
        if (user.user_data && typeof user.user_data === 'object') {
          Object.entries(user.user_data).forEach(([key, value]) => {
            // Принимаем все переменные кроме служебных и generic button clicks
            if (!key.startsWith('input_') && !key.startsWith('waiting_') && key !== 'button_click' && key !== 'last_button_click') {
              let responseData;
              let responseType = 'text';
              let timestamp = null;
              let nodeId = null;
              let responseValue = value;
              
              try {
                // Если value является объектом, извлекаем данные
                if (typeof value === 'object' && value !== null) {
                  responseData = value as any;
                  responseValue = responseData.value || value;
                  responseType = responseData.type || 'text';
                  timestamp = responseData.timestamp;
                  nodeId = responseData.nodeId;
                } else {
                  // Простое значение
                  responseValue = value;
                  responseType = 'text';
                }
                
                // Определяем тип ответа по контексту
                if (key === 'button_click') {
                  responseType = 'button';
                  // Если это callback data (выглядит как node ID), заменяем на понятное название
                  if (typeof responseValue === 'string' && 
                      (responseValue.match(/^[a-zA-Z0-9_-]{15,25}$/) || 
                       responseValue.match(/^--[a-zA-Z0-9_-]{10,}$/) ||
                       responseValue.includes('-') && responseValue.length > 10)) {
                    responseValue = 'Переход к следующему шагу';
                  }
                } else if (key.includes('желание') || key.includes('пол') || key.includes('choice')) {
                  responseType = 'button';
                } else if (typeof responseValue === 'string' && 
                          (responseValue === 'Да' || responseValue === 'Нет' || 
                           responseValue === 'Женщина' || responseValue === 'Мужчина')) {
                  responseType = 'button';
                }
                
                // Дополнительная проверка для замены node IDs на понятные названия
                if (typeof responseValue === 'string') {
                  // Проверяем различные форматы node ID
                  if (responseValue.match(/^--[a-zA-Z0-9_-]{10,}$/) ||
                      responseValue.match(/^[a-zA-Z0-9_-]{15,}$/) ||
                      responseValue.match(/^[a-zA-Z0-9-]{20,}$/)) {
                    responseValue = 'Переход к следующему шагу';
                    responseType = 'button';
                  }
                }
                
                // Если нет временной метки, используем последнее взаимодействие
                if (!timestamp) {
                  timestamp = user.last_interaction;
                }
                
              } catch (error) {
                // Если не удается обработать, создаем простую структуру
                responseValue = value;
                responseType = 'text';
                timestamp = user.last_interaction;
              }
              
              responses.push({
                key,
                value: responseValue,
                type: responseType,
                timestamp: timestamp,
                nodeId: nodeId,
                variable: key
              });
            }
          });
        }
        
        return {
          user_id: user.user_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          registered_at: user.registered_at,
          last_interaction: user.last_interaction,
          responses: responses.sort((a, b) => 
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          ),
          responseCount: responses.length
        };
      }).filter(user => user.responses.length > 0); // Показываем только пользователей с ответами
      
      res.json(processedResponses);
    } catch (error) {
      console.error("Ошибка получения ответов пользователей:", error);
      res.status(500).json({ message: "Failed to fetch user responses" });
    }
  });

  // Get specific user data by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = await storage.getUserBotData(id);
      if (!userData) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Get user data by project and telegram user ID
  app.get("/api/projects/:projectId/users/:userId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.params.userId;
      const userData = await storage.getUserBotDataByProjectAndUser(projectId, userId);
      if (!userData) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Create new user data
  app.post("/api/projects/:id/users", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const validatedData = insertUserBotDataSchema.parse({
        ...req.body,
        projectId
      });
      const userData = await storage.createUserBotData(validatedData);
      res.status(201).json(userData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user data" });
    }
  });

  // Update user data in bot_users table
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id; // This is telegram user_id as string
      
      // Подключаемся напрямую к PostgreSQL для обновления данных в bot_users
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      // Проверяем какие поля можно обновить
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      if (req.body.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(Boolean(req.body.isActive === 1 || req.body.isActive === true));
      }
      
      // Note: is_blocked and is_premium columns don't exist in bot_users table
      // These fields are handled through user_data JSON field if needed
      
      if (updateFields.length === 0) {
        await pool.end();
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const query = `
        UPDATE bot_users 
        SET ${updateFields.join(', ')}, last_interaction = NOW()
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;
      values.push(userId);
      
      console.log('Updating user:', userId, 'with query:', query, 'values:', values);
      
      const result = await pool.query(query, values);
      await pool.end();
      
      console.log('Update result:', result.rows.length, 'rows affected');
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Ошибка обновления пользователя в bot_users:", error);
      // Fallback to regular update if bot_users table doesn't exist
      try {
        const id = parseInt(req.params.id);
        const validatedData = insertUserBotDataSchema.partial().parse(req.body);
        const userData = await storage.updateUserBotData(id, validatedData);
        if (!userData) {
          return res.status(404).json({ message: "User data not found" });
        }
        res.json(userData);
      } catch (fallbackError) {
        res.status(500).json({ message: "Failed to update user data" });
      }
    }
  });

  // Delete user data
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Подключение к PostgreSQL для прямого удаления
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Пытаемся удалить из bot_users если пользователь передал user_id
        const deleteResult = await pool.query(
          `DELETE FROM bot_users WHERE user_id = $1`,
          [id]
        );
        
        await pool.end();
        
        if (deleteResult.rowCount && deleteResult.rowCount > 0) {
          console.log(`Deleted user ${id} from bot_users table`);
          return res.json({ message: "User data deleted successfully" });
        }
      } catch (dbError) {
        await pool.end();
        console.log("bot_users table not found, falling back to user_bot_data");
      }

      // Fallback: удаляем из user_bot_data таблицы
      const success = await storage.deleteUserBotData(id);
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "User data deleted successfully" });
    } catch (error) {
      console.error("Failed to delete user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Delete all user data for a project
  app.delete("/api/projects/:id/users", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      let totalDeleted = 0;
      
      // Подключение к PostgreSQL
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      try {
        // Удаляем всех пользователей из таблицы bot_users для данного проекта
        const deleteResult = await pool.query(
          `DELETE FROM bot_users WHERE project_id = $1`,
          [projectId]
        );
        
        totalDeleted += deleteResult.rowCount || 0;
        console.log(`Deleted ${deleteResult.rowCount || 0} users from bot_users for project ${projectId}`);
      } catch (dbError) {
        console.log("bot_users table not found or error:", (dbError as any).message);
      }

      await pool.end();
      
      // Подсчитываем количество записей в user_bot_data перед удалением
      const existingUserData = await storage.getUserBotDataByProject(projectId);
      const userBotDataCount = existingUserData.length;
      
      // Удаляем из user_bot_data таблицы
      const fallbackSuccess = await storage.deleteUserBotDataByProject(projectId);
      if (fallbackSuccess) {
        totalDeleted += userBotDataCount;
        console.log(`Deleted ${userBotDataCount} users from user_bot_data for project ${projectId}`);
      }
      
      res.json({ 
        message: "All user data deleted successfully", 
        deleted: true,
        deletedCount: totalDeleted
      });
    } catch (error) {
      console.error("Failed to delete user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Search user data
  app.get("/api/projects/:id/users/search", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const query = req.query.q as string;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const users = await storage.searchUserBotData(projectId, query.trim());
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search user data" });
    }
  });

  // Increment user interaction count
  app.post("/api/users/:id/interaction", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.incrementUserInteraction(id);
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "Interaction count incremented" });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment interaction" });
    }
  });

  // Update user state
  app.put("/api/users/:id/state", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { state } = req.body;
      
      if (!state || typeof state !== 'string') {
        return res.status(400).json({ message: "State is required and must be a string" });
      }
      
      const success = await storage.updateUserState(id, state);
      if (!success) {
        return res.status(404).json({ message: "User data not found" });
      }
      res.json({ message: "User state updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user state" });
    }
  });

  // Bot Groups API
  // Get groups for a project
  app.get("/api/projects/:id/groups", async (req, res) => {
    console.log("=== GROUPS API CALLED ===");
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      console.log("Getting groups for project", projectId);
      console.log("Storage methods available:", Object.getOwnPropertyNames(storage).includes('getBotGroupsByProject'));
      console.log("Storage prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(storage)));
      
      const groups = await storage.getBotGroupsByProject(projectId);
      console.log("Groups found:", groups);
      res.json(groups);
    } catch (error) {
      console.error("Failed to get groups:", error);
      res.status(500).json({ message: "Failed to get groups" });
    }
  });

  // Create a new group
  app.post("/api/projects/:id/groups", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      console.log("=== CREATE GROUP DEBUG ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Project ID:", projectId);
      console.log("Data to validate:", JSON.stringify({ ...req.body, projectId }, null, 2));
      
      const result = insertBotGroupSchema.safeParse({ ...req.body, projectId });
      if (!result.success) {
        console.log("Validation errors:", JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ message: "Invalid group data", errors: result.error.errors });
      }
      
      console.log("Validation successful, data:", JSON.stringify(result.data, null, 2));
      
      const group = await storage.createBotGroup(result.data);
      res.json(group);
    } catch (error) {
      console.error("Failed to create group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Update a group
  app.put("/api/projects/:projectId/groups/:groupId", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const group = await storage.updateBotGroup(groupId, req.body);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error("Failed to update group:", error);
      res.status(500).json({ message: "Failed to update group" });
    }
  });

  // Delete a group
  app.delete("/api/projects/:projectId/groups/:groupId", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const success = await storage.deleteBotGroup(groupId);
      if (!success) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Failed to delete group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Telegram Bot API integration for groups
  // Send message to group
  app.post("/api/projects/:projectId/bot/send-group-message", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, message } = req.body;
      
      if (!groupId || !message) {
        return res.status(400).json({ message: "Group ID and message are required" });
      }

      // Get bot token for this project
      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found. Please add a token first." });
      }

      // Send message via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/sendMessage`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to send message", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ 
        message: "Message sent successfully", 
        messageId: result.result.message_id 
      });
    } catch (error) {
      console.error("Failed to send group message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get group chat information
  app.get("/api/projects/:projectId/bot/group-info/:groupId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId } = req.params;
      
      // Check if groupId is null, undefined, or "null" string
      if (!groupId || groupId === 'null' || groupId === 'undefined') {
        return res.status(400).json({ 
          message: "Не указан ID группы", 
          error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
        });
      }
      
      // Get bot token for this project
      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found. Please add a token first." });
      }

      // Get chat information via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChat`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to get group info", 
          error: result.description || "Unknown error"
        });
      }

      const chatInfo = result.result;
      
      // If chat has photo, get the file URL
      let avatarUrl = null;
      if (chatInfo.photo && chatInfo.photo.big_file_id) {
        try {
          // Get file info
          const fileResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file_id: chatInfo.photo.big_file_id
            })
          });
          
          const fileResult = await fileResponse.json();
          
          if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
            // Construct full photo URL
            avatarUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
          }
        } catch (photoError) {
          console.warn("Failed to get group photo URL:", photoError);
          // Continue without photo - not a critical error
        }
      }

      // Add avatar URL to response
      const responseData = {
        ...chatInfo,
        avatarUrl: avatarUrl
      };

      res.json(responseData);
    } catch (error) {
      console.error("Failed to get group info:", error);
      res.status(500).json({ message: "Failed to get group info" });
    }
  });

  // Get group members count
  app.get("/api/projects/:projectId/bot/group-members-count/:groupId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId } = req.params;
      
      // Check if groupId is null, undefined, or "null" string
      if (!groupId || groupId === 'null' || groupId === 'undefined') {
        return res.status(400).json({ 
          message: "Не указан ID группы", 
          error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
        });
      }
      
      // Get bot token for this project
      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found. Please add a token first." });
      }

      // Get members count via Telegram Bot API
      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMemberCount`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to get members count", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ count: result.result });
    } catch (error) {
      console.error("Failed to get members count:", error);
      res.status(500).json({ message: "Failed to get members count" });
    }
  });

  // Get bot admin status in group
  app.get("/api/projects/:projectId/bot/admin-status/:groupId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId } = req.params;
      
      // Check if groupId is null, undefined, or "null" string
      if (!groupId || groupId === 'null' || groupId === 'undefined') {
        return res.status(400).json({ 
          message: "Не указан ID группы", 
          error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
        });
      }
      
      // Get bot token for this project
      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found. Please add a token first." });
      }

      // Get bot information first
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
      const botInfo = await botInfoResponse.json();
      
      if (!botInfoResponse.ok) {
        return res.status(400).json({ message: "Failed to get bot info" });
      }

      const botId = botInfo.result.id;

      // Check bot admin status
      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: botId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to get admin status", 
          error: result.description || "Unknown error"
        });
      }

      const isAdmin = ['administrator', 'creator'].includes(result.result.status);
      
      res.json({ 
        isAdmin,
        status: result.result.status,
        permissions: result.result
      });
    } catch (error) {
      console.error("Failed to get admin status:", error);
      res.status(500).json({ message: "Failed to get admin status" });
    }
  });

  // Get group administrators
  app.get("/api/projects/:projectId/bot/group-admins/:groupId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId } = req.params;
      
      if (!groupId || groupId === "null") {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to get administrators", 
          error: result.description || "Unknown error"
        });
      }

      // Найти бота среди администраторов и извлечь его права
      let botAdminRights = null;
      const botUser = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
      const botInfo = await botUser.json();
      
      if (botUser.ok && result.result) {
        const botAdmin = result.result.find((admin: any) => 
          admin.user && admin.user.id === botInfo.result.id
        );
        
        if (botAdmin && botAdmin.status === 'administrator') {
          // Извлекаем права администратора бота
          botAdminRights = {
            can_manage_chat: botAdmin.can_manage_chat || false,
            can_change_info: botAdmin.can_change_info || false,
            can_delete_messages: botAdmin.can_delete_messages || false,
            can_invite_users: botAdmin.can_invite_users || false,
            can_restrict_members: botAdmin.can_restrict_members || false,
            can_pin_messages: botAdmin.can_pin_messages || false,
            can_promote_members: botAdmin.can_promote_members || false,
            can_manage_video_chats: botAdmin.can_manage_video_chats || false
          };
        }
      }

      res.json({ 
        administrators: result.result,
        botAdminRights: botAdminRights
      });
    } catch (error) {
      console.error("Failed to get administrators:", error);
      res.status(500).json({ message: "Failed to get administrators" });
    }
  });

  // Get all group members (works only for small groups <200 members)
  app.get("/api/projects/:projectId/bot/group-members/:groupId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId } = req.params;
      
      if (!groupId || groupId === "null") {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      // First check if this is a small group by getting chat info
      const chatInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId
        })
      });

      const chatInfo = await chatInfoResponse.json();
      
      if (!chatInfoResponse.ok) {
        return res.status(400).json({ 
          message: "Failed to get chat info", 
          error: chatInfo.description || "Unknown error"
        });
      }

      // For large groups, we can only provide administrators
      // Check only member count, not group type - small supergroups should work
      if (chatInfo.result.members_count && chatInfo.result.members_count > 200) {
        return res.status(400).json({ 
          message: "Cannot get member list for large groups", 
          error: "Telegram API allows getting full member list only for small groups (<200 members). For large groups, only administrators are available.",
          membersCount: chatInfo.result.members_count
        });
      }

      // Telegram Bot API has limitations for getting chat members
      // For privacy reasons, even small groups only allow getting administrators
      try {
        const adminsResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: groupId
          })
        });

        const adminsResult = await adminsResponse.json();
        
        if (!adminsResponse.ok) {
          return res.status(400).json({ 
            message: "Ошибка при получении участников", 
            error: adminsResult.description || "Неизвестная ошибка"
          });
        }

        // Include information about group size
        const memberCount = chatInfo.result.members_count || 'Неизвестно';
        
        return res.json({ 
          members: adminsResult.result,
          isPartialList: true,
          totalCount: memberCount,
          message: `Группа содержит ${memberCount} участников. Показаны только администраторы (${adminsResult.result.length}).`,
          explanation: "Telegram API ограничивает доступ к списку участников по соображениям приватности. Доступны только администраторы."
        });

      } catch (error) {
        console.error("Error getting members:", error);
        res.status(500).json({ message: "Failed to get group members" });
      }

    } catch (error) {
      console.error("Failed to get group members:", error);
      res.status(500).json({ message: "Failed to get group members" });
    }
  });

  // Ban group member
  app.post("/api/projects/:projectId/bot/ban-member", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, userId, untilDate } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ message: "Group ID and User ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/banChatMember`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: userId,
          until_date: untilDate || undefined
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to ban member", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Member banned successfully" });
    } catch (error) {
      console.error("Failed to ban member:", error);
      res.status(500).json({ message: "Failed to ban member" });
    }
  });

  // Unban group member
  app.post("/api/projects/:projectId/bot/unban-member", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, userId } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ message: "Group ID and User ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/unbanChatMember`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: userId,
          only_if_banned: true
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to unban member", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Member unbanned successfully" });
    } catch (error) {
      console.error("Failed to unban member:", error);
      res.status(500).json({ message: "Failed to unban member" });
    }
  });

  // Promote group member to admin
  app.post("/api/projects/:projectId/bot/promote-member", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, userId, permissions } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ message: "Group ID and User ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/promoteChatMember`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: userId,
          ...permissions
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to promote member", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Member promoted successfully" });
    } catch (error) {
      console.error("Failed to promote member:", error);
      res.status(500).json({ message: "Failed to promote member" });
    }
  });

  // Restrict group member
  app.post("/api/projects/:projectId/bot/restrict-member", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, userId, permissions, untilDate } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ message: "Group ID and User ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/restrictChatMember`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          user_id: userId,
          permissions: permissions,
          until_date: untilDate || undefined
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Bot API restrict member failed:", result);
        return res.status(400).json({ 
          message: "Failed to restrict member", 
          error: result.description || "Unknown error",
          details: result
        });
      }

      res.json({ success: true, message: "Member restricted successfully" });
    } catch (error) {
      console.error("Failed to restrict member:", error);
      res.status(500).json({ message: "Failed to restrict member" });
    }
  });

  // Set group photo using Bot API
  app.post("/api/projects/:projectId/bot/set-group-photo", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, photoPath } = req.body;
      
      if (!groupId || !photoPath) {
        return res.status(400).json({ message: "Group ID and photo path are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      // Читаем файл и отправляем через multipart/form-data
      const fs = await import('fs');
      const path = await import('path');
      
      const photoBuffer = fs.readFileSync(photoPath);
      const fileName = path.basename(photoPath);
      
      // Создаем multipart form data вручную
      const boundary = '----formdata-replit-' + Math.random().toString(36);
      const CRLF = '\r\n';
      
      let body = '';
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}`;
      body += `${groupId}${CRLF}`;
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="photo"; filename="${fileName}"${CRLF}`;
      body += `Content-Type: image/png${CRLF}${CRLF}`;
      
      const bodyBuffer = Buffer.concat([
        Buffer.from(body, 'utf8'),
        photoBuffer,
        Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8')
      ]);

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatPhoto`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length.toString(),
        },
        body: bodyBuffer,
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to set group photo", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Group photo updated successfully" });
    } catch (error: any) {
      console.error("Failed to set group photo:", error);
      res.status(500).json({ 
        message: "Failed to set group photo", 
        error: error.message || "Unknown error"
      });
    }
  });

  // Set group title
  app.post("/api/projects/:projectId/bot/set-group-title", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, title } = req.body;
      
      if (!groupId || !title) {
        return res.status(400).json({ message: "Group ID and title are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatTitle`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          title: title
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to set group title", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Group title updated successfully" });
    } catch (error) {
      console.error("Failed to set group title:", error);
      res.status(500).json({ message: "Failed to set group title" });
    }
  });

  // Set group description
  app.post("/api/projects/:projectId/bot/set-group-description", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, description } = req.body;
      
      if (!groupId || !description) {
        return res.status(400).json({ message: "Group ID and description are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setChatDescription`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          description: description
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to set group description", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Group description updated successfully" });
    } catch (error) {
      console.error("Failed to set group description:", error);
      res.status(500).json({ message: "Failed to set group description" });
    }
  });

  // Set group username (make public/private)
  app.post("/api/projects/:projectId/bot/set-group-username", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, username } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      // Для установки username нужны права создателя или админа, используем Client API если доступен
      try {
        // Проверяем есть ли Telegram Client API доступ
        const clientManager = telegramClientManager;
        if (clientManager) {
          // Пытаемся использовать Client API для установки username
          const result = await clientManager.setChatUsername('default', groupId, username);
          
          res.json({ 
            success: true, 
            message: username ? "Group username set successfully" : "Group made private successfully",
            result 
          });
          return;
        }
      } catch (clientError) {
        console.log("Client API не доступен, используем Bot API:", clientError);
      }

      // Fallback: используем Bot API (ограниченная функциональность)
      // Bot API не может изменять username, только создатель через Client API
      return res.status(400).json({ 
        message: "Setting group username requires creator/admin privileges. Please use Telegram Client API authorization.",
        requiresClientApi: true
      });

    } catch (error) {
      console.error("Failed to set group username:", error);
      res.status(500).json({ message: "Failed to set group username" });
    }
  });

  // Pin message in group
  app.post("/api/projects/:projectId/bot/pin-message", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, messageId, disableNotification } = req.body;
      
      if (!groupId || !messageId) {
        return res.status(400).json({ message: "Group ID and message ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/pinChatMessage`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          message_id: messageId,
          disable_notification: disableNotification || false
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to pin message", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Message pinned successfully" });
    } catch (error) {
      console.error("Failed to pin message:", error);
      res.status(500).json({ message: "Failed to pin message" });
    }
  });

  // Unpin message in group
  app.post("/api/projects/:projectId/bot/unpin-message", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, messageId } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = messageId 
        ? `https://api.telegram.org/bot${defaultToken.token}/unpinChatMessage`
        : `https://api.telegram.org/bot${defaultToken.token}/unpinAllChatMessages`;
        
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          ...(messageId && { message_id: messageId })
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to unpin message", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: messageId ? "Message unpinned successfully" : "All messages unpinned successfully" });
    } catch (error) {
      console.error("Failed to unpin message:", error);
      res.status(500).json({ message: "Failed to unpin message" });
    }
  });

  // Create new invite link for group
  app.post("/api/projects/:projectId/bot/create-invite-link", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, name, expireDate, memberLimit, createsJoinRequest } = req.body;
      
      if (!groupId) {
        return res.status(400).json({ message: "Group ID is required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/createChatInviteLink`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          name: name || undefined,
          expire_date: expireDate || undefined,
          member_limit: memberLimit || undefined,
          creates_join_request: createsJoinRequest || false
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to create invite link", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ 
        success: true, 
        inviteLink: result.result,
        message: "Invite link created successfully" 
      });
    } catch (error) {
      console.error("Failed to create invite link:", error);
      res.status(500).json({ message: "Failed to create invite link" });
    }
  });

  // Delete message in group
  app.post("/api/projects/:projectId/bot/delete-message", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { groupId, messageId } = req.body;
      
      if (!groupId || !messageId) {
        return res.status(400).json({ message: "Group ID and message ID are required" });
      }

      const defaultToken = await storage.getDefaultBotToken(projectId);
      if (!defaultToken) {
        return res.status(400).json({ message: "Bot token not found for this project" });
      }

      const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/deleteMessage`;
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: groupId,
          message_id: messageId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return res.status(400).json({ 
          message: "Failed to delete message", 
          error: result.description || "Unknown error"
        });
      }

      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Failed to delete message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Telegram Client API endpoints
  
  // Save user Telegram API credentials
  app.post("/api/telegram-settings", async (req, res) => {
    try {
      const { userId, apiId, apiHash, phoneNumber } = req.body;
      
      if (!userId || !apiId || !apiHash) {
        return res.status(400).json({ 
          message: "userId, apiId, and apiHash are required" 
        });
      }

      // Here we would save to database - for now, return success
      // TODO: Implement storage.createUserTelegramSettings()
      
      res.json({ 
        message: "Telegram API credentials saved successfully",
        success: true 
      });
    } catch (error) {
      console.error("Failed to save Telegram API credentials:", error);
      res.status(500).json({ message: "Failed to save credentials" });
    }
  });

  // Get group members using Telegram Client API
  app.get("/api/projects/:projectId/telegram-client/group-members/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      
      // Check if API credentials are available
      const apiId = process.env.TELEGRAM_API_ID;
      const apiHash = process.env.TELEGRAM_API_HASH;
      
      if (!apiId || !apiHash) {
        console.log('⚠️ CLIENT API: Telegram API credentials not configured, returning demo data');
        
        // Return demo data when credentials are not configured
        return res.json({
          success: true,
          message: "🎭 Демо-режим: показаны примерные участники",
          explanation: "Для получения реальных данных настройте TELEGRAM_API_ID и TELEGRAM_API_HASH",
          groupId,
          memberCount: 3,
          members: [
            {
              id: 123456789,
              username: "demo_user1",
              firstName: "Демо",
              lastName: "Пользователь 1",
              isBot: false,
              status: "active",
              joinedAt: new Date().toISOString(),
              source: "demo_data"
            },
            {
              id: 987654321,
              username: "demo_user2", 
              firstName: "Демо",
              lastName: "Пользователь 2",
              isBot: false,
              status: "active",
              joinedAt: new Date().toISOString(),
              source: "demo_data"
            },
            {
              id: 555666777,
              username: "demo_bot",
              firstName: "Демо",
              lastName: "Бот",
              isBot: true,
              status: "active",
              joinedAt: new Date().toISOString(),
              source: "demo_data"
            }
          ],
          isDemoMode: true,
          note: "Это демонстрационные данные. Для получения реальных участников настройте API credentials."
        });
      }

      console.log(`🔍 CLIENT API: Получение участников группы ${groupId} через Client API`);

      try {
        // Try to use real Telegram Client API to get group members
        const members = await telegramClientManager.getGroupMembers('default', groupId);
        
        if (members && members.length > 0) {
          console.log(`✅ CLIENT API: Найдено ${members.length} реальных участников группы`);
          
          res.json({
            success: true,
            message: `✅ Получен полный список участников через Client API`,
            explanation: "Client API позволяет получить всех участников группы, а не только администраторов",
            groupId,
            memberCount: members.length,
            members: members.map((member: any) => ({
              id: member.id,
              username: member.username,
              firstName: member.firstName,
              lastName: member.lastName,
              isBot: member.isBot,
              status: member.status,
              joinedAt: member.joinedAt,
              source: "client_api"
            })),
            advantages: [
              `Показывает всех участников группы (${members.length} реальных участников)`,
              "Включает обычных пользователей, не только админов", 
              "Предоставляет полную информацию о пользователях",
              "Обходит ограничения Bot API"
            ]
          });
        } else {
          throw new Error('No members found or Client API not connected');
        }
      } catch (error: any) {
        console.log(`⚠️ CLIENT API: Ошибка получения реальных данных: ${error?.message || 'Unknown error'}`);
        console.log('📝 CLIENT API: Требуется настройка Telegram клиента');
        
        res.status(400).json({
          success: false,
          message: "❌ Client API требует настройки",
          explanation: "Для получения полного списка участников необходимо настроить Telegram Client API с номером телефона",
          groupId,
          error: error?.message || 'Unknown error',
          requirements: [
            "Подключение к Telegram Client API с номером телефона",
            "Авторизация через код подтверждения",
            "Права доступа к данным группы"
          ],
          note: "Bot API показывает только администраторов, Client API может показать всех участников"
        });
      }
    } catch (error) {
      console.error("Failed to get group members via Client API:", error);
      res.status(500).json({ message: "Failed to get group members via Client API" });
    }
  });

  // Send verification code to phone number
  app.post("/api/telegram-auth/send-code", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: "Номер телефона обязателен"
        });
      }

      const result = await telegramClientManager.sendCode('default', phoneNumber);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Код отправлен на ваш номер",
          phoneCodeHash: result.phoneCodeHash
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to send verification code:", error);
      res.status(500).json({ 
        success: false,
        error: "Ошибка отправки кода" 
      });
    }
  });

  // Verify phone code
  app.post("/api/telegram-auth/verify-code", async (req, res) => {
    try {
      const { phoneNumber, phoneCode, phoneCodeHash } = req.body;
      
      if (!phoneNumber || !phoneCode || !phoneCodeHash) {
        return res.status(400).json({
          success: false,
          error: "Все поля обязательны"
        });
      }

      const result = await telegramClientManager.verifyCode('default', phoneNumber, phoneCode, phoneCodeHash);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Авторизация успешна"
        });
      } else if (result.needsPassword) {
        // Когда требуется пароль 2FA - это не ошибка, а нормальная часть процесса
        res.json({
          success: false,
          error: result.error,
          needsPassword: true
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to verify code:", error);
      res.status(500).json({ 
        success: false,
        error: "Ошибка проверки кода" 
      });
    }
  });

  // Verify 2FA password
  app.post("/api/telegram-auth/verify-password", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Пароль обязателен"
        });
      }

      const result = await telegramClientManager.verifyPassword('default', password);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Авторизация с 2FA успешна"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to verify password:", error);
      res.status(500).json({ 
        success: false,
        error: "Ошибка проверки пароля" 
      });
    }
  });

  // Save API credentials
  app.post("/api/telegram-auth/save-credentials", async (req, res) => {
    try {
      const { apiId, apiHash } = req.body;
      
      if (!apiId || !apiHash) {
        return res.status(400).json({
          success: false,
          error: "API ID и API Hash обязательны"
        });
      }

      const result = await telegramClientManager.setCredentials('default', apiId, apiHash);
      
      if (result.success) {
        res.json({
          success: true,
          message: "API credentials сохранены"
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Failed to save credentials:", error);
      res.status(500).json({ 
        success: false,
        error: "Ошибка сохранения credentials" 
      });
    }
  });

  // Get authentication status
  app.get("/api/telegram-auth/status", async (req, res) => {
    try {
      const status = await telegramClientManager.getAuthStatus('default');
      res.json(status);
    } catch (error: any) {
      console.error("Failed to get auth status:", error);
      res.status(500).json({ 
        isAuthenticated: false,
        error: "Ошибка получения статуса авторизации" 
      });
    }
  });

  // Client API роуты для управления участниками
  
  // Исключить участника через Client API
  app.post("/api/projects/:projectId/telegram-client/kick-member", async (req, res) => {
    try {
      const { groupId, userId } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Group ID и User ID обязательны" 
        });
      }

      const result = await telegramClientManager.kickMember('default', groupId, userId);
      
      res.json({
        success: true,
        message: "Участник успешно исключен через Client API"
      });
    } catch (error: any) {
      console.error("Failed to kick member via Client API:", error);
      res.status(500).json({ 
        success: false,
        message: "Ошибка при исключении участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Заблокировать участника через Client API
  app.post("/api/projects/:projectId/telegram-client/ban-member", async (req, res) => {
    try {
      const { groupId, userId, untilDate } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Group ID и User ID обязательны" 
        });
      }

      const result = await telegramClientManager.banMember('default', groupId, userId, untilDate);
      
      res.json({
        success: true,
        message: "Участник успешно заблокирован через Client API"
      });
    } catch (error: any) {
      console.error("Failed to ban member via Client API:", error);
      res.status(500).json({ 
        success: false,
        message: "Ошибка при блокировке участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Замутить участника через Client API
  app.post("/api/projects/:projectId/telegram-client/restrict-member", async (req, res) => {
    try {
      const { groupId, userId, untilDate } = req.body;
      
      if (!groupId || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Group ID и User ID обязательны" 
        });
      }

      const result = await telegramClientManager.restrictMember('default', groupId, userId, untilDate);
      
      res.json({
        success: true,
        message: "Участник успешно замучен через Client API"
      });
    } catch (error: any) {
      console.error("Failed to restrict member via Client API:", error);
      res.status(500).json({ 
        success: false,
        message: "Ошибка при заглушении участника",
        error: error.message || "Unknown error"
      });
    }
  });

  // Force update templates - Admin endpoint to refresh all system templates
  app.post("/api/templates/refresh", async (req, res) => {
    try {
      console.log("🔄 Принудительное обновление шаблонов...");
      await seedDefaultTemplates(true); // force = true
      console.log("✅ Шаблоны обновлены успешно");
      res.json({ 
        message: "Templates updated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ Ошибка обновления шаблонов:", error);
      res.status(500).json({ 
        message: "Failed to update templates",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

