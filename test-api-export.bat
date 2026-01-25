@echo off
echo 🚀 ТЕСТ API ЭКСПОРТА БОТА
echo ========================

echo 📡 Отправляем запрос на /api/projects/4/export...

curl -X POST "http://localhost:5000/api/projects/4/export" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  --silent ^
  --show-error ^
  --max-time 30 ^
  --output bot_export_result.py ^
  --write-out "HTTP Status: %%{http_code}\nTime: %%{time_total}s\nSize: %%{size_download} bytes\n"

echo.
echo 📊 Результат запроса:

if exist bot_export_result.py (
    echo ✅ Файл бота сгенерирован: bot_export_result.py
    
    echo.
    echo 📏 Размер файла:
    for %%A in (bot_export_result.py) do echo %%~zA bytes
    
    echo.
    echo 🔍 Первые 20 строк сгенерированного кода:
    echo ----------------------------------------
    powershell -Command "Get-Content bot_export_result.py -Head 20"
    echo ----------------------------------------
    
    echo.
    echo 🔍 Проверяем наличие исправленных импортов:
    findstr /C:"from aiogram.types import" bot_export_result.py >nul
    if %errorlevel%==0 (
        echo ✅ Импорты aiogram.types найдены
        findstr /C:"Update" bot_export_result.py >nul
        if %errorlevel%==0 (
            echo ✅ Import Update найден - ПРОБЛЕМА ИСПРАВЛЕНА!
        ) else (
            echo ❌ Import Update НЕ найден
        )
    ) else (
        echo ❌ Импорты aiogram.types не найдены
    )
    
    findstr /C:"from telegram.ext import ContextTypes" bot_export_result.py >nul
    if %errorlevel%==0 (
        echo ✅ Import ContextTypes найден - ПРОБЛЕМА ИСПРАВЛЕНА!
    ) else (
        echo ❌ Import ContextTypes НЕ найден
    )
    
    echo.
    echo 🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:
    findstr /C:"Update" bot_export_result.py >nul && findstr /C:"ContextTypes" bot_export_result.py >nul
    if %errorlevel%==0 (
        echo ✅ ВСЕ ИМПОРТЫ ИСПРАВЛЕНЫ! Рефакторинг успешен!
    ) else (
        echo ❌ Импорты все еще отсутствуют
    )
    
) else (
    echo ❌ Файл бота НЕ сгенерирован
    echo 🔍 Проверяем ошибки...
    if exist bot_export_result.py (
        echo Содержимое ответа:
        type bot_export_result.py
    )
)

echo.
echo 📋 Тест завершен
pause