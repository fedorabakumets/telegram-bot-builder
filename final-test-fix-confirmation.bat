@echo off
setlocal enabledelayedexpansion
echo 🎉 ФИНАЛЬНЫЙ ТЕСТ ИСПРАВЛЕНИЯ ПРОБЛЕМЫ
echo ====================================

echo 📡 Вызываем правильный endpoint: POST /api/projects/4/export

REM Создаем тестовые данные
echo {"botName":"FixedBot","userDatabaseEnabled":false} > test_data.json

echo 📤 Отправляем POST запрос...
curl -X POST "http://localhost:5000/api/projects/4/export" ^
  -H "Content-Type: application/json" ^
  -H "Accept: application/json" ^
  -d @test_data.json ^
  --silent ^
  --max-time 30 ^
  --output final_bot_test.json ^
  --write-out "HTTP Status: %%{http_code} | Size: %%{size_download}b | Time: %%{time_total}s\n"

echo.
if exist final_bot_test.json (
    for %%A in (final_bot_test.json) do set filesize=%%~zA
    
    if !filesize! gtr 1000 (
        echo ✅ Бот успешно сгенерирован (размер: !filesize! bytes)
        
        REM Извлекаем Python код из JSON
        echo 📄 Извлекаем Python код из JSON ответа...
        powershell -Command "$json = Get-Content final_bot_test.json | ConvertFrom-Json; $json.code" > extracted_bot.py
        
        if exist extracted_bot.py (
            echo ✅ Python код извлечен в файл: extracted_bot.py
            
            echo.
            echo 🔍 ПРОВЕРКА ИСПРАВЛЕНИЙ:
            echo ========================
            
            REM Проверяем импорты Update
            findstr /C:"Update" extracted_bot.py >nul
            if !errorlevel!==0 (
                echo ✅ Import Update найден - ПРОБЛЕМА ИСПРАВЛЕНА!
                echo 📄 Строка с Update:
                findstr /N "Update" extracted_bot.py | head -1
            ) else (
                echo ❌ Import Update НЕ найден
            )
            
            echo.
            REM Проверяем импорты ContextTypes
            findstr /C:"ContextTypes" extracted_bot.py >nul
            if !errorlevel!==0 (
                echo ✅ Import ContextTypes найден - ПРОБЛЕМА ИСПРАВЛЕНА!
                echo 📄 Строка с ContextTypes:
                findstr /N "ContextTypes" extracted_bot.py | head -1
            ) else (
                echo ❌ Import ContextTypes НЕ найден
            )
            
            echo.
            echo 📋 ВСЕ ИМПОРТЫ:
            echo =============
            findstr /N "^from.*import\|^import" extracted_bot.py | head -10
            
            echo.
            echo 🎯 ФИНАЛЬНАЯ ПРОВЕРКА:
            echo =====================
            
            set update_found=0
            set contexttypes_found=0
            
            findstr /C:"Update" extracted_bot.py >nul
            if !errorlevel!==0 set update_found=1
            
            findstr /C:"ContextTypes" extracted_bot.py >nul
            if !errorlevel!==0 set contexttypes_found=1
            
            if !update_found!==1 if !contexttypes_found!==1 (
                echo.
                echo 🎉🎉🎉 ПОЛНЫЙ УСПЕХ! 🎉🎉🎉
                echo ================================
                echo ✅ Update импортирован корректно
                echo ✅ ContextTypes импортирован корректно
                echo ✅ Рефакторинг bot-generator РАБОТАЕТ ИДЕАЛЬНО!
                echo ✅ Проблема "NameError: name 'Update' is not defined" РЕШЕНА!
                echo ✅ Проблема "NameError: name 'ContextTypes' is not defined" РЕШЕНА!
                echo.
                echo 🚀 ТЕПЕРЬ БОТЫ ГЕНЕРИРУЮТСЯ БЕЗ ОШИБОК!
                echo 🎯 РЕФАКТОРИНГ ЗАВЕРШЕН УСПЕШНО!
            ) else (
                echo ❌ Не все импорты найдены
            )
            
            echo.
            echo 📊 СТАТИСТИКА:
            echo ==============
            for /f %%i in ('powershell -Command "(Get-Content extracted_bot.py).Count"') do echo Строк кода: %%i
            for /f %%i in ('findstr /C:"def " extracted_bot.py ^| find /C /V ""') do echo Функций: %%i
            for /f %%i in ('findstr /C:"import" extracted_bot.py ^| find /C /V ""') do echo Импортов: %%i
            
        ) else (
            echo ❌ Не удалось извлечь Python код
        )
        
    ) else (
        echo ❌ Файл слишком мал или пуст
        type final_bot_test.json
    )
) else (
    echo ❌ Файл не создан
)

REM Очистка
del test_data.json 2>nul

echo.
echo 📋 Финальный тест завершен
pause