/**
 * @fileoverview Утилита для генерации основных настроек Telegram-бота
 *
 * Этот модуль предоставляет функцию для генерации Python-кода,
 * реализующего основные настройки Telegram-бота, включая загрузку
 * токена из .env, настройки логирования, создание бота и диспетчера,
 * а также список администраторов.
 *
 * @module generateBasicBotSetupCode
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Функция для генерации основных настроек бота (загрузка .env, логирование, бот и диспетчер, администраторы)
 * @returns Строка с кодом основных настроек бота
 */
export function generateBasicBotSetupCode(): string {
  const codeLines: string[] = [];

  codeLines.push('# Загрузка переменных окружения из .env файла');
  codeLines.push('from dotenv import load_dotenv');
  codeLines.push('load_dotenv()');
  codeLines.push('');
  codeLines.push('# Токен вашего бота (получите у @BotFather)');
  codeLines.push('BOT_TOKEN = os.getenv("BOT_TOKEN")');
  codeLines.push('');
  codeLines.push('# Настройка логирования с поддержкой UTF-8');
  codeLines.push('LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()');
  codeLines.push('logging.basicConfig(');
  codeLines.push('    level=getattr(logging, LOG_LEVEL, logging.INFO),');
  codeLines.push('    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",');
  codeLines.push('    handlers=[');
  codeLines.push('        logging.StreamHandler(sys.stdout)');
  codeLines.push('    ]');
  codeLines.push(')');
  codeLines.push('');
  codeLines.push('# Подавление всех сообщений от asyncpg (настраивается через .env)');
  codeLines.push('if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":');
  codeLines.push('    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)');
  codeLines.push('');
  codeLines.push('# Создание бота и диспетчера');
  codeLines.push('bot = Bot(token=BOT_TOKEN)');
  codeLines.push('dp = Dispatcher()');
  codeLines.push('');
  codeLines.push('# Список администраторов (загружается из .env)');
  codeLines.push('ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]');
  codeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(codeLines, 'generateBasicBotSetupCode.ts');

  return commentedCodeLines.join('\n');
}
