@echo off
chcp 65001 > nul
echo.
echo ================================
echo  Telegram Bot Builder Setup
echo ================================
echo.

echo Проверяем Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! 
    echo Скачайте и установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js найден

echo.
echo Проверяем npm...
npm --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm не найден!
    pause
    exit /b 1
)
echo ✅ npm найден

echo.
echo Копируем файл настроек...
if not exist .env (
    if exist .env.example (
        copy .env.example .env > nul
        echo ✅ Файл .env создан из примера
        echo ⚠️ ВАЖНО: Отредактируйте .env файл и укажите правильные настройки БД!
    ) else (
        echo ❌ Файл .env.example не найден!
        pause
        exit /b 1
    )
) else (
    echo ✅ Файл .env уже существует
)

echo.
echo Устанавливаем зависимости...
npm install
if %errorlevel% neq 0 (
    echo ❌ Ошибка установки зависимостей!
    pause
    exit /b 1
)
echo ✅ Зависимости установлены

echo.
echo Проверяем подключение к базе данных...
echo Попытка создания таблиц...
npm run db:push
if %errorlevel% neq 0 (
    echo ❌ Ошибка работы с базой данных!
    echo Убедитесь что:
    echo 1. PostgreSQL установлен и запущен
    echo 2. База данных создана
    echo 3. Настройки в .env файле правильные
    echo.
    echo Откройте .env файл и проверьте настройки:
    notepad .env
    pause
    exit /b 1
)
echo ✅ База данных настроена

echo.
echo ================================
echo  Установка завершена успешно!
echo ================================
echo.
echo Для запуска проекта выполните:
echo npm run dev
echo.
echo Затем откройте браузер: http://localhost:5000
echo.
pause