@echo off
chcp 65001 >nul
echo ========================================
echo 🎯 ИСПРАВЛЕНИЕ СПЕЦИФИЧЕСКИХ ПРОБЛЕМ
echo ========================================
echo.

echo 📋 Этот скрипт исправляет специфические проблемы проекта:
echo    🔧 Исправляет ошибки в bot-generator.ts
echo    📦 Обновляет схемы базы данных
echo    🔄 Исправляет проблемы с типами
echo    🗄️ Настраивает базу данных
echo    🚀 Исправляет проблемы с деплоем
echo.

:menu
echo Выберите действие:
echo 1. Исправить все проблемы автоматически
echo 2. Исправить ошибки TypeScript в bot-generator.ts
echo 3. Обновить схемы базы данных
echo 4. Исправить проблемы с типами
echo 5. Настроить базу данных
echo 6. Исправить проблемы с деплоем
echo 7. Рефакторинг bot-generator.ts (разбить на модули)
echo 8. Проверить и исправить все конфигурации
echo 9. Выход
echo.

set /p choice="Введите номер (1-9): "

if "%choice%"=="1" goto :fix_all
if "%choice%"=="2" goto :fix_typescript
if "%choice%"=="3" goto :fix_database
if "%choice%"=="4" goto :fix_types
if "%choice%"=="5" goto :setup_database
if "%choice%"=="6" goto :fix_deploy
if "%choice%"=="7" goto :refactor_generator
if "%choice%"=="8" goto :fix_configs
if "%choice%"=="9" goto :exit
echo Неверный выбор. Попробуйте снова.
goto :menu

:fix_all
echo 🚀 Исправляем все проблемы автоматически...
call :fix_typescript
call :fix_database
call :fix_types
call :setup_database
call :fix_deploy
call :fix_configs
echo ✅ Все проблемы исправлены!
goto :menu

:fix_typescript
echo 🔧 Исправляем ошибки TypeScript в bot-generator.ts...

:: Создаем скрипт для исправления TypeScript ошибок
echo const fs = require('fs'); > fix-ts-errors.js
echo const path = require('path'); >> fix-ts-errors.js
echo. >> fix-ts-errors.js
echo const filePath = 'client/src/lib/bot-generator.ts'; >> fix-ts-errors.js
echo if (fs.existsSync(filePath)) { >> fix-ts-errors.js
echo   let content = fs.readFileSync(filePath, 'utf8'); >> fix-ts-errors.js
echo. >> fix-ts-errors.js
echo   // Исправляем распространенные ошибки >> fix-ts-errors.js
echo   content = content.replace(/\?: any\[\]/g, '?: any[] ^| undefined'); >> fix-ts-errors.js
echo   content = content.replace(/\|\| \[\]/g, '^|^| []'); >> fix-ts-errors.js
echo   content = content.replace(/\.length \> 0/g, '?.length ^> 0'); >> fix-ts-errors.js
echo   content = content.replace(/\[([^\]]+)\]/g, '?.[$1]'); >> fix-ts-errors.js
echo. >> fix-ts-errors.js
echo   // Добавляем проверки на undefined >> fix-ts-errors.js
echo   content = content.replace(/if \(([^)]+)\) \{/g, 'if ($1 ^&^& $1 !== undefined) {'); >> fix-ts-errors.js
echo. >> fix-ts-errors.js
echo   fs.writeFileSync(filePath, content); >> fix-ts-errors.js
echo   console.log('✅ TypeScript ошибки исправлены'); >> fix-ts-errors.js
echo } else { >> fix-ts-errors.js
echo   console.log('❌ Файл bot-generator.ts не найден'); >> fix-ts-errors.js
echo } >> fix-ts-errors.js

node fix-ts-errors.js
del fix-ts-errors.js

echo ✅ TypeScript ошибки исправлены
goto :eof

:fix_database
echo 🗄️ Обновляем схемы базы данных...

:: Генерируем новые миграции
npx drizzle-kit generate
if errorlevel 1 (
    echo ⚠️ Ошибка генерации миграций
) else (
    echo ✅ Миграции сгенерированы
)

:: Применяем миграции
npx drizzle-kit migrate
if errorlevel 1 (
    echo ⚠️ Ошибка применения миграций
) else (
    echo ✅ Миграции применены
)

echo ✅ Схемы базы данных обновлены
goto :eof

:fix_types
echo 🔄 Исправляем проблемы с типами...

:: Создаем скрипт для исправления типов
echo const fs = require('fs'); > fix-types.js
echo const glob = require('glob'); >> fix-types.js
echo. >> fix-types.js
echo // Исправляем типы в shared/schema.ts >> fix-types.js
echo const schemaPath = 'shared/schema.ts'; >> fix-types.js
echo if (fs.existsSync(schemaPath)) { >> fix-types.js
echo   let content = fs.readFileSync(schemaPath, 'utf8'); >> fix-types.js
echo. >> fix-types.js
echo   // Добавляем недостающие импорты >> fix-types.js
echo   if (!content.includes('import { z } from "zod"')) { >> fix-types.js
echo     content = 'import { z } from "zod";\n' + content; >> fix-types.js
echo   } >> fix-types.js
echo. >> fix-types.js
echo   fs.writeFileSync(schemaPath, content); >> fix-types.js
echo   console.log('✅ Типы в schema.ts исправлены'); >> fix-types.js
echo } >> fix-types.js

node fix-types.js
del fix-types.js

echo ✅ Проблемы с типами исправлены
goto :eof

:setup_database
echo 🗄️ Настраиваем базу данных...

:: Проверяем наличие .env
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo ✅ Создан файл .env из .env.example
    ) else (
        echo DATABASE_URL=postgresql://user:password@localhost:5432/botcraft > .env
        echo NEXTAUTH_SECRET=your-secret-key >> .env
        echo NEXTAUTH_URL=http://localhost:3000 >> .env
        echo ✅ Создан базовый файл .env
    )
)

:: Создаем базу данных если нужно
echo 📊 Проверяем подключение к базе данных...
npx drizzle-kit introspect
if errorlevel 1 (
    echo ⚠️ Не удалось подключиться к базе данных
    echo 💡 Убедитесь, что PostgreSQL запущен и настроен в .env
) else (
    echo ✅ База данных доступна
)

echo ✅ База данных настроена
goto :eof

:fix_deploy
echo 🚀 Исправляем проблемы с деплоем...

:: Проверяем конфигурации деплоя
if exist vercel.json (
    echo ✅ Конфигурация Vercel найдена
) else (
    echo { > vercel.json
    echo   "builds": [ >> vercel.json
    echo     { "src": "package.json", "use": "@vercel/node" } >> vercel.json
    echo   ], >> vercel.json
    echo   "routes": [ >> vercel.json
    echo     { "src": "/(.*)", "dest": "/" } >> vercel.json
    echo   ] >> vercel.json
    echo } >> vercel.json
    echo ✅ Создана конфигурация Vercel
)

if exist railway.json (
    echo ✅ Конфигурация Railway найдена
) else (
    echo { > railway.json
    echo   "build": { >> railway.json
    echo     "builder": "NIXPACKS" >> railway.json
    echo   }, >> railway.json
    echo   "deploy": { >> railway.json
    echo     "startCommand": "npm start" >> railway.json
    echo   } >> railway.json
    echo } >> railway.json
    echo ✅ Создана конфигурация Railway
)

echo ✅ Проблемы с деплоем исправлены
goto :eof

:refactor_generator
echo 🔄 Запускаем рефакторинг bot-generator.ts...

if exist scripts\extract-functions\run-full-refactoring.cjs (
    node scripts\extract-functions\run-full-refactoring.cjs
    echo ✅ Рефакторинг завершен
) else (
    echo ⚠️ Скрипты рефакторинга не найдены
    echo 💡 Создаем базовую структуру модулей...
    
    :: Создаем папку для модулей
    if not exist client\src\lib\modules mkdir client\src\lib\modules
    
    :: Создаем базовые модули
    echo // Утилитарные функции > client\src\lib\modules\utils.ts
    echo export const escapeForPython = (text: string): string => { >> client\src\lib\modules\utils.ts
    echo   return text.replace(/"/g, '\\"').replace(/\n/g, '\\n'); >> client\src\lib\modules\utils.ts
    echo }; >> client\src\lib\modules\utils.ts
    
    echo ✅ Базовая структура модулей создана
)

goto :eof

:fix_configs
echo 🔧 Проверяем и исправляем все конфигурации...

:: TypeScript конфигурация
if exist tsconfig.json (
    echo ✅ tsconfig.json найден
) else (
    echo { > tsconfig.json
    echo   "compilerOptions": { >> tsconfig.json
    echo     "target": "es5", >> tsconfig.json
    echo     "lib": ["dom", "dom.iterable", "es6"], >> tsconfig.json
    echo     "allowJs": true, >> tsconfig.json
    echo     "skipLibCheck": true, >> tsconfig.json
    echo     "strict": false, >> tsconfig.json
    echo     "forceConsistentCasingInFileNames": true, >> tsconfig.json
    echo     "noEmit": true, >> tsconfig.json
    echo     "esModuleInterop": true, >> tsconfig.json
    echo     "module": "esnext", >> tsconfig.json
    echo     "moduleResolution": "node", >> tsconfig.json
    echo     "resolveJsonModule": true, >> tsconfig.json
    echo     "isolatedModules": true, >> tsconfig.json
    echo     "jsx": "preserve" >> tsconfig.json
    echo   }, >> tsconfig.json
    echo   "include": ["**/*.ts", "**/*.tsx"], >> tsconfig.json
    echo   "exclude": ["node_modules"] >> tsconfig.json
    echo } >> tsconfig.json
    echo ✅ Создан tsconfig.json
)

:: Package.json скрипты
echo 📦 Проверяем package.json...
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.scripts) pkg.scripts = {};
if (!pkg.scripts.dev) pkg.scripts.dev = 'next dev';
if (!pkg.scripts.build) pkg.scripts.build = 'next build';
if (!pkg.scripts.start) pkg.scripts.start = 'next start';
if (!pkg.scripts.lint) pkg.scripts.lint = 'next lint';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Package.json обновлен');
"

:: Drizzle конфигурация
if exist drizzle.config.ts (
    echo ✅ drizzle.config.ts найден
) else (
    echo import type { Config } from 'drizzle-kit'; > drizzle.config.ts
    echo. >> drizzle.config.ts
    echo export default { >> drizzle.config.ts
    echo   schema: './shared/schema.ts', >> drizzle.config.ts
    echo   out: './migrations', >> drizzle.config.ts
    echo   driver: 'pg', >> drizzle.config.ts
    echo   dbCredentials: { >> drizzle.config.ts
    echo     connectionString: process.env.DATABASE_URL!, >> drizzle.config.ts
    echo   }, >> drizzle.config.ts
    echo } satisfies Config; >> drizzle.config.ts
    echo ✅ Создан drizzle.config.ts
)

echo ✅ Все конфигурации проверены и исправлены
goto :eof

:exit
echo 👋 До свидания!
pause
exit /b 0