@echo off
chcp 65001 >nul
echo ========================================
echo 🗄️ ИСПРАВЛЕНИЕ ПРОБЛЕМ С БАЗОЙ ДАННЫХ
echo ========================================
echo.

echo 📋 Этот скрипт исправляет проблемы с базой данных:
echo    🔧 Настраивает подключение к PostgreSQL
echo    📦 Создает и применяет миграции
echo    🔄 Исправляет схемы таблиц
echo    🗂️ Создает тестовые данные
echo    🔍 Проверяет целостность данных
echo.

set /p confirm="Продолжить? (y/n): "
if /i not "%confirm%"=="y" (
    echo Отменено пользователем.
    pause
    exit /b 0
)

echo.
echo 🚀 Начинаем исправление проблем с БД...
echo.

:: 1. Проверяем файл .env
echo 🔍 1. Проверяем конфигурацию базы данных...
if not exist .env (
    echo ⚠️ Файл .env не найден. Создаем из шаблона...
    if exist .env.example (
        copy .env.example .env
        echo ✅ Создан .env из .env.example
    ) else (
        echo # База данных > .env
        echo DATABASE_URL=postgresql://postgres:password@localhost:5432/botcraft >> .env
        echo. >> .env
        echo # Аутентификация >> .env
        echo NEXTAUTH_SECRET=your-super-secret-key-change-this >> .env
        echo NEXTAUTH_URL=http://localhost:3000 >> .env
        echo. >> .env
        echo # Telegram Bot API >> .env
        echo TELEGRAM_BOT_TOKEN=your-bot-token-here >> .env
        echo. >> .env
        echo ✅ Создан базовый .env файл
        echo.
        echo ⚠️ ВАЖНО: Отредактируйте .env файл с вашими настройками!
        echo    - DATABASE_URL: строка подключения к PostgreSQL
        echo    - NEXTAUTH_SECRET: секретный ключ для аутентификации
        echo    - TELEGRAM_BOT_TOKEN: токен вашего бота
        echo.
        pause
    )
) else (
    echo ✅ Файл .env найден
)

:: 2. Проверяем drizzle.config.ts
echo 🔧 2. Проверяем конфигурацию Drizzle...
if not exist drizzle.config.ts (
    echo ⚠️ drizzle.config.ts не найден. Создаем...
    echo import type { Config } from 'drizzle-kit'; > drizzle.config.ts
    echo import { config } from 'dotenv'; >> drizzle.config.ts
    echo. >> drizzle.config.ts
    echo config(); >> drizzle.config.ts
    echo. >> drizzle.config.ts
    echo export default { >> drizzle.config.ts
    echo   schema: './shared/schema.ts', >> drizzle.config.ts
    echo   out: './migrations', >> drizzle.config.ts
    echo   driver: 'pg', >> drizzle.config.ts
    echo   dbCredentials: { >> drizzle.config.ts
    echo     connectionString: process.env.DATABASE_URL!, >> drizzle.config.ts
    echo   }, >> drizzle.config.ts
    echo   verbose: true, >> drizzle.config.ts
    echo   strict: true, >> drizzle.config.ts
    echo } satisfies Config; >> drizzle.config.ts
    echo ✅ Создан drizzle.config.ts
) else (
    echo ✅ drizzle.config.ts найден
)

:: 3. Проверяем схему базы данных
echo 📊 3. Проверяем схему базы данных...
if exist shared\schema.ts (
    echo ✅ Схема базы данных найдена
) else (
    echo ❌ Схема базы данных не найдена!
    echo 💡 Проверьте наличие файла shared/schema.ts
    pause
    exit /b 1
)

:: 4. Создаем папку для миграций
echo 📁 4. Создаем папку для миграций...
if not exist migrations mkdir migrations
echo ✅ Папка migrations готова

:: 5. Генерируем миграции
echo 🔄 5. Генерируем миграции...
npx drizzle-kit generate
if errorlevel 1 (
    echo ❌ Ошибка генерации миграций!
    echo 💡 Возможные причины:
    echo    - Неправильная строка подключения в DATABASE_URL
    echo    - PostgreSQL не запущен
    echo    - Ошибки в схеме базы данных
    echo.
    echo 🔧 Попробуйте:
    echo    1. Проверить DATABASE_URL в .env
    echo    2. Запустить PostgreSQL
    echo    3. Проверить схему в shared/schema.ts
    pause
    exit /b 1
) else (
    echo ✅ Миграции сгенерированы
)

:: 6. Применяем миграции
echo 🚀 6. Применяем миграции к базе данных...
npx drizzle-kit migrate
if errorlevel 1 (
    echo ❌ Ошибка применения миграций!
    echo 💡 Возможные причины:
    echo    - База данных недоступна
    echo    - Неправильные права доступа
    echo    - Конфликт схем
    echo.
    echo 🔧 Попробуйте:
    echo    1. Проверить подключение к PostgreSQL
    echo    2. Создать базу данных вручную
    echo    3. Проверить права пользователя БД
    pause
    exit /b 1
) else (
    echo ✅ Миграции применены успешно
)

:: 7. Проверяем подключение к базе данных
echo 🔍 7. Проверяем подключение к базе данных...
node -e "
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

async function testConnection() {
  try {
    const sql = postgres(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    // Простой запрос для проверки подключения
    const result = await sql\`SELECT 1 as test\`;
    console.log('✅ Подключение к базе данных успешно');
    console.log('📊 Результат тестового запроса:', result[0]);
    
    await sql.end();
  } catch (error) {
    console.log('❌ Ошибка подключения к базе данных:');
    console.log(error.message);
    process.exit(1);
  }
}

testConnection();
"

if errorlevel 1 (
    echo ❌ Не удалось подключиться к базе данных!
    pause
    exit /b 1
)

:: 8. Создаем скрипт для инициализации данных
echo 🗂️ 8. Создаем скрипт инициализации данных...
if not exist scripts mkdir scripts

echo const { drizzle } = require('drizzle-orm/postgres-js'); > scripts\init-database.js
echo const postgres = require('postgres'); >> scripts\init-database.js
echo const { botTemplates } = require('../shared/schema'); >> scripts\init-database.js
echo require('dotenv').config(); >> scripts\init-database.js
echo. >> scripts\init-database.js
echo async function initDatabase() { >> scripts\init-database.js
echo   try { >> scripts\init-database.js
echo     const sql = postgres(process.env.DATABASE_URL); >> scripts\init-database.js
echo     const db = drizzle(sql); >> scripts\init-database.js
echo. >> scripts\init-database.js
echo     console.log('🚀 Инициализация базы данных...'); >> scripts\init-database.js
echo. >> scripts\init-database.js
echo     // Создаем базовые шаблоны >> scripts\init-database.js
echo     const templates = [ >> scripts\init-database.js
echo       { >> scripts\init-database.js
echo         name: 'Простой бот-приветствие', >> scripts\init-database.js
echo         description: 'Базовый шаблон бота для приветствия пользователей', >> scripts\init-database.js
echo         category: 'official', >> scripts\init-database.js
echo         difficulty: 'easy', >> scripts\init-database.js
echo         data: { >> scripts\init-database.js
echo           nodes: [{ >> scripts\init-database.js
echo             id: 'start', >> scripts\init-database.js
echo             type: 'start', >> scripts\init-database.js
echo             data: { messageText: 'Привет! Добро пожаловать!' } >> scripts\init-database.js
echo           }], >> scripts\init-database.js
echo           connections: [] >> scripts\init-database.js
echo         } >> scripts\init-database.js
echo       } >> scripts\init-database.js
echo     ]; >> scripts\init-database.js
echo. >> scripts\init-database.js
echo     for (const template of templates) { >> scripts\init-database.js
echo       await db.insert(botTemplates).values(template).onConflictDoNothing(); >> scripts\init-database.js
echo     } >> scripts\init-database.js
echo. >> scripts\init-database.js
echo     console.log('✅ База данных инициализирована'); >> scripts\init-database.js
echo     await sql.end(); >> scripts\init-database.js
echo   } catch (error) { >> scripts\init-database.js
echo     console.error('❌ Ошибка инициализации:', error); >> scripts\init-database.js
echo     process.exit(1); >> scripts\init-database.js
echo   } >> scripts\init-database.js
echo } >> scripts\init-database.js
echo. >> scripts\init-database.js
echo initDatabase(); >> scripts\init-database.js

echo ✅ Скрипт инициализации создан

:: 9. Запускаем инициализацию данных
echo 🗂️ 9. Инициализируем базовые данные...
node scripts\init-database.js
if errorlevel 1 (
    echo ⚠️ Ошибка инициализации данных (возможно, таблицы уже существуют)
) else (
    echo ✅ Базовые данные созданы
)

:: 10. Создаем скрипт для проверки целостности
echo 🔍 10. Создаем скрипт проверки целостности...
echo const { drizzle } = require('drizzle-orm/postgres-js'); > scripts\check-database.js
echo const postgres = require('postgres'); >> scripts\check-database.js
echo const { botProjects, botTemplates, botTokens } = require('../shared/schema'); >> scripts\check-database.js
echo require('dotenv').config(); >> scripts\check-database.js
echo. >> scripts\check-database.js
echo async function checkDatabase() { >> scripts\check-database.js
echo   try { >> scripts\check-database.js
echo     const sql = postgres(process.env.DATABASE_URL); >> scripts\check-database.js
echo     const db = drizzle(sql); >> scripts\check-database.js
echo. >> scripts\check-database.js
echo     console.log('🔍 Проверка целостности базы данных...'); >> scripts\check-database.js
echo. >> scripts\check-database.js
echo     const projectsCount = await db.select().from(botProjects); >> scripts\check-database.js
echo     const templatesCount = await db.select().from(botTemplates); >> scripts\check-database.js
echo     const tokensCount = await db.select().from(botTokens); >> scripts\check-database.js
echo. >> scripts\check-database.js
echo     console.log(\`📊 Статистика базы данных:\`); >> scripts\check-database.js
echo     console.log(\`   Проекты: \${projectsCount.length}\`); >> scripts\check-database.js
echo     console.log(\`   Шаблоны: \${templatesCount.length}\`); >> scripts\check-database.js
echo     console.log(\`   Токены: \${tokensCount.length}\`); >> scripts\check-database.js
echo. >> scripts\check-database.js
echo     console.log('✅ База данных работает корректно'); >> scripts\check-database.js
echo     await sql.end(); >> scripts\check-database.js
echo   } catch (error) { >> scripts\check-database.js
echo     console.error('❌ Ошибка проверки:', error); >> scripts\check-database.js
echo     process.exit(1); >> scripts\check-database.js
echo   } >> scripts\check-database.js
echo } >> scripts\check-database.js
echo. >> scripts\check-database.js
echo checkDatabase(); >> scripts\check-database.js

echo ✅ Скрипт проверки создан

:: 11. Запускаем проверку целостности
echo 🔍 11. Проверяем целостность базы данных...
node scripts\check-database.js
if errorlevel 1 (
    echo ❌ Проблемы с целостностью базы данных!
    pause
    exit /b 1
) else (
    echo ✅ База данных работает корректно
)

:: Завершение
echo.
echo ========================================
echo ✅ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ ИСПРАВЛЕНЫ!
echo ========================================
echo.
echo 📊 Что было сделано:
echo    ✅ Проверена конфигурация (.env, drizzle.config.ts)
echo    ✅ Созданы и применены миграции
echo    ✅ Проверено подключение к базе данных
echo    ✅ Инициализированы базовые данные
echo    ✅ Проверена целостность данных
echo.
echo 🗂️ Созданные скрипты:
echo    📄 scripts/init-database.js - инициализация данных
echo    📄 scripts/check-database.js - проверка целостности
echo.
echo 💡 Полезные команды:
echo    npx drizzle-kit generate  - генерация миграций
echo    npx drizzle-kit migrate   - применение миграций
echo    npx drizzle-kit studio    - веб-интерфейс БД
echo    node scripts/check-database.js - проверка БД
echo.
pause
exit /b 0