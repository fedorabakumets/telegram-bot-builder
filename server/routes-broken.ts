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
      } else if (node.data.keyboardType === "combined") {
        // Combined type: both reply and inline buttons
        const hasReplyButtons = node.data.buttons && node.data.buttons.length > 0;
        const hasInlineButtons = node.data.inlineButtons && node.data.inlineButtons.length > 0;
        
        if (hasReplyButtons && hasInlineButtons) {
          code += `    
    # Создаем комбинированную клавиатуру (Reply + Inline)
    
    # Сначала создаем reply клавиатуру
    reply_builder = ReplyKeyboardBuilder()
`;
          node.data.buttons.forEach((button: any) => {
            code += `    reply_builder.add(KeyboardButton(text="${button.text}"))
`;
          });
          
          code += `    reply_keyboard = reply_builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    # Отправляем основное сообщение с reply клавиатурой
    sent_message = await message.answer(text, reply_markup=reply_keyboard)
    
    # Затем создаем inline клавиатуру
    inline_builder = InlineKeyboardBuilder()
`;
          node.data.inlineButtons.forEach((button: any) => {
            if (button.action === "url") {
              code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
            } else {
              code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
            }
          });
          
          code += `    inline_keyboard = inline_builder.as_markup()
    # Прикрепляем inline кнопки к тому же сообщению
    await message.answer(text, reply_markup=inline_keyboard)
    # Устанавливаем reply клавиатуру отдельным минимальным сообщением
    await message.answer("⚡", reply_markup=reply_keyboard)
`;
        } else if (hasReplyButtons) {
          // Only reply buttons
          code += `    
    reply_builder = ReplyKeyboardBuilder()
`;
          node.data.buttons.forEach((button: any) => {
            code += `    reply_builder.add(KeyboardButton(text="${button.text}"))
`;
          });
          
          code += `    keyboard = reply_builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
        } else if (hasInlineButtons) {
          // Only inline buttons
          code += `    
    inline_builder = InlineKeyboardBuilder()
`;
          node.data.inlineButtons.forEach((button: any) => {
            if (button.action === "url") {
              code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
            } else {
              code += `    inline_builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
            }
          });
          
          code += `    keyboard = inline_builder.as_markup()
    await message.answer(text, reply_markup=keyboard)
`;
        } else {
          // No buttons at all
          code += `    await message.answer(text)
`;
        }
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
      console.log(`Project created successfully: ${project.id}`);
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: error.errors.map(e => e.message).join(', ')
        });
      }
      
      const errorResponse = createSafeErrorResponse(error, 'Failed to create project');
      res.status(500).json(errorResponse);
    }
  });

  // Update bot project
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const validatedData = insertBotProjectSchema.partial().parse(req.body);
      const project = await storage.updateBotProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Если обновляется data (структура бота), перезапускаем бота если он запущен
      if (validatedData.data) {
        console.log(`Project ${id} updated, checking if bot restart is needed...`);
        const restartResult = await restartBotIfRunning(id);
        if (!restartResult.success) {
          console.error(`Bot restart error for project ${id}:`, restartResult.error);
        }
      }
      
      console.log(`Project ${id} updated successfully`);
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid project data", 
          errors: error.errors.map(e => e.message).join(', ')
        });
      }
      
      const errorResponse = createSafeErrorResponse(error, 'Failed to update project');
      res.status(500).json(errorResponse);
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
      const hasActiveProcess = botProcesses.has(projectId);
      const actualStatus = hasActiveProcess ? 'running' : 'stopped';
      
      // Если статус в базе не соответствует реальному состоянию - исправляем
      if (instance.status !== actualStatus) {
        console.log(`Обнаружено несоответствие состояния для бота ${projectId}. База: ${instance.status}, Реальность: ${actualStatus}. Исправляем.`);
        await storage.updateBotInstance(instance.id, { 
          status: actualStatus,
          errorMessage: null
        });
        return res.json({ status: actualStatus, instance: { ...instance, status: actualStatus } });
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
      
      if (isNaN(projectId) || projectId <= 0) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const result = await stopBot(projectId);
      if (result.success) {
        res.json({ message: "Bot stopped successfully" });
      } else {
        res.status(500).json({ message: result.error || "Failed to stop bot" });
      }
    } catch (error) {
      console.error('Error in stop bot endpoint:', error);
      const errorResponse = createSafeErrorResponse(error, 'Failed to stop bot');
      res.status(500).json(errorResponse);
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
      console.log('Получены данные для создания шаблона:', JSON.stringify(req.body, null, 2));
      const validatedData = insertBotTemplateSchema.parse(req.body);
      console.log('Данные прошли валидацию:', JSON.stringify(validatedData, null, 2));
      const template = await storage.createBotTemplate(validatedData);
      console.log('Шаблон создан:', template);
      res.status(201).json(template);
    } catch (error) {
      console.error('Ошибка создания шаблона:', error);
      if (error instanceof z.ZodError) {
        console.error('Ошибки валидации:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template", error: error instanceof Error ? error.message : 'Unknown error' });
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
      
      // Проверяем существование проекта
      const project = await storage.getBotProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
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
      
      console.log(`Token created successfully for project ${projectId}`);
      res.status(201).json(safeToken);
    } catch (error) {
      console.error('Error creating token:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid token data", 
          errors: error.errors.map(e => e.message).join(', ')
        });
      }
      
      const errorResponse = createSafeErrorResponse(error, 'Failed to create token');
      res.status(500).json(errorResponse);
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
      
      // Проверяем валидность ID
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid token ID" });
      }
      
      // Проверяем существование токена перед удалением
      const existingToken = await storage.getBotToken(id);
      if (!existingToken) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      const success = await storage.deleteBotToken(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete token from storage" });
      }
      
      console.log(`Token ${id} deleted successfully`);
      res.json({ message: "Token deleted successfully" });
    } catch (error) {
      console.error('Error deleting token:', error);
      const errorResponse = createSafeErrorResponse(error, 'Failed to delete token');
      res.status(500).json(errorResponse);
    }
  });

  // Set default token
  app.post("/api/projects/:projectId/tokens/:tokenId/set-default", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tokenId = parseInt(req.params.tokenId);
      
      if (isNaN(projectId) || projectId <= 0) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      if (isNaN(tokenId) || tokenId <= 0) {
        return res.status(400).json({ message: "Invalid token ID" });
      }
      
      // Проверяем существование токена
      const token = await storage.getBotToken(tokenId);
      if (!token) {
        return res.status(404).json({ message: "Token not found" });
      }
      
      // Проверяем, что токен принадлежит указанному проекту
      if (token.projectId !== projectId) {
        return res.status(400).json({ message: "Token does not belong to this project" });
      }
      
      const success = await storage.setDefaultBotToken(projectId, tokenId);
      if (!success) {
        return res.status(500).json({ message: "Failed to set default token" });
      }
      
      console.log(`Default token set successfully for project ${projectId}`);
      res.json({ message: "Default token set successfully" });
    } catch (error) {
      console.error('Error setting default token:', error);
      const errorResponse = createSafeErrorResponse(error, 'Failed to set default token');
      res.status(500).json(errorResponse);
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

  // Template Import/Export Endpoints
  
  // Export template as file
  app.get("/api/templates/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getBotTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Получаем параметры экспорта
      const includeDocumentation = req.query.includeDocumentation === 'true';
      const generateChecksum = req.query.generateChecksum === 'true';
      const includeScreenshots = req.query.includeScreenshots === 'true';

      // Create export data
      const exportData = createTemplateExport(
        template.name,
        template.description || "",
        template.data,
        {
          version: template.version || "1.0.0",
          author: template.authorName || "Unknown",
          category: template.category as any,
          difficulty: template.difficulty as any,
          language: template.language as any,
          tags: template.tags || [],
          complexity: template.complexity || 1,
          estimatedTime: template.estimatedTime || 5,
          requiresToken: Boolean(template.requiresToken),
          createdAt: template.createdAt?.toISOString(),
        },
        template.authorName || "Unknown",
        {
          includeDocumentation,
          generateChecksum,
          includeScreenshots,
        }
      );

      // Generate filename
      const fileName = createTemplateFileName(template.name);

      // Return export data with filename
      res.json({
        filename: fileName,
        data: exportData
      });
    } catch (error) {
      console.error('Template export error:', error);
      res.status(500).json({ message: "Failed to export template" });
    }
  });

  // Export project as template file
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getBotProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Получаем параметры экспорта
      const includeDocumentation = req.query.includeDocumentation === 'true';
      const generateChecksum = req.query.generateChecksum === 'true';
      const includeScreenshots = req.query.includeScreenshots === 'true';

      // Create export data from project
      const exportData = createTemplateExport(
        project.name,
        project.description || "",
        project.data,
        {
          category: "custom",
          difficulty: "easy",
          language: "ru",
          tags: ["custom", "export"],
          complexity: 1,
          estimatedTime: 5,
          requiresToken: true,
        },
        "User",
        {
          includeDocumentation,
          generateChecksum,
          includeScreenshots,
        }
      );

      // Generate filename
      const fileName = createTemplateFileName(project.name);

      // Return export data with filename
      res.json({
        filename: fileName,
        data: exportData
      });
    } catch (error) {
      console.error('Project export error:', error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // Import template from file
  app.post("/api/templates/import", async (req, res) => {
    try {
      let importData = req.body;
      
      // Handle exported file format that wraps template data in a "data" field
      if (importData.filename && importData.data) {
        importData = importData.data;
      }
      
      // Validate the imported data using new validation function
      const validationResult = validateTemplateImport(importData);
      
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: "Invalid template format", 
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          hint: "Please make sure the file is a valid Telegram Bot Builder template file (.tbb.json)"
        });
      }

      const templateData = validationResult.template!;

      // Create template in database
      const newTemplate = await storage.createBotTemplate({
        name: templateData.name,
        description: templateData.description || "",
        data: templateData.botData,
        category: templateData.metadata.category,
        tags: templateData.metadata.tags,
        isPublic: 0, // Imported templates are private by default
        difficulty: templateData.metadata.difficulty,
        authorId: null,
        authorName: templateData.metadata.author || "Imported",
        version: templateData.metadata.version,
        previewImage: templateData.metadata.previewImage || null,
        featured: 0,
        language: templateData.metadata.language,
        requiresToken: templateData.metadata.requiresToken ? 1 : 0,
        complexity: templateData.metadata.complexity,
        estimatedTime: templateData.metadata.estimatedTime,
      });

      res.status(201).json({
        message: "Template imported successfully",
        template: newTemplate,
        warnings: validationResult.warnings,
        importInfo: {
          originalAuthor: templateData.metadata.author,
          exportedAt: templateData.metadata.exportedAt,
          formatVersion: templateData.exportInfo.formatVersion,
          fileSize: templateData.exportInfo.fileSize,
          hasAdvancedFeatures: templateData.metadata.hasAdvancedFeatures,
          nodeCount: templateData.metadata.nodeCount,
          connectionCount: templateData.metadata.connectionCount,
        }
      });
    } catch (error) {
      console.error('Template import error:', error);
      res.status(500).json({ message: "Failed to import template" });
    }
  });

  // Validate template file before import
  app.post("/api/templates/validate", async (req, res) => {
    try {
      let validationData = req.body;
      
      // Handle exported file format that wraps template data in a "data" field
      if (validationData.filename && validationData.data) {
        validationData = validationData.data;
      }
      
      const validationResult = validateTemplateImport(validationData);
      res.json(validationResult);
    } catch (error) {
      console.error('Template validation error:', error);
      res.status(500).json({
        isValid: false,
        errors: ["Ошибка валидации на сервере"],
        warnings: []
      });
    }
  });

  // Import template as new project
  app.post("/api/projects/import", async (req, res) => {
    try {
      let importData = req.body;
      
      // Handle exported file format that wraps template data in a "data" field
      if (importData.filename && importData.data) {
        importData = importData.data;
      }
      
      // Validate the imported data using new validation function
      const validationResult = validateTemplateImport(importData);
      
      if (!validationResult.isValid) {
        return res.status(400).json({ 
          message: "Invalid template format", 
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          hint: "Please make sure the file is a valid Telegram Bot Builder template file (.tbb.json)"
        });
      }

      const templateData = validationResult.template!;

      // Create new project from template
      const newProject = await storage.createBotProject({
        name: `${templateData.name} (Imported)`,
        description: templateData.description || "",
        data: templateData.botData,
      });

      res.status(201).json({
        message: "Project imported successfully",
        project: newProject,
        warnings: validationResult.warnings,
        importInfo: {
          originalName: templateData.name,
          originalAuthor: templateData.metadata.author,
          exportedAt: templateData.metadata.exportedAt,
          nodeCount: templateData.metadata.nodeCount,
          connectionCount: templateData.metadata.connectionCount,
          hasAdvancedFeatures: templateData.metadata.hasAdvancedFeatures,
        }
      });
    } catch (error) {
      console.error('Project import error:', error);
      res.status(500).json({ message: "Failed to import project" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

