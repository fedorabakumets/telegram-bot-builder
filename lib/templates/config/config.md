# Шаблон: config.py.jinja2

## Описание

Генерирует Python конфигурацию для Telegram бота: токены, настройки логирования, администраторы, проект, база данных.

## Параметры

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `userDatabaseEnabled` | `boolean` | `false` | Включена ли база данных пользователей |
| `projectId` | `number \| null` | `null` | ID проекта для сохранения в БД |
| `webhookUrl` | `string \| null` | `null` | URL вебхука (включает webhook режим) |
| `webhookPort` | `number \| null` | `null` | Порт aiohttp сервера для webhook |

## Использование

### Базовое

```typescript
import { generateConfig } from './config.renderer';

const code = generateConfig({
  userDatabaseEnabled: true,
  projectId: 123,
});
```

### С валидацией

```typescript
import { generateConfig, configParamsSchema } from './config.renderer';

try {
  const validated = configParamsSchema.parse(params);
  const code = generateConfig(validated);
} catch (error) {
  console.error('Невалидные параметры:', error);
}
```

### С fixtures (тесты)

```typescript
import { generateConfig } from './config.renderer';
import { validParamsAllEnabled } from './config.fixture';

const code = generateConfig(validParamsAllEnabled);
```

## Примеры вывода

### Все включено

**Вход:**
```typescript
{
  userDatabaseEnabled: true,
  projectId: 123
}
```

**Выход:**
```python
# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")

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
```

### Всё выключено

**Вход:**
```typescript
{
  userDatabaseEnabled: false,
  projectId: null
}
```

**Выход:**
```python
# Загрузка переменных окружения из .env файла
load_dotenv()

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(...)

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
all_user_vars = {}
```

### Только база данных

**Вход:**
```typescript
{
  userDatabaseEnabled: true,
  projectId: null
}
```

**Выход:**
```python
# ... базовые настройки ...

# Хранилище пользователей (временное состояние)
user_data = {}
all_user_vars = {}

# ┌─────────────────────────────────────────┐
# │           Настройки базы данных         │
# └─────────────────────────────────────────┘
DATABASE_URL = os.getenv("DATABASE_URL")

# ┌─────────────────────────────────────────┐
# │      Пул соединений с базой данных    │
# └─────────────────────────────────────────┘
db_pool = None
```

## Логика условий

### PROJECT_ID
```typescript
if (projectId !== null) {
  // Добавить блок конфигурации проекта
}
```

### DATABASE_URL + db_pool
```typescript
if (userDatabaseEnabled === true) {
  // Добавить настройки базы данных
}
```

### WEBHOOK_URL + REDIS_URL валидация
При webhook режиме Redis обязателен для хранения FSM состояний:
```python
if WEBHOOK_URL and not REDIS_URL:
    raise RuntimeError("REDIS_URL обязателен при использовании webhook режима")
```

## Тесты

### Запуск тестов

```bash
npm test -- config.test.ts
```

### Покрытие тестов

- ✅ Валидные данные (все включено/выключено)
- ✅ Частичные конфигурации (только БД, только проект)
- ✅ Невалидные данные (неправильные типы)
- ✅ Значения по умолчанию
- ✅ Граничные случаи (null projectId)
- ✅ Производительность (< 10ms на генерацию)
- ✅ Структура Zod схемы
- ✅ Webhook режим (WEBHOOK_URL, WEBHOOK_PORT)
- ✅ Валидация Redis при webhook (RuntimeError)

### Пример теста

```typescript
import { generateConfig } from './config.renderer';
import { validParamsAllEnabled } from './config.fixture';

it('должен генерировать код со всеми настройками', () => {
  const result = generateConfig(validParamsAllEnabled);

  assert.ok(result.includes('PROJECT_ID = 123'));
  assert.ok(result.includes('DATABASE_URL'));
});
```

## Зависимости

### Внешние
- `zod` — валидация параметров
- `nunjucks` — рендеринг шаблона

### Внутренние
- `../template-renderer` — функция рендеринга
- `./config.params` — типы параметров
- `./config.schema` — Zod схема
- `./config.fixture` — тестовые данные

## Файлы

```
config/
├── config.py.jinja2          # Шаблон (60 строк)
├── config.params.ts          # Типы (15 строк)
├── config.schema.ts          # Zod схема (16 строк)
├── config.renderer.ts        # Функция рендеринга (28 строк)
├── config.fixture.ts         # Тестовые данные (140 строк)
├── config.test.ts            # Тесты (220 строк)
├── config.md                 # Документация (этот файл)
└── index.ts                  # Публичный экспорт
```

## См. также

- [`imports.py.jinja2`](../imports/imports.md) — шаблон импортов
- [`database.py.jinja2`](../database/database.md) — шаблон БД
- [`utils.py.jinja2`](../utils/utils.md) — шаблон утилит
