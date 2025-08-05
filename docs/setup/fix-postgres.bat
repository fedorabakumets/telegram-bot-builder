@echo off
chcp 65001 > nul
echo.
echo ================================
echo  Исправление PostgreSQL
echo ================================
echo.

echo Попробуйте следующие команды по очереди:
echo.
echo 1. Если пароль пустой:
echo psql -U postgres -c "CREATE DATABASE telegram_bot_builder;"
echo.
echo 2. Если пароль "admin":
echo set PGPASSWORD=admin
echo psql -U postgres -c "CREATE DATABASE telegram_bot_builder;"
echo.
echo 3. Если пароль "password":
echo set PGPASSWORD=password
echo psql -U postgres -c "CREATE DATABASE telegram_bot_builder;"
echo.
echo 4. Если пароль "123456":
echo set PGPASSWORD=123456
echo psql -U postgres -c "CREATE DATABASE telegram_bot_builder;"
echo.
echo ================================
echo  Альтернативное решение:
echo ================================
echo.
echo Откройте pgAdmin 4 и создайте базу данных вручную:
echo 1. Запустите pgAdmin 4
echo 2. Подключитесь к серверу PostgreSQL
echo 3. Правый клик на "Databases" 
echo 4. Create ^> Database
echo 5. Имя: telegram_bot_builder
echo 6. Сохранить
echo.
pause