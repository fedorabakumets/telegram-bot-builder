@echo off
chcp 65001 > nul
echo.
echo Создание файла .env с вашими настройками...
echo.

set /p password="Введите пароль от PostgreSQL: "

echo # База данных PostgreSQL > .env
echo DATABASE_URL=postgresql://postgres:%password%@localhost:5432/telegram_bot_builder >> .env
echo PGHOST=localhost >> .env
echo PGPORT=5432 >> .env
echo PGDATABASE=telegram_bot_builder >> .env
echo PGUSER=postgres >> .env
echo PGPASSWORD=%password% >> .env
echo. >> .env
echo # Секретный ключ для сессий >> .env
echo SESSION_SECRET=your-super-secret-session-key-here-change-this-in-production >> .env
echo. >> .env
echo # Режим работы >> .env
echo NODE_ENV=development >> .env

echo.
echo ✅ Файл .env создан с паролем: %password%
echo.
echo Теперь попробуйте:
echo npm run db:push
echo.
pause