/**
 * @fileoverview Тестовые данные для шаблона конфигурации
 * @module templates/config/config.fixture
 */

import type { ConfigTemplateParams } from './config.params';

/** Валидные параметры: все включено */
export const validParamsAllEnabled: ConfigTemplateParams = {
  userDatabaseEnabled: true,
  projectId: 123,
};

/** Валидные параметры: всё выключено */
export const validParamsAllDisabled: ConfigTemplateParams = {
  userDatabaseEnabled: false,
  projectId: null,
};

/** Валидные параметры: только БД */
export const validParamsDatabaseOnly: ConfigTemplateParams = {
  userDatabaseEnabled: true,
  projectId: null,
};

/** Валидные параметры: только проект */
export const validParamsProjectOnly: ConfigTemplateParams = {
  userDatabaseEnabled: false,
  projectId: 456,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  userDatabaseEnabled: 'true', // должно быть boolean
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  projectId: 123,
  // отсутствует userDatabaseEnabled
};

/** Ожидаемый вывод: все включено */
export const expectedOutputAllEnabled = `
# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Идентификатор токена бота для сегментации данных в БД и Redis
TOKEN_ID = int(os.getenv("TOKEN_ID", "0"))

# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Подавление всех сообщений от asyncpg (настраивается через .env)
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]

# ┌─────────────────────────────────────────┐
# │        Конфигурация проекта             │
# └─────────────────────────────────────────┘
# ID проекта для сохранения в базу данных
PROJECT_ID = 123
logging.info(f"📁 PROJECT_ID: {PROJECT_ID}")

# Директория проекта
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")

# Хранилище пользователей (временное состояние)
user_data = {}
all_user_vars = {}  # Глобальные переменные пользователя

# ┌─────────────────────────────────────────┐
# │           Настройки базы данных         │
# └─────────────────────────────────────────┘
DATABASE_URL = os.getenv("DATABASE_URL")

# ┌─────────────────────────────────────────┐
# │      Пул соединений с базой данных    │
# └─────────────────────────────────────────┘
db_pool = None
`.trim();

/** Ожидаемый вывод: всё выключено */
export const expectedOutputAllDisabled = `
# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Идентификатор токена бота для сегментации данных в БД и Redis
TOKEN_ID = int(os.getenv("TOKEN_ID", "0"))

# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Подавление всех сообщений от asyncpg (настраивается через .env)
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]

# Директория проекта
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")

# Хранилище пользователей (временное состояние)
user_data = {}
all_user_vars = {}  # Глобальные переменные пользователя
`.trim();

/** Ожидаемый вывод: только БД */
export const expectedOutputDatabaseOnly = `
# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Идентификатор токена бота для сегментации данных в БД и Redis
TOKEN_ID = int(os.getenv("TOKEN_ID", "0"))

# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Подавление всех сообщений от asyncpg (настраивается через .env)
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]

# Директория проекта
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")

# Хранилище пользователей (временное состояние)
user_data = {}
all_user_vars = {}  # Глобальные переменные пользователя

# ┌─────────────────────────────────────────┐
# │           Настройки базы данных         │
# └─────────────────────────────────────────┘
DATABASE_URL = os.getenv("DATABASE_URL")

# ┌─────────────────────────────────────────┐
# │      Пул соединений с базой данных    │
# └─────────────────────────────────────────┘
db_pool = None
`.trim();

/** Валидные параметры: webhook режим с Redis */
export const validParamsWebhookMode: ConfigTemplateParams = {
  userDatabaseEnabled: false,
  projectId: 42,
  webhookUrl: 'https://example.com',
  webhookPort: 9042,
};

/**
 * Невалидные параметры: webhook без Redis
 * REDIS_URL не задан в env — должна быть RuntimeError при запуске Python
 */
export const invalidParamsWebhookWithoutRedis: ConfigTemplateParams = {
  userDatabaseEnabled: false,
  projectId: 42,
  webhookUrl: 'https://example.com',
  webhookPort: 9042,
};
