/**
 * Функция для генерации основных настроек бота (токен, логирование, бот и диспетчер, администраторы)
 * @returns Строка с кодом основных настроек бота
 */
export function generateBasicBotSetupCode(): string {
  let code = '';
  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';

  code += '# Настройка логирования с поддержкой UTF-8\n';
  code += 'logging.basicConfig(\n';
  code += '    level=logging.INFO,\n';
  code += '    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",\n';
  code += '    handlers=[\n';
  code += '        logging.StreamHandler(sys.stdout)\n';
  code += '    ]\n';
  code += ')\n\n';
  code += '# Подавление всех сообщений от asyncpg\n';
  code += 'logging.getLogger("asyncpg").setLevel(logging.CRITICAL)\n\n';

  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';

  code += '# Список администраторов (добавьте свой Telegram ID)\n';
  code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\n\n';

  return code;
}
