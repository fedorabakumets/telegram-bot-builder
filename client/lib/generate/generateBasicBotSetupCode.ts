/**
 * @fileoverview Утилита для генерации основных настроек Telegram-бота
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего основные настройки Telegram-бота, включая токен,
 * настройки логирования, создание бота и диспетчера, а также
 * список администраторов.
 *
 * @module generateBasicBotSetupCode
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Функция для генерации основных настроек бота (токен, логирование, бот и диспетчер, администраторы)
 * @returns Строка с кодом основных настроек бота
 */
export function generateBasicBotSetupCode(): string {
  const codeLines: string[] = [];
  
  codeLines.push('# Токен вашего бота (получите у @BotFather)');
  codeLines.push('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"');
  codeLines.push('');
  codeLines.push('# Настройка логирования с поддержкой UTF-8');
  codeLines.push('logging.basicConfig(');
  codeLines.push('    level=logging.INFO,');
  codeLines.push('    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",');
  codeLines.push('    handlers=[');
  codeLines.push('        logging.StreamHandler(sys.stdout)');
  codeLines.push('    ]');
  codeLines.push(')');
  codeLines.push('');
  codeLines.push('# Подавление всех сообщений от asyncpg');
  codeLines.push('logging.getLogger("asyncpg").setLevel(logging.CRITICAL)');
  codeLines.push('');
  codeLines.push('# Создание бота и диспетчера');
  codeLines.push('bot = Bot(token=BOT_TOKEN)');
  codeLines.push('dp = Dispatcher()');
  codeLines.push('');
  codeLines.push('# Список администраторов (добавьте свой Telegram ID)');
  codeLines.push('ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateBasicBotSetupCode.ts');

  return commentedCodeLines.join('\n');
}
