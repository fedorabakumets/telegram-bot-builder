import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn, ChildProcess } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { insertBotProjectSchema, botDataSchema, insertBotInstanceSchema, insertBotTemplateSchema } from "@shared/schema";
import { seedDefaultTemplates } from "./seed-templates";
import { z } from "zod";

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
    const existingInstance = await storage.getBotInstance(projectId);
    if (existingInstance && existingInstance.status === 'running') {
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
    
    // Создаем запись в базе данных
    await storage.createBotInstance({
      projectId,
      status: 'running',
      token,
      processId,
    });

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
      
      code += `
@dp.message(Command("${command.replace('/', '')}"))
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Команда выполнена"}"
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
      
      code += `
@dp.message()
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Сообщение получено"}"
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
  // Initialize default templates on startup
  await seedDefaultTemplates();
  
  // Ensure at least one default project exists
  await ensureDefaultProject();
  
  // Clean up inconsistent bot states
  await cleanupBotStates();
  
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
      const deleted = await storage.deleteBotProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
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

      const pythonCode = generatePythonCode(project.data);
      res.json({ code: pythonCode });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate code" });
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
      if (instance.status === 'running' && !botProcesses.has(projectId)) {
        // Если в базе бот помечен как запущенный, но процесса нет - исправляем
        console.log(`Обнаружено несоответствие состояния для бота ${projectId}. Исправляем.`);
        await storage.updateBotInstance(instance.id, { status: 'stopped' });
        return res.json({ status: 'stopped', instance: { ...instance, status: 'stopped' } });
      }
      
      res.json({ status: instance.status, instance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get bot status" });
    }
  });

  // Start bot
  app.post("/api/projects/:id/bot/start", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Bot token is required" });
      }

      // Проверяем, не запущен ли уже бот
      const existingInstance = await storage.getBotInstance(projectId);
      if (existingInstance && existingInstance.status === 'running') {
        return res.status(400).json({ message: "Bot is already running" });
      }

      const result = await startBot(projectId, token);
      if (result.success) {
        res.json({ message: "Bot started successfully", processId: result.processId });
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
  
  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllBotTemplates();
      res.json(templates);
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



  const httpServer = createServer(app);
  return httpServer;
}

