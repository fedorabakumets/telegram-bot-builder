// External dependencies
import { z } from 'zod';
import { BotData, Node, BotGroup, buttonSchema } from '../../../shared/schema';

// Core modules - новая архитектура
import { GenerationContextBuilder } from './Core/GenerationContext';
import { CodeGenerator } from './Core/CodeGenerator';
import { ImportsGenerator } from './Generators/ImportsGenerator';
import { PythonCodeGenerator } from './Generators/PythonCodeGenerator';
import { HandlerGenerator } from './Generators/HandlerGenerator';
import { MainLoopGenerator } from './Generators/MainLoopGenerator';

// Legacy imports for fallback
import { generateBotFatherCommands } from './commands';
import { extractNodesAndConnections } from './format';
import { collectMediaVariables } from './variable';

export type Button = z.infer<typeof buttonSchema>;

// Global variable for logging state (can be overridden by parameter)
export let globalLoggingEnabled = false;

// Utility function to check if debug logging is enabled
export const isLoggingEnabled = (): boolean => {
  // First check if global logging was explicitly set (from enableLogging parameter)
  if (globalLoggingEnabled) return true;

  // Otherwise check localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

/**
 * Главная функция генерации Python кода для Telegram бота
 * Использует новую модульную архитектуру с fallback на legacy код
 */
export function generatePythonCode(
  botData: BotData,
  botName: string = "MyBot",
  groups: BotGroup[] = [],
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null,
  enableLogging: boolean = false
): string {
  // Set global logging flag for this generation run
  globalLoggingEnabled = enableLogging;

  if (enableLogging) {
    console.log('🔧 ГЕНЕРАТОР: Начинаем генерацию с параметрами:', {
      botName,
      userDatabaseEnabled,
      projectId,
      enableLogging,
      nodesCount: botData?.nodes?.length || 0
    });
  }

  try {
    // Создаем контекст генерации из данных бота
    const context = GenerationContextBuilder.createFromBotData(botData, {
      botName,
      groups,
      userDatabaseEnabled,
      projectId,
      enableLogging
    });

    if (enableLogging) {
      console.log('🔧 ГЕНЕРАТОР: Контекст создан:', {
        nodesCount: context.nodes?.length || 0,
        connectionsCount: context.connections?.length || 0,
        userDatabaseEnabled: context.userDatabaseEnabled
      });
    }

    // Логирование для отладки (если включено)
    if (enableLogging) {
      console.log(`🔧 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${context.nodes?.length || 0}, связей - ${context.connections?.length || 0}`);

      if (context.nodes && context.nodes.length > 0) {
        console.log('🔧 ГЕНЕРАТОР: Анализируем все узлы:');
        context.nodes.forEach((node, index) => {
          console.log(`🔧 ГЕНЕРАТОР: Узел ${index + 1}: "${node.id}" (тип: ${node.type})`);
          console.log(`🔧 ГЕНЕРАТОР:   - кнопок: ${node.data.buttons?.length || 0}`);
          console.log(`🔧 ГЕНЕРАТОР:   - keyboardType: ${node.data.keyboardType || 'нет'}`);
        });
      }
    }

    // Создаем экземпляры генераторов
    const importsGenerator = new ImportsGenerator();
    const pythonCodeGenerator = new PythonCodeGenerator();
    const handlerGenerator = new HandlerGenerator();
    const mainLoopGenerator = new MainLoopGenerator();

    // Создаем основной генератор кода
    const codeGenerator = new CodeGenerator(
      importsGenerator,
      pythonCodeGenerator,
      handlerGenerator,
      mainLoopGenerator
    );

    if (enableLogging) {
      console.log('🔧 ГЕНЕРАТОР: Генераторы созданы, начинаем генерацию кода...');
    }

    // Генерируем код
    const result = codeGenerator.generate(context);

    if (enableLogging) {
      console.log('🔧 ГЕНЕРАТОР: Результат генерации:', {
        success: result.success,
        errorsCount: result.errors?.length || 0,
        warningsCount: result.warnings?.length || 0,
        codeLength: result.code?.length || 0
      });
    }

    if (!result.success) {
      console.error('Ошибки при генерации кода:', result.errors);
      throw new Error(`Генерация кода завершилась с ошибками: ${result.errors?.join(', ')}`);
    }

    if (result.warnings && result.warnings.length > 0) {
      console.warn('Предупреждения при генерации:', result.warnings);
    }

    // Добавляем заголовок с информацией о боте
    let finalCode = '"""\n';
    finalCode += `${botName} - Telegram Bot\n`;
    finalCode += 'Сгенерировано с помощью TelegramBot Builder\n';

    const botFatherCommands = importsGenerator.generateBotFatherCommands(context.nodes);
    if (botFatherCommands) {
      finalCode += '\nКоманды для @BotFather:\n';
      finalCode += botFatherCommands;
    }

    finalCode += '"""\n\n';
    finalCode += result.code || '';

    // Добавляем точку входа в программу
    finalCode += mainLoopGenerator.generateEntryPoint();

    if (enableLogging && result.metadata) {
      console.log(`✓ Генерация завершена успешно:`);
      console.log(`  Строк кода: ${result.metadata.linesGenerated}`);
      console.log(`  Обработчиков: ${result.metadata.handlersCount}`);
      console.log(`  Узлов обработано: ${result.metadata.nodesProcessed}`);
    }

    return finalCode;

  } catch (error) {
    console.error('Критическая ошибка при генерации кода:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');

    // For debugging, let's see what the actual error is
    throw error; // Temporarily disable fallback to see the actual error

    // Fallback: если новая система не работает, используем старую логику
    console.warn('Переключаемся на резервную систему генерации...');
    return generatePythonCodeLegacy(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
  }
}

/**
 * Резервная функция генерации (старая логика) на случай проблем с новой системой
 * Импортируется из legacy файла для обеспечения совместимости
 */
function generatePythonCodeLegacy(
  botData: BotData,
  botName: string = "MyBot",
  groups: BotGroup[] = [],
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null,
  enableLogging: boolean = false
): string {
  // Set global logging flag for this generation run
  globalLoggingEnabled = enableLogging;

  const { nodes, connections } = extractNodesAndConnections(botData);

  // Собираем все медиапеременные из узлов для поддержки attachedMedia
  const mediaVariablesMap = collectMediaVariables(nodes || []);
  if (isLoggingEnabled()) {
    console.log(`🔧 ГЕНЕРАТОР: Собрано медиапеременных: ${mediaVariablesMap.size}`);
    if (mediaVariablesMap.size > 0) {
      console.log('🔧 ГЕНЕРАТОР: Медиапеременные:', Array.from(mediaVariablesMap.entries()));
    }
  }

  // ЛОГИРОВАНИЕ ГЕНЕРАТОРА: Подробная информация о данных бота
  if (isLoggingEnabled()) {
    console.log(`🔧 ГЕНЕРАТОР НАЧАЛ РАБОТУ: узлов - ${nodes?.length || 0}, связей - ${connections?.length || 0}`);
  }

  // Базовая структура кода
  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';

  const botFatherCommands = generateBotFatherCommands(nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }

  code += '"""\n\n';

  // Минимальная реализация для fallback
  code += '# -*- coding: utf-8 -*-\n';
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'from aiogram import Bot, Dispatcher\n';
  code += 'from aiogram.filters import CommandStart\n\n';

  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';

  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';

  code += '# Базовый обработчик команды /start\n';
  code += '@dp.message(CommandStart())\n';
  code += 'async def start_handler(message):\n';
  code += '    await message.answer("Привет! Это базовая версия бота.")\n\n';

  code += '# Основная функция\n';
  code += 'async def main():\n';
  code += '    logging.basicConfig(level=logging.INFO)\n';
  code += '    await dp.start_polling(bot)\n\n';

  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}

// Re-export legacy functions for backward compatibility
export { generateBotFatherCommands } from './commands';
export { extractNodesAndConnections } from './format';
export { collectMediaVariables } from './variable';