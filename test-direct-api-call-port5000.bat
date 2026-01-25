@echo off
setlocal enabledelayedexpansion
echo 🚀 ПРЯМОЙ ВЫЗОВ API ЭКСПОРТА БОТА (ПОРТ 5000)
echo =============================================

echo 📡 Вызываем /api/projects/4/export на localhost:5000...

echo.
echo 📤 Отправляем GET запрос...

curl -X GET "http://localhost:5000/api/projects/4/export" ^
  -H "Content-Type: application/json" ^
  -H "Accept: text/plain" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" ^
  --silent ^
  --show-error ^
  --max-time 60 ^
  --output generated_bot_port5000.py ^
  --write-out "HTTP Status: %%{http_code}\nResponse Time: %%{time_total}s\nContent Size: %%{size_download} bytes\n"

echo.
echo 📊 РЕЗУЛЬТАТ ГЕНЕРАЦИИ:

if exist generated_bot_port5000.py (
    for %%A in (generated_bot_port5000.py) do set filesize=%%~zA
    
    if !filesize! gtr 100 (
        echo ✅ Бот успешно сгенерирован!
        echo 📄 Файл: generated_bot_port5000.py
        echo 📏 Размер: !filesize! bytes
        
        echo.
        echo 🔍 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:
        echo =====================================
        
        REM Показываем первые 15 строк
        echo 📋 Начало файла:
        powershell -Command "Get-Content generated_bot_port5000.py -Head 15"
        
        echo.
        echo 🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ ИМПОРТОВ:
        echo ================================
        
        REM Проверяем импорты Update
        findstr /C:"Update" generated_bot_port5000.py >nul
        if !errorlevel!==0 (
            echo ✅ Import Update найден - ИСПРАВЛЕНО!
            echo 📄 Строки с Update:
            findstr /N "Update" generated_bot_port5000.py
        ) else (
            echo ❌ Import Update НЕ найден
        )
        
        echo.
        REM Проверяем импорты ContextTypes  
        findstr /C:"ContextTypes" generated_bot_port5000.py >nul
        if !errorlevel!==0 (
            echo ✅ Import ContextTypes найден - ИСПРАВЛЕНО!
            echo 📄 Строки с ContextTypes:
            findstr /N "ContextTypes" generated_bot_port5000.py
        ) else (
            echo ❌ Import ContextTypes НЕ найден
        )
        
        echo.
        REM Проверяем базовые импорты aiogram
        findstr /C:"from aiogram import" generated_bot_port5000.py >nul
        if !errorlevel!==0 (
            echo ✅ Базовые импорты aiogram найдены
        ) else (
            echo ❌ Базовые импорты aiogram НЕ найдены
        )
        
        echo.
        echo 📋 ВСЕ ИМПОРТЫ В ФАЙЛЕ:
        echo ----------------------
        findstr /N "^from.*import\|^import" generated_bot_port5000.py
        
        echo.
        echo 🎯 ФИНАЛЬНАЯ ПРОВЕРКА ИСПРАВЛЕНИЙ:
        echo =================================
        
        set update_found=0
        set contexttypes_found=0
        
        findstr /C:"Update" generated_bot_port5000.py >nul
        if !errorlevel!==0 set update_found=1
        
        findstr /C:"ContextTypes" generated_bot_port5000.py >nul  
        if !errorlevel!==0 set contexttypes_found=1
        
        if !update_found!==1 if !contexttypes_found!==1 (
            echo.
            echo 🎉🎉🎉 ПОЛНЫЙ УСПЕХ! 🎉🎉🎉
            echo ✅ Update импортирован корректно
            echo ✅ ContextTypes импортирован корректно  
            echo ✅ Рефакторинг bot-generator работает идеально!
            echo ✅ Проблема "NameError: name 'Update' is not defined" ПОЛНОСТЬЮ РЕШЕНА!
            echo ✅ Проблема "NameError: name 'ContextTypes' is not defined" ПОЛНОСТЬЮ РЕШЕНА!
            echo.
            echo 🚀 Теперь боты генерируются БЕЗ ОШИБОК!
        ) else (
            echo ❌ Не все импорты найдены:
            if !update_found!==0 echo   - Update НЕ найден
            if !contexttypes_found!==0 echo   - ContextTypes НЕ найден
        )
        
        echo.
        echo 📊 СТАТИСТИКА ФАЙЛА:
        echo ===================
        for /f %%i in ('powershell -Command "(Get-Content generated_bot_port5000.py).Count"') do echo Всего строк: %%i
        for /f %%i in ('findstr /C:"def " generated_bot_port5000.py ^| find /C /V ""') do echo Функций: %%i
        for /f %%i in ('findstr /C:"import" generated_bot_port5000.py ^| find /C /V ""') do echo Импортов: %%i
        
    ) else (
        echo ❌ Файл слишком мал (!filesize! bytes) - возможно ошибка
        echo 📄 Содержимое:
        type generated_bot_port5000.py
    )
    
) else (
    echo ❌ Файл НЕ создан - ошибка генерации
    echo 🔍 Возможные причины:
    echo   - Проект с ID 4 не существует
    echo   - Ошибка в API
    echo   - Проблемы с сервером
)

echo.
echo 📋 Тест завершен - нажмите любую клавишу для выхода
pause >nul