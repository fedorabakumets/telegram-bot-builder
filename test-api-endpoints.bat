@echo off
setlocal enabledelayedexpansion
echo 🔍 ПОИСК ПРАВИЛЬНОГО API ENDPOINT
echo ================================

echo 📡 Тестируем различные endpoints для генерации бота...

REM Тестируем разные варианты API
set endpoints[0]=/api/projects/4/export
set endpoints[1]=/api/projects/4/generate
set endpoints[2]=/api/projects/4/bot
set endpoints[3]=/api/projects/4/python
set endpoints[4]=/api/generate/4
set endpoints[5]=/api/export/4
set endpoints[6]=/api/bot/4/export
set endpoints[7]=/api/bot/4/generate

echo.
echo 🧪 Тестируем GET запросы:
echo ========================

for /L %%i in (0,1,7) do (
    call set endpoint=%%endpoints[%%i]%%
    if defined endpoint (
        echo.
        echo 📤 GET !endpoint!
        curl -X GET "http://localhost:5000!endpoint!" ^
          -H "Accept: application/json" ^
          --silent ^
          --max-time 10 ^
          --write-out "Status: %%{http_code} | Size: %%{size_download}b | Time: %%{time_total}s" ^
          --output temp_response_%%i.txt
        
        REM Проверяем содержимое ответа
        if exist temp_response_%%i.txt (
            for %%A in (temp_response_%%i.txt) do set size=%%~zA
            if !size! gtr 50 (
                echo | set /p=" | Content: "
                powershell -Command "Get-Content temp_response_%%i.txt -Head 1 | ForEach-Object { $_.Substring(0, [Math]::Min($_.Length, 60)) }"
            )
        )
    )
)

echo.
echo.
echo 🧪 Тестируем POST запросы:
echo =========================

REM Создаем простые тестовые данные
echo {"botName":"TestBot","userDatabaseEnabled":false} > test_data.json

for /L %%i in (0,1,7) do (
    call set endpoint=%%endpoints[%%i]%%
    if defined endpoint (
        echo.
        echo 📤 POST !endpoint!
        curl -X POST "http://localhost:5000!endpoint!" ^
          -H "Content-Type: application/json" ^
          -H "Accept: text/plain" ^
          -d @test_data.json ^
          --silent ^
          --max-time 10 ^
          --write-out "Status: %%{http_code} | Size: %%{size_download}b | Time: %%{time_total}s" ^
          --output temp_post_response_%%i.txt
        
        REM Проверяем содержимое ответа
        if exist temp_post_response_%%i.txt (
            for %%A in (temp_post_response_%%i.txt) do set size=%%~zA
            if !size! gtr 50 (
                echo | set /p=" | Content: "
                powershell -Command "Get-Content temp_post_response_%%i.txt -Head 1 | ForEach-Object { $_.Substring(0, [Math]::Min($_.Length, 60)) }"
                
                REM Проверяем, это Python код?
                findstr /C:"import" temp_post_response_%%i.txt >nul
                if !errorlevel!==0 (
                    echo | set /p=" | ✅ PYTHON CODE FOUND!"
                    
                    REM Проверяем наши исправления
                    findstr /C:"Update" temp_post_response_%%i.txt >nul
                    if !errorlevel!==0 echo | set /p=" | ✅ Update"
                    
                    findstr /C:"ContextTypes" temp_post_response_%%i.txt >nul
                    if !errorlevel!==0 echo | set /p=" | ✅ ContextTypes"
                )
            )
        )
    )
)

echo.
echo.
echo 🔍 АНАЛИЗ РЕЗУЛЬТАТОВ:
echo =====================

REM Ищем файлы с Python кодом
echo 📋 Файлы с Python кодом:
for %%f in (temp_*.txt) do (
    findstr /C:"import" "%%f" >nul
    if !errorlevel!==0 (
        echo ✅ %%f содержит Python код
        
        REM Анализируем этот файл
        echo 🔍 Анализ %%f:
        findstr /C:"Update" "%%f" >nul
        if !errorlevel!==0 (
            echo   ✅ Update найден - ИСПРАВЛЕНИЕ РАБОТАЕТ!
        ) else (
            echo   ❌ Update НЕ найден
        )
        
        findstr /C:"ContextTypes" "%%f" >nul
        if !errorlevel!==0 (
            echo   ✅ ContextTypes найден - ИСПРАВЛЕНИЕ РАБОТАЕТ!
        ) else (
            echo   ❌ ContextTypes НЕ найден
        )
        
        echo   📄 Первые 5 строк:
        powershell -Command "Get-Content '%%f' -Head 5"
        echo.
    )
)

REM Очистка временных файлов
del temp_*.txt test_data.json 2>nul

echo 📋 Поиск завершен - нажмите любую клавишу
pause >nul