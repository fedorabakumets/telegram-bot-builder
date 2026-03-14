/**
 * @fileoverview Генерация конфигурации для браузера
 * 
 * Browser-совместимая версия без использования Node.js API
 * Использует конкатенацию строк вместо шаблонов
 * 
 * @module bot-generator/templates/generate-config-browser
 */

/**
 * Опции для генерации конфигурации
 */
export interface ConfigOptions {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** ID проекта */
  projectId?: number | null;
}

/**
 * Генерирует конфигурацию бота (browser версия)
 * 
 * @param options - Опции генерации
 * @returns Строка с конфигурацией
 */
export function generateConfigBrowser(options: ConfigOptions = {}): string {
  const {
    userDatabaseEnabled = false,
    projectId = null,
  } = options;

  let code = '';

  // Загрузка переменных окружения
  code += '# Загрузка переменных окружения из .env файла\n';
  code += 'from dotenv import load_dotenv\n';
  code += 'load_dotenv()\n';
  code += '\n';

  // Токен бота
  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = os.getenv("BOT_TOKEN")\n';
  code += '\n';

  // Настройка логирования
  code += '# Настройка логирования с поддержкой UTF-8\n';
  code += 'LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()\n';
  code += 'logging.basicConfig(\n';
  code += '    level=getattr(logging, LOG_LEVEL, logging.INFO),\n';
  code += '    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",\n';
  code += '    handlers=[\n';
  code += '        logging.StreamHandler(sys.stdout)\n';
  code += '    ]\n';
  code += ')\n';
  code += '\n';

  // Подавление логирования asyncpg
  code += '# Подавление всех сообщений от asyncpg (настраивается через .env)\n';
  code += 'if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":\n';
  code += '    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)\n';
  code += '\n';

  // Создание бота и диспетчера
  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n';
  code += '\n';

  // Список администраторов
  code += '# Список администраторов (загружается из .env)\n';
  code += 'ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]\n';
  code += '\n';

  // Конфигурация проекта
  if (projectId) {
    code += '# ┌─────────────────────────────────────────┐\n';
    code += '# │        Конфигурация проекта             │\n';
    code += '# └─────────────────────────────────────────┘\n';
    code += '# ID проекта для сохранения в базу данных\n';
    code += `PROJECT_ID = ${projectId}\n`;
    code += 'logging.info(f"📁 PROJECT_ID: {PROJECT_ID}")\n';
    code += '\n';
    code += '# Директория проекта\n';
    code += 'PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))\n';
    code += 'logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")\n';
    code += '\n';
  }

  // Хранилище состояний
  code += '# Хранилище пользователей (временное состояние)\n';
  code += 'user_data = {}\n';
  code += 'all_user_vars = {}  # Глобальные переменные пользователя\n';
  code += '\n';

  // База данных
  if (userDatabaseEnabled) {
    code += '# ┌─────────────────────────────────────────┐\n';
    code += '# │           Настройки базы данных         │\n';
    code += '# └─────────────────────────────────────────┘\n';
    code += 'DATABASE_URL = os.getenv("DATABASE_URL")\n';
    code += '\n';
    code += '# ┌─────────────────────────────────────────┐\n';
    code += '# │      Пул соединений с базой данных    │\n';
    code += '# └─────────────────────────────────────────┘\n';
    code += 'db_pool = None\n';
    code += '\n';
  }

  return code;
}
