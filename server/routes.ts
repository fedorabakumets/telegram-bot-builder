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
    // Останавливаем существующий процесс, если есть
    if (botProcesses.has(projectId)) {
      await stopBot(projectId);
    }

    // Получаем данные проекта
    const project = await storage.getBotProject(projectId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Генерируем код бота
    const botCode = generatePythonCode(project.botData);
    
    // Заменяем токен в коде
    const finalCode = botCode.replace("YOUR_BOT_TOKEN_HERE", token);
    
    // Создаем файл с кодом бота
    const filePath = createBotFile(finalCode, projectId);
    
    // Запускаем процесс
    const process = spawn('python', [filePath], {
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    // Сохраняем процесс в памяти
    botProcesses.set(projectId, process);

    // Создаем или обновляем запись в базе данных
    const existingInstance = await storage.getBotInstance(projectId);
    if (existingInstance) {
      await storage.updateBotInstance(projectId, {
        status: 'running',
        startedAt: new Date(),
        processId: process.pid?.toString()
      });
    } else {
      await storage.createBotInstance({
        projectId,
        status: 'running',
        startedAt: new Date(),
        processId: process.pid?.toString()
      });
    }

    // Обработка завершения процесса
    process.on('close', async (code) => {
      botProcesses.delete(projectId);
      try {
        await storage.updateBotInstance(projectId, {
          status: 'stopped',
          stoppedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating bot instance status:', error);
      }
    });

    return { success: true, processId: process.pid?.toString() };
  } catch (error) {
    console.error('Error starting bot:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Функция для остановки бота
async function stopBot(projectId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Останавливаем процесс из памяти
    const process = botProcesses.get(projectId);
    if (process && !process.killed) {
      process.kill('SIGTERM');
      
      // Ждем завершения процесса
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL'); // Принудительно убиваем если не завершился
          }
          resolve();
        }, 5000);
        
        process.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
    
    // Удаляем из памяти
    botProcesses.delete(projectId);
    
    // Обновляем статус в базе данных
    try {
      await storage.updateBotInstance(projectId, {
        status: 'stopped',
        stoppedAt: new Date()
      });
    } catch (dbError) {
      console.error('Error updating bot instance status:', dbError);
      // Не возвращаем ошибку, так как основная задача (остановка процесса) выполнена
    }

    return { success: true };
  } catch (error) {
    console.error('Error stopping bot:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Функция для очистки состояний ботов при запуске сервера
async function cleanupBotStates(): Promise<void> {
  try {
    // Получаем все запущенные экземпляры из базы данных
    const runningInstances = await storage.getAllBotInstances();
    
    for (const instance of runningInstances) {
      if (instance.status === 'running') {
        // Проверяем, действительно ли процесс запущен
        const process = botProcesses.get(instance.projectId);
        if (!process || process.killed) {
          // Процесс не найден или убит, обновляем статус
          await storage.updateBotInstance(instance.projectId, {
            status: 'stopped',
            stoppedAt: new Date()
          });
          console.log(`Cleaned up stale bot instance for project ${instance.projectId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up bot states:', error);
  }
}

// Функция для перезапуска бота
async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Проверяем, запущен ли бот
    const instance = await storage.getBotInstance(projectId);
    if (!instance || instance.status !== 'running') {
      return { success: true }; // Бот не запущен, перезапуск не требуется
    }

    // Получаем сохраненный токен
    const tokens = await storage.getBotTokens(projectId);
    const defaultToken = tokens.find(t => t.isDefault);
    
    if (!defaultToken) {
      return { success: false, error: "No default token found for restart" };
    }

    // Останавливаем текущий экземпляр
    await stopBot(projectId);
    
    // Ждем 7 секунд для избежания конфликтов Telegram
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    // Запускаем заново
    const result = await startBot(projectId, defaultToken.token);
    return result;
  } catch (error) {
    console.error('Error restarting bot:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Исправленный генератор Python кода с унифицированными клавиатурами
function generatePythonCode(botData: any): string {
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
      code += `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    text = "${node.data.messageText || "Привет! Добро пожаловать!"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
      
    } else if (node.type === "command") {
      const command = node.data.command || "/help";
      const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
      
      code += `
@dp.message(Command("${command.replace('/', '')}"))
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Команда выполнена"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
      
    } else if (node.type === "message") {
      const functionName = `message_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      
      code += `
@dp.message()
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Сообщение получено"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
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

  // Generate callback handlers for inline buttons
  const inlineNodes = nodes.filter((node: any) => 
    (node.data.keyboardType === 'inline' || node.data.keyboardType === 'combined') && 
    node.data.inlineButtons && node.data.inlineButtons.length > 0
  );

  if (inlineNodes.length > 0) {
    code += `

# Обработчики inline кнопок`;
    inlineNodes.forEach((node: any) => {
      node.data.inlineButtons.forEach((button: any) => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.text;
          const handlerId = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
          
          // Find target node
          const targetNode = nodes.find((n: any) => n.id === button.target);
          
          code += `
@dp.callback_query(lambda c: c.data == "${callbackData}")
async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):
    await callback_query.answer()
`;
          
          if (targetNode) {
            // Navigate to target node
            if (targetNode.type === 'message') {
              code += `    text = "${targetNode.data.messageText || 'Сообщение'}"
    await callback_query.message.answer(text)`;
            } else if (targetNode.type === 'start') {
              code += `    await start_handler(callback_query.message)`;
            } else {
              code += `    await callback_query.message.answer("Переход к: ${button.text}")`;
            }
          } else {
            code += `    await callback_query.message.answer("Переход к: ${button.text}")`;
          }
        } else if (button.action === 'command') {
          const callbackData = button.target || button.text;
          const handlerId = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
          
          code += `
@dp.callback_query(lambda c: c.data == "${callbackData}")
async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Выполняем команду: ${button.target}
`;
          
          // Find command handler
          const commandNode = nodes.find((n: any) => n.data.command === button.target);
          if (commandNode && commandNode.type === 'start') {
            code += '    await start_handler(callback_query.message)';
          } else if (commandNode) {
            const funcName = (button.target || '').replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
            code += `    await ${funcName}_handler(callback_query.message)`;
          } else {
            code += `    await callback_query.message.answer("Команда: ${button.target}")`;
          }
        }
        // URL buttons don't need callback handlers as they open directly
      });
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

// Функция для обеспечения наличия проекта по умолчанию
async function ensureDefaultProject() {
  try {
    const projects = await storage.getAllBotProjects();
    if (projects.length === 0) {
      await storage.createBotProject({
        name: "Мой первый бот",
        description: "Описание моего первого бота",
        botData: {
          nodes: [
            {
              id: "start-node",
              type: "start",
              position: { x: 100, y: 100 },
              data: {
                messageText: "Привет! Добро пожаловать в мой бот!",
                keyboardType: "none",
                buttons: [],
                inlineButtons: []
              }
            }
          ],
          edges: []
        }
      });
      console.log("Created default project");
    }
  } catch (error) {
    console.error("Error ensuring default project:", error);
  }
}

// Основная функция для регистрации маршрутов
export async function registerRoutes(app: Express): Promise<Server> {
  // Очищаем состояния ботов при запуске сервера
  await cleanupBotStates();

  // Заполняем базу данных шаблонами по умолчанию
  await seedDefaultTemplates();

  // Убеждаемся, что есть проект по умолчанию
  await ensureDefaultProject();

  // Получить все проекты
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllBotProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch projects"));
    }
  });

  // Получить проект по ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch project"));
    }
  });

  // Создать новый проект
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertBotProjectSchema.parse(req.body);
      const project = await storage.createBotProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json(createSafeErrorResponse(error, "Failed to create project"));
    }
  });

  // Обновить проект
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const validatedData = insertBotProjectSchema.parse(req.body);
      const project = await storage.updateBotProject(id, validatedData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Автоматически перезапускаем бот если он запущен
      try {
        await restartBotIfRunning(id);
      } catch (restartError) {
        console.error("Error restarting bot after update:", restartError);
        // Не блокируем сохранение из-за ошибки перезапуска
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json(createSafeErrorResponse(error, "Failed to update project"));
    }
  });

  // Удалить проект
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Останавливаем бота если он запущен
      await stopBot(id);

      const success = await storage.deleteBotProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to delete project"));
    }
  });

  // Экспорт кода проекта
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const code = generatePythonCode(project.botData);
      res.json({ code });
    } catch (error) {
      console.error("Error exporting project:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to export project"));
    }
  });

  // Запустить бота
  app.post("/api/projects/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Bot token is required" });
      }

      const result = await startBot(id, token);
      
      if (result.success) {
        // Сохраняем токен как токен по умолчанию если это первый токен
        const existingTokens = await storage.getBotTokens(id);
        const isFirstToken = existingTokens.length === 0;
        
        try {
          await storage.saveBotToken({
            projectId: id,
            token,
            isDefault: isFirstToken
          });
        } catch (tokenError) {
          console.error("Error saving token:", tokenError);
          // Не блокируем запуск бота из-за ошибки сохранения токена
        }
        
        res.json({ message: "Bot started successfully", processId: result.processId });
      } else {
        res.status(500).json({ message: result.error || "Failed to start bot" });
      }
    } catch (error) {
      console.error("Error starting bot:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to start bot"));
    }
  });

  // Остановить бота
  app.post("/api/projects/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const result = await stopBot(id);
      
      if (result.success) {
        res.json({ message: "Bot stopped successfully" });
      } else {
        res.status(500).json({ message: result.error || "Failed to stop bot" });
      }
    } catch (error) {
      console.error("Error stopping bot:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to stop bot"));
    }
  });

  // Получить статус бота
  app.get("/api/projects/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const instance = await storage.getBotInstance(id);
      if (!instance) {
        return res.json({ status: "stopped", startedAt: null });
      }

      // Проверяем, действительно ли процесс запущен
      const process = botProcesses.get(id);
      const isActuallyRunning = process && !process.killed;
      
      if (instance.status === 'running' && !isActuallyRunning) {
        // Обновляем статус если процесс больше не запущен
        await storage.updateBotInstance(id, {
          status: 'stopped',
          stoppedAt: new Date()
        });
        return res.json({ status: "stopped", startedAt: instance.startedAt });
      }

      res.json({
        status: instance.status,
        startedAt: instance.startedAt,
        stoppedAt: instance.stoppedAt,
        processId: instance.processId
      });
    } catch (error) {
      console.error("Error getting bot status:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to get bot status"));
    }
  });

  // Получить сохраненные токены
  app.get("/api/projects/:id/tokens", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const tokens = await storage.getBotTokens(id);
      // Маскируем токены для безопасности
      const maskedTokens = tokens.map(token => ({
        ...token,
        token: `${token.token.substring(0, 10)}...${token.token.substring(token.token.length - 10)}`
      }));
      res.json(maskedTokens);
    } catch (error) {
      console.error("Error getting bot tokens:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to get bot tokens"));
    }
  });

  // Удалить токен
  app.delete("/api/projects/:id/tokens/:tokenId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tokenId = parseInt(req.params.tokenId);
      if (isNaN(id) || isNaN(tokenId)) {
        return res.status(400).json({ message: "Invalid project or token ID" });
      }

      const success = await storage.deleteBotToken(tokenId);
      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }
      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      console.error("Error deleting token:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to delete token"));
    }
  });

  // Установить токен по умолчанию
  app.post("/api/projects/:id/tokens/:tokenId/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tokenId = parseInt(req.params.tokenId);
      if (isNaN(id) || isNaN(tokenId)) {
        return res.status(400).json({ message: "Invalid project or token ID" });
      }

      const success = await storage.setDefaultBotToken(id, tokenId);
      if (!success) {
        return res.status(404).json({ message: "Token not found" });
      }
      res.json({ message: "Default token set successfully" });
    } catch (error) {
      console.error("Error setting default token:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to set default token"));
    }
  });

  // Получить все шаблоны
  app.get("/api/templates", async (req, res) => {
    try {
      const { category, search, sort } = req.query;
      
      let templates = await storage.getAllBotTemplates();
      
      // Фильтрация по категории
      if (category && category !== 'all') {
        templates = templates.filter(template => 
          template.category === category || 
          (category === 'custom' && template.category === 'user')
        );
      }
      
      // Поиск
      if (search) {
        const searchLower = (search as string).toLowerCase();
        templates = templates.filter(template => 
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      // Сортировка
      if (sort === 'popular') {
        templates.sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
      } else if (sort === 'rating') {
        templates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === 'recent') {
        templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'alphabetical') {
        templates.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch templates"));
    }
  });

  // Получить рекомендуемые шаблоны
  app.get("/api/templates/featured", async (req, res) => {
    try {
      const templates = await storage.getAllBotTemplates();
      const featured = templates.filter(template => template.featured);
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured templates:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch featured templates"));
    }
  });

  // Получить шаблоны по категории
  app.get("/api/templates/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const templates = await storage.getAllBotTemplates();
      const filtered = templates.filter(template => template.category === category);
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching templates by category:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch templates by category"));
    }
  });

  // Поиск шаблонов
  app.get("/api/templates/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const templates = await storage.getAllBotTemplates();
      const searchLower = (q as string).toLowerCase();
      const filtered = templates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
      res.json(filtered);
    } catch (error) {
      console.error("Error searching templates:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to search templates"));
    }
  });

  // Получить шаблон по ID
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to fetch template"));
    }
  });

  // Создать новый шаблон
  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertBotTemplateSchema.parse(req.body);
      const template = await storage.createBotTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json(createSafeErrorResponse(error, "Failed to create template"));
    }
  });

  // Обновить шаблон
  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const validatedData = insertBotTemplateSchema.parse(req.body);
      const template = await storage.updateBotTemplate(id, validatedData);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json(createSafeErrorResponse(error, "Failed to update template"));
    }
  });

  // Удалить шаблон
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const success = await storage.deleteBotTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to delete template"));
    }
  });

  // Оценить шаблон
  app.post("/api/templates/:id/rate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rating } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Простое обновление рейтинга (в реальном приложении здесь была бы более сложная логика)
      const newRatingCount = (template.ratingCount || 0) + 1;
      const newRating = ((template.rating || 0) * (template.ratingCount || 0) + rating) / newRatingCount;

      await storage.updateBotTemplate(id, {
        ...template,
        rating: newRating,
        ratingCount: newRatingCount
      });

      res.json({ message: "Rating updated successfully" });
    } catch (error) {
      console.error("Error rating template:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to rate template"));
    }
  });

  // Увеличить счетчик использования шаблона
  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      await storage.updateBotTemplate(id, {
        ...template,
        useCount: (template.useCount || 0) + 1
      });

      res.json({ message: "Use count updated successfully" });
    } catch (error) {
      console.error("Error updating use count:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to update use count"));
    }
  });

  // Экспорт шаблонов
  app.post("/api/templates/export", async (req, res) => {
    try {
      const { templateIds, options } = req.body;
      
      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        return res.status(400).json({ message: "Template IDs are required" });
      }

      const templates = [];
      for (const id of templateIds) {
        const template = await storage.getBotTemplate(id);
        if (template) {
          templates.push(template);
        }
      }

      if (templates.length === 0) {
        return res.status(404).json({ message: "No templates found" });
      }

      const exportData = templates.map(template => createTemplateExport(template, options));
      
      // Если экспортируем один шаблон, возвращаем его напрямую
      if (exportData.length === 1) {
        const template = exportData[0];
        const filename = createTemplateFileName(template.name);
        const dataToEncode = JSON.stringify(template, null, 2);
        
        // Используем Buffer для правильного кодирования Unicode
        const base64Data = Buffer.from(dataToEncode, 'utf8').toString('base64');
        
        res.json({
          filename: filename,
          data: base64Data,
          mimeType: 'application/json'
        });
      } else {
        // Для множественного экспорта создаем пакет
        const batchExport = {
          version: "1.1",
          type: "batch",
          exportedAt: new Date().toISOString(),
          templates: exportData,
          count: exportData.length
        };
        
        const filename = `templates_batch_${new Date().toISOString().split('T')[0]}.tbb.json`;
        const dataToEncode = JSON.stringify(batchExport, null, 2);
        
        // Используем Buffer для правильного кодирования Unicode
        const base64Data = Buffer.from(dataToEncode, 'utf8').toString('base64');
        
        res.json({
          filename: filename,
          data: base64Data,
          mimeType: 'application/json'
        });
      }
    } catch (error) {
      console.error("Error exporting templates:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to export templates"));
    }
  });

  // Валидация шаблона
  app.post("/api/templates/validate", async (req, res) => {
    try {
      const { templateData } = req.body;
      
      if (!templateData) {
        return res.status(400).json({ message: "Template data is required" });
      }

      const validation = validateTemplateImport(templateData);
      res.json(validation);
    } catch (error) {
      console.error("Error validating template:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to validate template"));
    }
  });

  // Импорт шаблонов
  app.post("/api/templates/import", async (req, res) => {
    try {
      const { templateData, options } = req.body;
      
      if (!templateData) {
        return res.status(400).json({ message: "Template data is required" });
      }

      // Проверяем, является ли это экспортированным файлом с оберткой
      let dataToImport = templateData;
      
      // Если это экспортированный файл с оберткой {filename, data}
      if (templateData.filename && templateData.data) {
        try {
          const decodedData = Buffer.from(templateData.data, 'base64').toString('utf8');
          dataToImport = JSON.parse(decodedData);
        } catch (decodeError) {
          return res.status(400).json({ message: "Invalid export file format" });
        }
      }

      // Валидируем данные
      const validation = validateTemplateImport(dataToImport);
      
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Invalid template data", 
          errors: validation.errors,
          warnings: validation.warnings
        });
      }

      const results = [];
      
      // Обрабатываем пакетный импорт
      if (dataToImport.type === 'batch' && Array.isArray(dataToImport.templates)) {
        for (const template of dataToImport.templates) {
          try {
            const created = await storage.createBotTemplate({
              name: template.name + (options?.addSuffix ? ' (импорт)' : ''),
              description: template.description,
              category: 'user',
              tags: template.tags || [],
              difficulty: template.difficulty || 'easy',
              featured: false,
              botData: template.botData,
              useCount: 0,
              rating: 0,
              ratingCount: 0
            });
            results.push({ success: true, template: created });
          } catch (error) {
            results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
      } else {
        // Обрабатываем одиночный импорт
        try {
          const created = await storage.createBotTemplate({
            name: dataToImport.name + (options?.addSuffix ? ' (импорт)' : ''),
            description: dataToImport.description,
            category: 'user',
            tags: dataToImport.tags || [],
            difficulty: dataToImport.difficulty || 'easy',
            featured: false,
            botData: dataToImport.botData,
            useCount: 0,
            rating: 0,
            ratingCount: 0
          });
          results.push({ success: true, template: created });
        } catch (error) {
          results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      res.json({
        message: `Import completed: ${successful.length} successful, ${failed.length} failed`,
        successful: successful.length,
        failed: failed.length,
        results: results
      });
    } catch (error) {
      console.error("Error importing templates:", error);
      res.status(500).json(createSafeErrorResponse(error, "Failed to import templates"));
    }
  });

  return createServer(app);
}