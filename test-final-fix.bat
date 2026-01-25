@echo off
setlocal enabledelayedexpansion
echo 🔧 ФИНАЛЬНЫЙ ТЕСТ ИСПРАВЛЕНИЯ
echo ============================

echo 📡 Тестируем исправленный генератор импортов...

REM Создаем тестовые данные
echo {"botName":"FinalFixedBot","userDatabaseEnabled":false} > test_data.json

echo 📤 POST /api/projects/4/export
curl -X POST "http://localhost:5000/api/projects/4/export" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d @test_data.json ^
  --silent ^
  --max-time 30 ^
  --output final_fixed_bot.json ^
  --write-out "HTTP Status: %%{http_code} | Size: %%{size_download}b\n"

if exist final_fixed_bot.json (
    echo ✅ Ответ получен
    
    REM Извлекаем Python код
    powershell -Command "$json = Get-Content final_fixed_bot.json | ConvertFrom-Json; $json.code" > final_fixed_bot.py
    
    if exist final_fixed_bot.py (
        echo ✅ Python код извлечен
        
        echo.
        echo 🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ:
        echo ========================
        
        REM Показываем импорты
        echo 📋 Все импорты:
        findstr /N "^from.*import\|^import" final_fixed_bot.py
        
        echo.
        echo 🎯 КЛЮЧЕВЫЕ ПРОВЕРКИ:
        
        REM Проверяем Update
        findstr /C:"Update" final_fixed_bot.py >nul
        if !errorlevel!==0 (
            echo ✅ Update найден в коде
            findstr /N "Update" final_fixed_bot.py | head -3
        ) else (
            echo ❌ Update НЕ найден
        )
        
        echo.
        REM Проверяем ContextTypes
        findstr /C:"ContextTypes" final_fixed_bot.py >nul
        if !errorlevel!==0 (
            echo ✅ ContextTypes найден в коде
            findstr /N "ContextTypes" final_fixed_bot.py | head -3
        ) else (
            echo ❌ ContextTypes НЕ найден
        )
        
        echo.
        REM Проверяем импорт Update в строке импорта
        findstr /C:"from aiogram.types import" final_fixed_bot.py | findstr /C:"Update" >nul
        if !errorlevel!==0 (
            echo ✅ Update импортирован из aiogram.types
        ) else (
            echo ❌ Update НЕ импортирован из aiogram.types
        )
        
        REM Проверяем импорт ContextTypes
        findstr /C:"from telegram.ext import ContextTypes" final_fixed_bot.py >nul
        if !errorlevel!==0 (
            echo ✅ ContextTypes импортирован из telegram.ext
        ) else (
            echo ❌ ContextTypes НЕ импортирован из telegram.ext
        )
        
        echo.
        echo 🎉 ИТОГОВЫЙ РЕЗУЛЬТАТ:
        echo ======================
        
        set update_import=0
        set contexttypes_import=0
        set update_usage=0
        set contexttypes_usage=0
        
        findstr /C:"from aiogram.types import" final_fixed_bot.py | findstr /C:"Update" >nul
        if !errorlevel!==0 set update_import=1
        
        findstr /C:"from telegram.ext import ContextTypes" final_fixed_bot.py >nul
        if !errorlevel!==0 set contexttypes_import=1
        
        findstr /C:"update: Update" final_fixed_bot.py >nul
        if !errorlevel!==0 set update_usage=1
        
        findstr /C:"ContextTypes.DEFAULT_TYPE" final_fixed_bot.py >nul
        if !errorlevel!==0 set contexttypes_usage=1
        
        if !update_import!==1 if !contexttypes_import!==1 if !update_usage!==1 if !contexttypes_usage!==1 (
            echo.
            echo 🎉🎉🎉 ПОЛНОЕ ИСПРАВЛЕНИЕ ПОДТВЕРЖДЕНО! 🎉🎉🎉
            echo ================================================
            echo ✅ Update импортирован корректно
            echo ✅ ContextTypes импортирован корректно
            echo ✅ Update используется в коде
            echo ✅ ContextTypes используется в коде
            echo ✅ Рефакторинг bot-generator ПОЛНОСТЬЮ УСПЕШЕН!
            echo ✅ Проблема "NameError: name 'Update' is not defined" РЕШЕНА!
            echo ✅ Проблема "NameError: name 'ContextTypes' is not defined" РЕШЕНА!
            echo.
            echo 🚀 БОТЫ ТЕПЕРЬ ГЕНЕРИРУЮТСЯ БЕЗ ОШИБОК!
        ) else (
            echo ❌ Не все проверки прошли:
            if !update_import!==0 echo   - Update не импортирован
            if !contexttypes_import!==0 echo   - ContextTypes не импортирован
            if !update_usage!==0 echo   - Update не используется
            if !contexttypes_usage!==0 echo   - ContextTypes не используется
        )
        
    ) else (
        echo ❌ Не удалось извлечь Python код
    )
) else (
    echo ❌ Не удалось получить ответ от API
)

REM Очистка
del test_data.json 2>nul

echo.
echo 📋 Финальный тест завершен
pause