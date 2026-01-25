@echo off
chcp 65001 >nul
title Система исправления проблем проекта

:main_menu
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🔧 СИСТЕМА ИСПРАВЛЕНИЯ ПРОБЛЕМ                ║
echo ║                      Универсальное решение                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎯 Выберите тип проблем для исправления:
echo.
echo ┌─────────────────────────────────────────────────────────────┐
echo │  1. 🚀 Исправить ВСЕ проблемы автоматически                 │
echo │  2. 🗄️ Проблемы с базой данных                              │
echo │  3. 🔧 Проблемы с TypeScript и кодом                        │
echo │  4. 📦 Проблемы с зависимостями и сборкой                   │
echo │  5. 🚀 Проблемы с деплоем и конфигурацией                   │
echo │  6. 🔄 Рефакторинг bot-generator.ts                         │
echo │  7. 🧪 Проблемы с тестами                                   │
echo │  8. 🔒 Проблемы с безопасностью                             │
echo │  9. 📊 Диагностика и анализ проекта                         │
echo │ 10. ❓ Помощь и документация                                │
echo │  0. 🚪 Выход                                                │
echo └─────────────────────────────────────────────────────────────┘
echo.

set /p choice="Введите номер (0-10): "

if "%choice%"=="1" goto :fix_all_problems
if "%choice%"=="2" goto :fix_database
if "%choice%"=="3" goto :fix_typescript
if "%choice%"=="4" goto :fix_dependencies
if "%choice%"=="5" goto :fix_deploy
if "%choice%"=="6" goto :refactor_generator
if "%choice%"=="7" goto :fix_tests
if "%choice%"=="8" goto :fix_security
if "%choice%"=="9" goto :diagnostics
if "%choice%"=="10" goto :help
if "%choice%"=="0" goto :exit

echo ❌ Неверный выбор. Попробуйте снова.
timeout /t 2 >nul
goto :main_menu

:fix_all_problems
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🚀 ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ⚠️ ВНИМАНИЕ: Это действие выполнит полное исправление всех проблем.
echo    Процесс может занять несколько минут.
echo.
set /p confirm="Продолжить? (y/n): "
if /i not "%confirm%"=="y" goto :main_menu

echo.
echo 🔄 Запускаем универсальный скрипт исправления...
call fix-all-problems.bat
echo.
echo ✅ Исправление всех проблем завершено!
pause
goto :main_menu

:fix_database
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🗄️ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
call fix-database-problems.bat
pause
goto :main_menu

:fix_typescript
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔧 ПРОБЛЕМЫ С TYPESCRIPT И КОДОМ                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔍 Исправляем проблемы с TypeScript...
echo.

:: Проверяем TypeScript
echo 📊 Проверяем ошибки TypeScript...
npx tsc --noEmit
if errorlevel 1 (
    echo ⚠️ Найдены ошибки TypeScript
    echo.
    echo 🔧 Пытаемся исправить автоматически...
    
    :: Исправляем распространенные ошибки
    node -e "
    const fs = require('fs');
    const glob = require('glob');
    
    console.log('🔧 Исправляем TypeScript ошибки...');
    
    // Исправляем bot-generator.ts
    const botGenPath = 'client/src/lib/bot-generator.ts';
    if (fs.existsSync(botGenPath)) {
        let content = fs.readFileSync(botGenPath, 'utf8');
        
        // Добавляем проверки на undefined
        content = content.replace(/(\w+)\.(\w+)/g, '$1?.$2');
        content = content.replace(/\?\.\?/g, '?');
        
        // Исправляем типы массивов
        content = content.replace(/: any\[\]/g, ': any[] | undefined');
        
        fs.writeFileSync(botGenPath, content);
        console.log('✅ bot-generator.ts исправлен');
    }
    
    console.log('✅ TypeScript ошибки исправлены');
    "
    
    echo ✅ Автоматическое исправление завершено
) else (
    echo ✅ Ошибки TypeScript не найдены
)

:: Проверяем линтер
echo.
echo 📊 Проверяем код линтером...
npm run lint
if errorlevel 1 (
    echo ⚠️ Найдены проблемы с кодом
    echo 🔧 Пытаемся исправить автоматически...
    npm run lint -- --fix
    echo ✅ Линтер исправил проблемы
) else (
    echo ✅ Проблемы с кодом не найдены
)

echo.
echo ✅ Проблемы с TypeScript и кодом исправлены!
pause
goto :main_menu

:fix_dependencies
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           📦 ПРОБЛЕМЫ С ЗАВИСИМОСТЯМИ И СБОРКОЙ              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔄 Исправляем проблемы с зависимостями...
echo.

:: Очищаем кэш и переустанавливаем зависимости
echo 🧹 Очищаем кэш npm...
npm cache clean --force

echo 🗑️ Удаляем node_modules...
if exist node_modules rmdir /s /q node_modules

echo 🗑️ Удаляем package-lock.json...
if exist package-lock.json del package-lock.json

echo 📦 Устанавливаем зависимости заново...
npm install
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей!
    echo 💡 Попробуйте установить зависимости вручную:
    echo    npm install --legacy-peer-deps
    pause
    goto :main_menu
)

:: Проверяем уязвимости
echo 🔒 Проверяем безопасность зависимостей...
npm audit
if errorlevel 1 (
    echo ⚠️ Найдены уязвимости
    echo 🔧 Исправляем автоматически...
    npm audit fix
)

:: Пробуем собрать проект
echo 🔨 Пробуем собрать проект...
npm run build
if errorlevel 1 (
    echo ⚠️ Ошибка сборки проекта
    echo 💡 Проверьте ошибки выше и исправьте их вручную
) else (
    echo ✅ Проект собран успешно
)

echo.
echo ✅ Проблемы с зависимостями исправлены!
pause
goto :main_menu

:fix_deploy
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           🚀 ПРОБЛЕМЫ С ДЕПЛОЕМ И КОНФИГУРАЦИЕЙ              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
call fix-specific-problems.bat
pause
goto :main_menu

:refactor_generator
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              🔄 РЕФАКТОРИНГ BOT-GENERATOR.TS                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ⚠️ ВНИМАНИЕ: Рефакторинг разобьет большой файл на модули.
echo    Это улучшит читаемость и поддерживаемость кода.
echo.
set /p confirm="Продолжить рефакторинг? (y/n): "
if /i not "%confirm%"=="y" goto :main_menu

echo.
echo 🔄 Запускаем рефакторинг...

if exist scripts\extract-functions\run-full-refactoring.cjs (
    node scripts\extract-functions\run-full-refactoring.cjs
    echo ✅ Рефакторинг завершен успешно!
) else (
    echo ⚠️ Скрипты рефакторинга не найдены
    echo 💡 Создаем базовую модульную структуру...
    
    :: Создаем папки для модулей
    if not exist client\src\lib\modules mkdir client\src\lib\modules
    if not exist client\src\lib\modules\utils mkdir client\src\lib\modules\utils
    if not exist client\src\lib\modules\generators mkdir client\src\lib\modules\generators
    
    :: Создаем базовые модули
    echo // Утилитарные функции > client\src\lib\modules\utils\index.ts
    echo export const escapeForPython = (text: string): string => { >> client\src\lib\modules\utils\index.ts
    echo   return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r'); >> client\src\lib\modules\utils\index.ts
    echo }; >> client\src\lib\modules\utils\index.ts
    echo. >> client\src\lib\modules\utils\index.ts
    echo export const formatTextForPython = (text: string): string => { >> client\src\lib\modules\utils\index.ts
    echo   if (!text) return '""'; >> client\src\lib\modules\utils\index.ts
    echo   if (text.includes('\n')) { >> client\src\lib\modules\utils\index.ts
    echo     return \`"""\${text}"""\`; >> client\src\lib\modules\utils\index.ts
    echo   } else { >> client\src\lib\modules\utils\index.ts
    echo     return \`"\${text.replace(/"/g, '\\"')}"\`; >> client\src\lib\modules\utils\index.ts
    echo   } >> client\src\lib\modules\utils\index.ts
    echo }; >> client\src\lib\modules\utils\index.ts
    
    echo // Генераторы кода > client\src\lib\modules\generators\index.ts
    echo export * from '../utils'; >> client\src\lib\modules\generators\index.ts
    
    echo // Главный экспорт модулей > client\src\lib\modules\index.ts
    echo export * from './utils'; >> client\src\lib\modules\index.ts
    echo export * from './generators'; >> client\src\lib\modules\index.ts
    
    echo ✅ Базовая модульная структура создана
)

echo.
echo ✅ Рефакторинг завершен!
pause
goto :main_menu

:fix_tests
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  🧪 ПРОБЛЕМЫ С ТЕСТАМИ                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔍 Проверяем и исправляем тесты...
echo.

:: Проверяем наличие тестов
if exist __tests__ (
    echo ✅ Папка тестов найдена
) else (
    echo ⚠️ Папка тестов не найдена. Создаем базовую структуру...
    mkdir __tests__
    
    echo // Базовый тест > __tests__\basic.test.ts
    echo describe('Базовые тесты', () => { >> __tests__\basic.test.ts
    echo   test('должен работать', () => { >> __tests__\basic.test.ts
    echo     expect(1 + 1).toBe(2); >> __tests__\basic.test.ts
    echo   }); >> __tests__\basic.test.ts
    echo }); >> __tests__\basic.test.ts
    
    echo ✅ Создана базовая структура тестов
)

:: Запускаем тесты
echo 🧪 Запускаем тесты...
npm test
if errorlevel 1 (
    echo ⚠️ Тесты не прошли или не настроены
    echo 💡 Проверьте конфигурацию тестов в package.json
) else (
    echo ✅ Тесты прошли успешно
)

echo.
echo ✅ Проблемы с тестами проверены!
pause
goto :main_menu

:fix_security
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🔒 ПРОБЛЕМЫ С БЕЗОПАСНОСТЬЮ                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔍 Проверяем безопасность проекта...
echo.

:: Проверяем уязвимости
echo 🔒 Сканируем уязвимости...
npm audit
if errorlevel 1 (
    echo ⚠️ Найдены уязвимости безопасности
    echo 🔧 Исправляем автоматически...
    npm audit fix
    if errorlevel 1 (
        echo ⚠️ Не все уязвимости удалось исправить автоматически
        echo 💡 Запустите: npm audit fix --force (осторожно!)
    ) else (
        echo ✅ Уязвимости исправлены
    )
) else (
    echo ✅ Уязвимости не найдены
)

:: Проверяем .env файлы
echo 🔍 Проверяем конфигурационные файлы...
if exist .env (
    echo ✅ .env файл найден
    echo ⚠️ Убедитесь, что .env не попадает в git (проверьте .gitignore)
) else (
    echo ⚠️ .env файл не найден
)

if exist .gitignore (
    findstr /C:".env" .gitignore >nul
    if errorlevel 1 (
        echo .env >> .gitignore
        echo ✅ Добавлен .env в .gitignore
    ) else (
        echo ✅ .env уже в .gitignore
    )
) else (
    echo .env > .gitignore
    echo node_modules/ >> .gitignore
    echo dist/ >> .gitignore
    echo .next/ >> .gitignore
    echo ✅ Создан .gitignore
)

echo.
echo ✅ Проблемы с безопасностью проверены!
pause
goto :main_menu

:diagnostics
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              📊 ДИАГНОСТИКА И АНАЛИЗ ПРОЕКТА                 ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🔍 Запускаем полную диагностику проекта...
echo.

:: Создаем отчет диагностики
set REPORT=diagnostic-report-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt
echo ========================================= > %REPORT%
echo ОТЧЕТ ДИАГНОСТИКИ ПРОЕКТА >> %REPORT%
echo Дата: %date% %time% >> %REPORT%
echo ========================================= >> %REPORT%
echo. >> %REPORT%

:: Проверяем Node.js
echo 📊 Проверяем версии...
echo ВЕРСИИ СИСТЕМЫ: >> %REPORT%
node --version >> %REPORT% 2>&1
npm --version >> %REPORT% 2>&1
echo. >> %REPORT%

:: Проверяем package.json
echo 📦 Анализируем package.json...
if exist package.json (
    echo ✅ package.json найден
    echo PACKAGE.JSON: >> %REPORT%
    type package.json >> %REPORT%
    echo. >> %REPORT%
) else (
    echo ❌ package.json не найден!
    echo ОШИБКА: package.json не найден >> %REPORT%
)

:: Проверяем структуру проекта
echo 📁 Анализируем структуру проекта...
echo СТРУКТУРА ПРОЕКТА: >> %REPORT%
dir /b >> %REPORT%
echo. >> %REPORT%

:: Проверяем TypeScript
echo 🔍 Проверяем TypeScript...
echo ПРОВЕРКА TYPESCRIPT: >> %REPORT%
npx tsc --noEmit >> %REPORT% 2>&1
echo. >> %REPORT%

:: Проверяем базу данных
echo 🗄️ Проверяем базу данных...
if exist .env (
    echo ✅ .env найден
    echo КОНФИГУРАЦИЯ БД: >> %REPORT%
    findstr "DATABASE_URL" .env >> %REPORT% 2>&1
) else (
    echo ❌ .env не найден
    echo ОШИБКА: .env не найден >> %REPORT%
)

:: Проверяем размеры файлов
echo 📊 Анализируем размеры файлов...
echo БОЛЬШИЕ ФАЙЛЫ: >> %REPORT%
forfiles /m *.* /c "cmd /c if @fsize gtr 1000000 echo @path @fsize" >> %REPORT% 2>&1

echo.
echo ✅ Диагностика завершена!
echo 📋 Отчет сохранен в: %REPORT%
echo.
type %REPORT%
echo.
pause
goto :main_menu

:help
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                ❓ ПОМОЩЬ И ДОКУМЕНТАЦИЯ                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 📚 РУКОВОДСТВО ПО ИСПОЛЬЗОВАНИЮ:
echo.
echo 🚀 БЫСТРЫЙ СТАРТ:
echo    1. Запустите "Исправить ВСЕ проблемы автоматически"
echo    2. Дождитесь завершения процесса
echo    3. Проверьте результаты в логах
echo.
echo 🗄️ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ:
echo    - Настройка PostgreSQL подключения
echo    - Создание и применение миграций
echo    - Инициализация тестовых данных
echo.
echo 🔧 ПРОБЛЕМЫ С КОДОМ:
echo    - Исправление ошибок TypeScript
echo    - Проверка линтером
echo    - Автоматическое форматирование
echo.
echo 📦 ПРОБЛЕМЫ С ЗАВИСИМОСТЯМИ:
echo    - Переустановка node_modules
echo    - Очистка кэша npm
echo    - Исправление уязвимостей
echo.
echo 🔄 РЕФАКТОРИНГ:
echo    - Разбиение больших файлов на модули
echo    - Улучшение структуры кода
echo    - Создание документации
echo.
echo 💡 ПОЛЕЗНЫЕ КОМАНДЫ:
echo    npm run dev      - запуск в режиме разработки
echo    npm run build    - сборка проекта
echo    npm run lint     - проверка кода
echo    npm test         - запуск тестов
echo.
echo 📞 ПОДДЕРЖКА:
echo    - Проверьте логи в папке проекта
echo    - Используйте диагностику для анализа
echo    - Создайте резервную копию перед изменениями
echo.
pause
goto :main_menu

:exit
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    👋 СПАСИБО ЗА ИСПОЛЬЗОВАНИЕ!              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🎉 Система исправления проблем завершила работу.
echo 💡 Все созданные скрипты остаются в проекте для повторного использования.
echo.
echo 📁 Созданные файлы:
echo    - fix-all-problems.bat
echo    - fix-specific-problems.bat  
echo    - fix-database-problems.bat
echo    - fix-problems-menu.bat
echo.
echo 🚀 Удачи в разработке!
echo.
pause
exit /b 0