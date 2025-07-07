import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn, ChildProcess } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { insertBotProjectSchema, insertBotInstanceSchema, insertBotTemplateSchema, insertBotTokenSchema } from "@shared/schema";
import { seedDefaultTemplates } from "./seed-templates";

// Глобальное хранилище активных процессов ботов
const botProcesses = new Map<number, ChildProcess>();

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

    // Генерируем код бота через клиентский генератор
    const { generatePythonCode } = await import("../client/src/lib/bot-generator.js");
    const botCode = generatePythonCode(project.data as any, project.name).replace('YOUR_BOT_TOKEN_HERE', token);
    
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
      return { success: false, error: "Бот не запущен" };
    }

    // Останавливаем процесс
    if (!process.killed) {
      process.kill('SIGTERM');
      
      // Ждем завершения процесса
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
          resolve();
        }, 5000);
        
        process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Удаляем из памяти
    botProcesses.delete(projectId);
    
    // Обновляем базу данных
    await storage.stopBotInstance(projectId);
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}

// Функция для проверки состояния бота
async function getBotStatus(projectId: number) {
  const instance = await storage.getBotInstance(projectId);
  const processExists = botProcesses.has(projectId);
  const process = botProcesses.get(projectId);
  
  return {
    instance,
    processExists,
    processId: process?.pid?.toString(),
    processKilled: process?.killed
  };
}

// Функция для очистки несоответствий состояний при запуске сервера
async function cleanupBotStates() {
  try {
    const instances = await storage.getAllBotInstances();
    for (const instance of instances) {
      if (instance.status === 'running' && !botProcesses.has(instance.projectId)) {
        console.log(`Очищаем несоответствие состояния для бота ${instance.projectId}`);
        await storage.updateBotInstance(instance.id, { 
          status: 'stopped',
          errorMessage: 'Сервер был перезапущен'
        });
      }
    }
  } catch (error) {
    console.error('Ошибка очистки состояний ботов:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Очищаем состояния ботов при запуске
  await cleanupBotStates();

  // Инициализируем шаблоны по умолчанию
  await seedDefaultTemplates();

  // Роуты для проектов
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getBotProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения проектов" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertBotProjectSchema.parse(req.body);
      const project = await storage.createBotProject(data);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Ошибка создания проекта" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ error: "Проект не найден" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения проекта" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertBotProjectSchema.partial().parse(req.body);
      const project = await storage.updateBotProject(id, data);
      if (!project) {
        return res.status(404).json({ error: "Проект не найден" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Ошибка обновления проекта" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Останавливаем бота если он запущен
      await stopBot(id);
      
      const success = await storage.deleteBotProject(id);
      if (!success) {
        return res.status(404).json({ error: "Проект не найден" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления проекта" });
    }
  });

  // Роуты для экспорта кода
  app.post("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ error: "Проект не найден" });
      }

      // Импортируем клиентский генератор
      const { generatePythonCode } = await import("../client/src/lib/bot-generator.js");
      const code = generatePythonCode(project.data as any, project.name);
      
      res.json({ code });
    } catch (error) {
      res.status(500).json({ error: "Ошибка экспорта кода" });
    }
  });

  // Роуты для управления ботами
  app.post("/api/bots/:id/start", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Токен бота обязателен" });
      }

      const result = await startBot(projectId, token);
      
      if (result.success) {
        res.json({ success: true, processId: result.processId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "Ошибка запуска бота" });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const result = await stopBot(projectId);
      
      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "Ошибка остановки бота" });
    }
  });

  app.get("/api/bots/:id/status", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const status = await getBotStatus(projectId);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения статуса бота" });
    }
  });

  // Роуты для шаблонов
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getBotTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения шаблонов" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertBotTemplateSchema.parse(req.body);
      const template = await storage.createBotTemplate(data);
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: "Ошибка создания шаблона" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Шаблон не найден" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения шаблона" });
    }
  });

  app.post("/api/templates/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Рейтинг должен быть от 1 до 5" });
      }

      const template = await storage.rateBotTemplate(id, rating);
      if (!template) {
        return res.status(404).json({ error: "Шаблон не найден" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Ошибка оценки шаблона" });
    }
  });

  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.incrementTemplateUsage(id);
      if (!template) {
        return res.status(404).json({ error: "Шаблон не найден" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Ошибка увеличения счетчика использования" });
    }
  });

  app.get("/api/templates/featured", async (req, res) => {
    try {
      const templates = await storage.getFeaturedBotTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения рекомендуемых шаблонов" });
    }
  });

  app.get("/api/templates/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const templates = await storage.getBotTemplatesByCategory(category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения шаблонов по категории" });
    }
  });

  app.get("/api/templates/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Поисковый запрос обязателен" });
      }
      const templates = await storage.searchBotTemplates(query);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Ошибка поиска шаблонов" });
    }
  });

  // Роуты для токенов
  app.get("/api/projects/:id/token", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const token = await storage.getBotToken(projectId);
      res.json({ token: token?.token || null });
    } catch (error) {
      res.status(500).json({ error: "Ошибка получения токена" });
    }
  });

  app.post("/api/projects/:id/token", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Токен обязателен" });
      }

      const savedToken = await storage.saveBotToken(projectId, token);
      res.json({ token: savedToken.token });
    } catch (error) {
      res.status(500).json({ error: "Ошибка сохранения токена" });
    }
  });

  app.delete("/api/projects/:id/token", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const success = await storage.deleteBotToken(projectId);
      if (!success) {
        return res.status(404).json({ error: "Токен не найден" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Ошибка удаления токена" });
    }
  });

  return server;
}