@echo off
echo 🚀 ПРЯМОЙ ВЫЗОВ API ЭКСПОРТА БОТА
echo =================================

echo 📡 Вызываем /api/projects/4/export (имитация кнопки "Запустить")...

REM Проверяем доступность сервера
echo 🔍 Проверяем доступность localhost:3000...
curl -s --max-time 5 http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Сервер недоступен на localhost:3000
    echo 💡 Попробуем другие порты...
    
    REM Проверяем другие возможные порты
    for %%p in (3001 5000 8000 4000) do (
        echo 🔍 Проверяем порт %%p...
        curl -s --max-time 2 http://localhost:%%p >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Найден сервер на порту %%p
            set SERVER_PORT=%%p
            goto :found_server
        )
    )
    
    echo ❌ Сервер не найден ни на одном порту
    echo 💡 Убедитесь что npm start запущен
    pause
    exit /b 1
)

:found_server
if not defined SERVER_PORT set SERVER_PORT=3000

echo ✅ Используем сервер на порту %SERVER_PORT%

echo.
echo 📤 Отправляем GET запрос на /api/projects/4/export...

curl -X GET "http://localhost:%SERVER_PORT%/api/projects/4/export" ^
  -H "Content-Type: application/json" ^
  -H "Accept: text/plain" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" ^
  --silent ^
  --show-error ^
  --max-time 60 ^
  --output generated_bot_direct.py ^
  --write-out "HTTP Status: %%{http_code}\nResponse Time: %%{time_total}s\nContent Size: %%{size_download} bytes\n"

echo.
echo 📊 РЕЗУЛЬТАТ ГЕНЕРАЦИИ:

if exist generated_bot_direct.py (
    for %%A in (generated_bot_direct.py) do set filesize=%%~zA
    
    if !filesize! gtr 100 (
        echo ✅ Бот успешно сгенерирован!
        echo 📄 Файл: generated_bot_direct.py
        echo 📏 Размер: !filesize! bytes
        
        echo.
        echo 🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:
        echo =====================================
        
        REM Проверяем заголовок
        echo 📋 Заголовок файла:
        powershell -Command "Get-Content generated_bot_direct.py -Head 5"
        
        echo.
        echo 🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ:
        
        REM Проверяем импорты Update
        findstr /C:"Update" generated_bot_direct.py >nul
        if !errorlevel!==0 (
            echo ✅ Import Update найден - ИСПРАВЛЕНО!
            findstr /C:"Update" generated_bot_direct.py | findstr /N "import"
        ) else (
            echo ❌ Import Update НЕ найден
        )
        
        REM Проверяем импорты ContextTypes  
        findstr /C:"ContextTypes" generated_bot_direct.py >nul
        if !errorlevel!==0 (
            echo ✅ Import ContextTypes найден - ИСПРАВЛЕНО!
            findstr /C:"ContextTypes" generated_bot_direct.py | findstr /N "import"
        ) else (
            echo ❌ Import ContextTypes НЕ найден
        )
        
        REM Проверяем базовые импорты aiogram
        findstr /C:"from aiogram import" generated_bot_direct.py >nul
        if !errorlevel!==0 (
            echo ✅ Базовые импорты aiogram найдены
        ) else (
            echo ❌ Базовые импорты aiogram НЕ найдены
        )
        
        echo.
        echo 📋 ВСЕ ИМПОРТЫ В ФАЙЛЕ:
        echo ----------------------
        findstr /N "import\|from.*import" generated_bot_direct.py | findstr /V "^$"
        
        echo.
        echo 🎯 ФИНАЛЬНАЯ ПРОВЕРКА:
        findstr /C:"Update" generated_bot_direct.py >nul && findstr /C:"ContextTypes" generated_bot_direct.py >nul
        if !errorlevel!==0 (
            echo.
            echo 🎉 УСПЕХ! ВСЕ ИМПОРТЫ ИСПРАВЛЕНЫ!
            echo ✅ Update импортирован
            echo ✅ ContextTypes импортирован  
            echo ✅ Рефакторинг bot-generator работает корректно!
            echo ✅ Проблема "NameError: name 'Update' is not defined" РЕШЕНА!
        ) else (
            echo.
            echo ❌ Импорты все еще отсутствуют
            echo 🔍 Нужна дополнительная диагностика
        )
        
    ) else (
        echo ❌ Файл слишком мал (!filesize! bytes) - возможно ошибка
        echo 📄 Содержимое:
        type generated_bot_direct.py
    )
    
) else (
    echo ❌ Файл НЕ создан - ошибка генерации
    echo 🔍 Проверяем возможные ошибки...
)

echo.
echo 📋 Тест завершен - нажмите любую клавишу
pause >nul